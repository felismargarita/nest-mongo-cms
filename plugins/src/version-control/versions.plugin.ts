import { SchemaConfig, PluginType } from 'nest-mongo-cms';
import { buildFilter } from '../utils/buildFilter';


type PluginConfigType = {
  max?: number;
  collection?: string;
} | boolean


const DEFAULT_MAX_VERSION_COUNT = Number.MAX_VALUE;

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
      const { pureDocument, document, rawDb, db } = params;
      params.defer(async () => {
        const client = rawDb.getClient();
        await client.db().collection(versionCollection).insertOne(
          {
            pid: pureDocument._id,
            operationAt: new Date(),
            operationType: 'create',
            data: pureDocument,
          },
          {
            session: await db.mongoSession.getMongoSession()
          }
        );
      })
      return document;
    });
    hooks.afterCreate = afterCreateHooks;
    // ################################################
    /**
     * Version Control for Update
     */
    const afterUpdateHooks = hooks.afterUpdate ?? []
    afterUpdateHooks.unshift(async (params) => {
      const { pureCurrentDocument, currentDocument , rawDb, db } = params

      params.defer(async () => {
        const collection = rawDb.getClient().db().collection(versionCollection);
        /**
         * insert the current version
         */
        await collection.insertOne(
          {
            pid: pureCurrentDocument._id,
            operationAt: new Date(),
            operationType: 'update',
            data: pureCurrentDocument,
          },
          {
            session: await db.mongoSession.getMongoSession()
          }
        );

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
          await collection.deleteOne({ _id: obsoleteVersion._id }, { session: await db.mongoSession.getMongoSession() })
        }
      })
      return currentDocument;
    });

    hooks.afterUpdate = afterUpdateHooks
    // ################################################

    /**
     * Version Control for delete
     */
    const afterDeleteHooks = hooks.afterDelete ?? []

    afterDeleteHooks.unshift(async (params) => {
      const { pureDocument, rawDb, db } = params
      params.defer(async () => {
        const client = rawDb.getClient();
        await client.db().collection(versionCollection).insertOne({
          pid: pureDocument._id,
          operationAt: new Date(),
          operationType: 'delete',
          data: pureDocument,
        }, { session: await db.mongoSession.getMongoSession() });
      })
    });
    hooks.afterDelete = afterDeleteHooks

    // ################################################

    /**
     * inject operation
     * 
     */
    const operation = hooks.operation ?? []
    operation.unshift({
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
    hooks.operation = operation;
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
