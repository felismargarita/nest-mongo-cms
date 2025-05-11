import { SchemaConfig, PluginType } from 'nest-mongo-cms';
import { buildFilter } from '../utils/buildFilter';


type PluginConfigType = {
  max?: number;
  collection?: string;
} | boolean


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

const VersionControl = (_pluginParams: PluginConfigType): PluginType=> {

  const inject = (schema: string, schemaConfig: SchemaConfig) => {
    const { enabled, config: { collection, max } = {} } = parseConfig(_pluginParams)
    if (!enabled) return schemaConfig;


    const hooks = schemaConfig.hooks ?? {};
    const versionCollection = collection ?? DEFAULT_MAX_VERSION_SCHEMA(schema);
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
        pid: currentDocument._id,
        operationAt: new Date(),
        operationType: 'update',
        data: currentDocument,
      });

      /**
       * clear those old versions
       */
      const obsoleteVersions = await collection
      .find({
        pid: currentDocument._id,
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
        pid: document._id,
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
          filter = {},
          sort,
          skip = 0,
          limit = 10
        } = params.context.body
        return params.rawDb
        .getClient()
        .db()
        .collection(versionCollection)
        .find(buildFilter(filter))
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray()
      }
    })
    hooks.operation = opearation;
    // ################################################


    schemaConfig.hooks = hooks;
    
    return schemaConfig;
  }

  return {
    name: 'VersionControl',
    inject,
    priority: 0,
    depends: [],
  }
}

export { VersionControl }
