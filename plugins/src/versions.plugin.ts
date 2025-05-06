import { OptionsType } from 'nest-mongo-cms';

type VersionControlParams = {
  [schema: string]: {
    max?: number;
    collection?: string;
  }
}
const VersionControl = (_pluginParams: VersionControlParams) => {
  return (options: OptionsType) => {

    const { schemas: originalSchemas = {}, ...rest } = options;

    for (const [schemaKey, pluginConfigs] of Object.entries(_pluginParams ?? {})) {
      const { max, collection } = pluginConfigs

      /**
       * No config provided will ignore the plugin injection
       */
      if (!Object.keys(pluginConfigs)) return;

      const schemaOptions = originalSchemas[schemaKey] ?? {}

      const hooks = schemaOptions.hooks ?? {}

      /**
       * Version Control for Create
       */
      const afterCreateHooks = hooks.afterCreate ?? []

      afterCreateHooks.unshift(async (params) => {
        
        const { document, rawDb } = params as any
        const client = rawDb.getClient()
        const versionCollection = collection ?? `__${schemaKey}`;
        await client.db().collection(versionCollection).insertOne({
          pid: document._id,
          schemaKey,
          createdAt: new Date(),
          operation: 'create',
          data: document,
        })
        return document;
      })
      hooks.afterCreate = afterCreateHooks;
      schemaOptions.hooks = hooks;
      originalSchemas[schemaKey] = schemaOptions;

      /**
       * Version Control for Update
       */


      /**
       * Version Control for delete
       */

    }
    return {
      ...rest,
      schemas: originalSchemas
    }
  }
}

export { VersionControl };