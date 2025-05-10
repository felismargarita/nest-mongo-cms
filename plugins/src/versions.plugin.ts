import { OptionsType, PluginType } from 'nest-mongo-cms';


type PluginConfigType = {
  max?: number;
  collection?: string;
} | boolean

type VersionControlParams = {
  [schema: string]: PluginConfigType
}

const DEFAULT_MAX_VERSION_COUNT = 50;

const DEFAULT_MAX_VERSION_SCHEMA = (schema: string) => `__${schema}_versions`;

const parseConfig = (config: PluginConfigType) => {
  
  if (config === true) {
    return {
      enabled: true,
      config: { max: DEFAULT_MAX_VERSION_COUNT, collection: '' }
    }
  }
  if (config === false) {
    return {
      enabled: false 
    }
  }
  if (['number', 'function', 'symbol', 'bigint', 'string'].includes(typeof config) || config === undefined) {
    return {
      enabled: false 
    }
  }

  if ((typeof config.max === 'number' && config.max <= 0) || typeof config.max !== 'number') {
    config.max = DEFAULT_MAX_VERSION_COUNT
  }

  if (typeof config.collection !== 'string' || !config.collection) {
    config.collection = ''
  }
  return {
    enabled: true,
    config
  }
}

const VersionControl = (_pluginParams: VersionControlParams): PluginType=> {

  const inject = (options: OptionsType) => {
    const { schemas: originalSchemas = {}, ...rest } = options;

    for (const [schemaKey, _pluginConfigs] of Object.entries(_pluginParams ?? {})) {
      const { enabled, config: pluginConfigs } = parseConfig(_pluginConfigs)
      if (!enabled) return

      const { collection, max } = pluginConfigs

      const schemaOptions = originalSchemas[schemaKey] ?? {};

      const hooks = schemaOptions.hooks ?? {};
      const versionCollection = collection ?? DEFAULT_MAX_VERSION_SCHEMA(schemaKey);
      /**
       * Version Control for Create
       */
      const afterCreateHooks = hooks.afterCreate ?? []

      afterCreateHooks.unshift(async (params) => {
        const { document, rawDb } = params as any;
        const client = rawDb.getClient();
        
        await client.db().collection(versionCollection).insertOne({
          pid: document._id,
          operationAt: new Date(),
          operationType: 'create',
          data: document,
        });
        return document;
      });
      hooks.afterCreate = afterCreateHooks;
      // ################################################
      /**
       * Version Control for Update
       */
      const afterUpdateHooks = hooks.afterUpdate ?? []
      afterUpdateHooks.unshift(async (params) => {
        const { currentDocument, rawDb } = params

        const collection = rawDb.getClient().db().collection(versionCollection);
        
        /**
         * insert the current version
         */
        await collection.insertOne({
          pid: (currentDocument as any)._id,
          operationAt: new Date(),
          operationType: 'update',
          data: currentDocument,
        });

        /**
         * clear those old versions
         */
        const obsoleteVersions = await collection
        .find({
          pid: (currentDocument as any)._id,
          operationType: 'update'
        })
        .sort({ operationAt: 'desc' })
        .skip(max)
        .toArray();

        for (const obsoleteVersion of obsoleteVersions) {
          await collection.deleteOne({ _id: obsoleteVersion._id })
        }

        return currentDocument;
      });

      hooks.afterUpdate = afterUpdateHooks
      // ################################################

      /**
       * Version Control for delete
       */
      const afterDeleteHooks = hooks.afterDelete ?? []

      afterDeleteHooks.unshift(async (params) => {
        const { document, rawDb } = params
        const client = rawDb.getClient();
        await client.db().collection(versionCollection).insertOne({
          pid: (document as any)._id,
          operationAt: new Date(),
          operationType: 'delete',
          data: document,
        });
      });
      hooks.afterDelete = afterDeleteHooks

      // ################################################


      /**
       * inject opearations
       * 
       */
      const opearation = hooks.operation ?? []
      opearation.unshift({
        operationType: 'versions',
        action: 'list',
        hook: async (params) => {
          const {
            filter,
            sort,
            skip = 0,
            limit = 10
          } = params.context.body
          return params.rawDb
          .getClient()
          .db()
          .collection(versionCollection)
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray()
        }
      })
      hooks.operation = opearation;
      // ################################################


      schemaOptions.hooks = hooks;
      originalSchemas[schemaKey] = schemaOptions;
  
    }
    return {
      ...rest,
      schemas: originalSchemas
    }
  }

  return {
    name: 'VersionControl',
    inject,
    priority: 0,
    depends: [],
  }
}

export { VersionControl }
