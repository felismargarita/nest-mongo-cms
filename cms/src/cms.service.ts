import { HooksCollector } from './hooks-collector.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Connection } from 'mongoose';
import {
  OptionsType,
  FindOptionsType,
  FilterType,
  RecordType,
  HookContext,
  SchemaHooksType,
  OperationHookType,
  AfterCreateHookType,
  BeforeCreateHookType,
  BeforeUpdateHookType,
  AfterUpdateHookType,
  BeforeDeleteHookType,
  AfterDeleteHookType,
  AfterErrorHookType,
  AfterQueryHookType,
  CatchHookExceptionDataType,
} from './types';
import { HookException } from './exceptions/hook.exception';

@Injectable()
export class CMSService {
  logger = new Logger(CMSService.name);
  private hookContext: HookContext;
  constructor(
    private readonly connection: Connection,
    private readonly options: OptionsType,
    private readonly hooksCollector: HooksCollector,
  ) {}

  _connection = {
    find: async (schema: string, options: FindOptionsType) => {
      try {
        const { skip, limit } = options;
        const model = this.connection.model(schema);
        const documents = await model
          .find()
          .skip(skip)
          .limit(limit)
          .sort({ name: 'asc' })
          .exec();
        return await Promise.all(
          documents.map(async (doc) => {
            try {
              return await this.executeAfterQueryHooks(schema, doc);
            } catch (e) {
              if (e instanceof HookException) {
                return await this.executeExceptionHooks(
                  schema,
                  'afterQuery',
                  {
                    document: doc,
                  },
                  e,
                );
              } else {
                throw e;
              }
            }
          }),
        );
      } catch (e) {
        await this.executeAfterErrorHooks(schema, 'find', e);
        throw e;
      }
    },
    findOne: async (schema: string, id: string) => {
      try {
        const model = this.connection.model(schema);
        const document = await model.findById(id).exec();
        return await this.executeAfterQueryHooks(schema, document);
      } catch (e) {
        await this.executeAfterErrorHooks(schema, 'findOne', e);
        throw e;
      }
    },
    create: async (schema: string, data: RecordType | RecordType[]) => {
      try {
        if (Array.isArray(data)) {
          return await Promise.all(
            data.map((_data: RecordType) => this.createOne(schema, _data)),
          );
        }
        return await this.createOne(schema, data);
      } catch (e) {
        await this.executeAfterErrorHooks(schema, 'create', e);
        throw e;
      }
    },
    update: async (schema: string, filter: FilterType, data: RecordType) => {
      try {
        const originalDocuments: any[] = await this.connection
          .model(schema)
          .find(filter)
          .lean()
          .exec();
        return await Promise.all(
          originalDocuments.map(async (originalDoc) => {
            return this.updateOne(schema, data, originalDoc);
          }),
        );
      } catch (e) {
        await this.executeAfterErrorHooks(schema, 'update', e);
        throw e;
      }
    },
    updateById: async (schema: string, id: string, data: RecordType) => {
      try {
        const originalDoc: any = await this.connection
          .model(schema)
          .findById(id)
          .lean();
        return await this.updateOne(schema, data, originalDoc);
      } catch (e) {
        await this.executeAfterErrorHooks(schema, 'updateById', e);
        throw e;
      }
    },
    delete: async (schema: string, filter: FilterType) => {
      try {
        this.validateFilter(schema, filter);
        const documents = await this.connection.model(schema).find(filter);
        return await Promise.all(
          documents.map((doc) => this.deleteOne(schema, doc)),
        );
      } catch (e) {
        await this.executeAfterErrorHooks(schema, 'delete', e);
        throw e;
      }
    },
    deleteById: async (schema: string, id: string) => {
      try {
        const document = await this.connection.model(schema).findById(id);
        return await this.deleteOne(schema, document);
      } catch (e) {
        await this.executeAfterErrorHooks(schema, 'deleteById', e);
        throw e;
      }
    },
  };

  private async createOne(schema: string, data: RecordType) {
    try {
      data = await this.executeBeforeCreateHooks(schema, data);
    } catch (e) {
      if (e instanceof HookException) {
        return await this.executeExceptionHooks(
          schema,
          'beforeCreate',
          { data },
          e,
        );
      } else {
        throw e;
      }
    }
    const model = this.connection.model(schema);
    const docs = await model.create([data], { new: true });
    if (docs.length === 1) {
      let document: Document = null;
      try {
        document = await this.executeAfterCreateHooks(schema, docs[0], data);
        return document;
      } catch (e) {
        if (e instanceof HookException) {
          return await this.executeExceptionHooks(
            schema,
            'afterCreate',
            {
              data,
              document,
            },
            e,
          );
        } else {
          throw e;
        }
      }
    }
    throw new Error(
      'document count does not match expectation, should be 1, but actual is: ' +
        docs.length,
    );
  }

  private async updateOne(
    schema: string,
    data: RecordType,
    originalDoc: Document & { _id: any },
  ) {
    const targetDoc = { ...originalDoc, ...data };
    let hookedData = data;
    try {
      hookedData = await this.executeBeforeUpdateHooks(
        schema,
        data,
        targetDoc,
        originalDoc,
      );
    } catch (e) {
      if (e instanceof HookException) {
        return await this.executeExceptionHooks(
          schema,
          'beforeUpdate',
          {
            data: hookedData,
            originalDocument: originalDoc,
            targetDocument: targetDoc,
          },
          e,
        );
      } else {
        throw e;
      }
    }

    const currentDoc = (await this.connection
      .model(schema)
      .findByIdAndUpdate(originalDoc._id, hookedData, {
        new: true,
      })
      .lean()) as any;

    let doc = currentDoc;
    try {
      doc = await this.executeAfterUpdateHooks(
        schema,
        hookedData,
        originalDoc,
        currentDoc,
      );
      return doc;
    } catch (e) {
      if (e instanceof HookException) {
        return await this.executeExceptionHooks(
          schema,
          'afterUpdate',
          {
            data: hookedData,
            originalDocument: originalDoc,
            currentDocument: doc,
          },
          e,
        );
      } else {
        throw e;
      }
    }
  }

  private async deleteOne(schema: string, document: any) {
    try {
      await this.executeBeforeDeleteHooks(schema, document);
    } catch (e) {
      if (e instanceof HookException) {
        return await this.executeExceptionHooks(
          schema,
          'beforeDelete',
          {
            document,
          },
          e,
        );
      } else {
        throw e;
      }
    }

    await this.connection.model(schema).deleteOne({ _id: document._id });

    try {
      await this.executeAfterDeleteHooks(schema, document);
    } catch (e) {
      if (e instanceof HookException) {
        return await this.executeExceptionHooks(
          schema,
          'afterDelete',
          {
            document,
          },
          e,
        );
      } else {
        throw e;
      }
    }

    return document;
  }

  private validateFilter(schema: string, filter: RecordType) {
    if (Object.keys(filter).length === 0) {
      throw new Error('filter is required when deleting many documents!');
    }
    const paths = this.connection.model(schema).schema.paths;
    const validKeys = Object.keys(paths);
    if (Object.keys(filter).every((path) => !validKeys.includes(path))) {
      throw new Error(
        'at least 1 valid field is required when deleting many documents!',
      );
    }
  }

  async executeAfterQueryHooks(schema: string, document: Document) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterQuery ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.afterQuery ?? [];

    const hooksGroup = [optionHooks, decorationHooks];
    for (let i = 0; i < 2; i++) {
      const hooks = hooksGroup[i];
      for (const _hook of hooks) {
        const hook: AfterQueryHookType = i ? _hook.bind(this) : _hook;
        document = await hook({
          schema,
          document: document,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
        });
      }
    }
    return document;
  }

  async executeBeforeCreateHooks(schema: string, data: RecordType) {
    const optionHooks =
      this.options.schemas?.[schema]?.hooks.beforeCreate ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.beforeCreate ?? [];

    const hooksGroup = [optionHooks, decorationHooks];
    for (let i = 0; i < 2; i++) {
      const hooks = hooksGroup[i];
      for (const _hook of hooks) {
        const hook: BeforeCreateHookType = i ? _hook.bind(this) : _hook;
        data = await hook({
          schema,
          data,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
        });
      }
    }
    return data;
  }

  async executeAfterCreateHooks(
    schema: string,
    document: Document,
    data: RecordType,
  ) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterCreate ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.afterCreate ?? [];

    const hooksGroup = [optionHooks, decorationHooks];

    for (let i = 0; i < 2; i++) {
      const hooks = hooksGroup[i];
      for (const _hook of hooks) {
        const hook: AfterCreateHookType = i ? _hook.bind(this) : _hook;
        document = await hook({
          schema,
          document: document,
          data,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
        });
      }
    }
    return document;
  }

  async executeBeforeUpdateHooks(
    schema: string,
    data: RecordType,
    targetDocument: Document,
    originalDocument: Document,
  ) {
    const optionHooks =
      this.options.schemas?.[schema]?.hooks.beforeUpdate ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.beforeUpdate ?? [];
    const hooksGroup = [optionHooks, decorationHooks];

    for (let i = 0; i < 2; i++) {
      const hooks = hooksGroup[i];
      for (const _hook of hooks) {
        const hook: BeforeUpdateHookType = i ? _hook.bind(this) : _hook;
        data = await hook({
          schema,
          data,
          db: this._connection,
          rawDb: this.connection,
          originalDocument,
          targetDocument,
          context: this.hookContext,
        });
      }
    }
    return data;
  }

  async executeAfterUpdateHooks(
    schema: string,
    data: RecordType,
    originalDocument: Document,
    currentDocument: Document,
  ) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterUpdate ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.afterUpdate ?? [];

    const hooksGroup = [optionHooks, decorationHooks];
    for (let i = 0; i < 2; i++) {
      const hooks = hooksGroup[i];
      for (const _hook of hooks) {
        const hook: AfterUpdateHookType = i ? _hook.bind(this) : _hook;
        currentDocument = await hook({
          schema,
          data,
          db: this._connection,
          rawDb: this.connection,
          originalDocument,
          currentDocument,
          context: this.hookContext,
        });
      }
    }
    return currentDocument;
  }

  async executeBeforeDeleteHooks(schema: string, document: Document) {
    const optionHooks =
      this.options.schemas?.[schema]?.hooks.beforeDelete ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.beforeDelete ?? [];

    const hooksGroup = [optionHooks, decorationHooks];
    for (let i = 0; i < 2; i++) {
      const hooks = hooksGroup[i];
      for (const _hook of hooks) {
        const hook: BeforeDeleteHookType = i ? _hook.bind(this) : _hook;
        await hook({
          schema,
          document,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
        });
      }
    }
  }
  async executeAfterDeleteHooks(schema: string, document: Document) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterDelete ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.afterDelete ?? [];

    const hooksGroup = [optionHooks, decorationHooks];
    for (let i = 0; i < 2; i++) {
      const hooks = hooksGroup[i];
      for (const _hook of hooks) {
        const hook: AfterDeleteHookType = i ? _hook.bind(this) : _hook;
        await hook({
          schema,
          document,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
        });
      }
    }
  }

  async executeAfterErrorHooks(schema: string, path: string, error: Error) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterError ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.afterError ?? [];

    const hooksGroup = [optionHooks, decorationHooks];
    for (let i = 0; i < 2; i++) {
      const hooks = hooksGroup[i];
      for (const _hook of hooks) {
        const hook: AfterErrorHookType = i ? _hook.bind(this) : _hook;
        await hook({
          schema,
          path,
          error,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
        });
      }
    }
  }

  async executeExceptionHooks<T extends keyof SchemaHooksType>(
    schema: string,
    name: T,
    data: CatchHookExceptionDataType<T>,
    exception: HookException,
  ) {
    const exceptionActions = (() => {
      let _e: HookException = exception;
      return {
        get() {
          return _e;
        },
        clear() {
          _e = null;
        },
        replace(e: HookException) {
          _e = e;
        },
      };
    })();

    const returnActions = (() => {
      let returnData: any = null;
      return {
        get() {
          return returnData;
        },
        set(_d: any) {
          returnData = _d;
        },
      };
    })();

    const optionHooks =
      this.options.schemas?.[schema]?.hooks.catchHookException ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.catchHookException ?? [];

    const hooksGroup = [optionHooks, decorationHooks];

    for (let i = 0; i < 2; i++) {
      const hooks = hooksGroup[i];
      await Promise.allSettled(
        hooks.map((_exceptionHook) => {
          const exceptionHook: typeof _exceptionHook = i
            ? _exceptionHook.bind(this)
            : _exceptionHook;
          return exceptionHook({
            schema,
            name,
            data,
            exceptionActions: exceptionActions,
            returnActions,
            exception,
            db: this._connection,
            rawDb: this.connection,
            context: this.hookContext,
          });
        }),
      );
    }

    if (exceptionActions.get()) {
      throw exceptionActions.get();
    }

    return returnActions.get();
  }

  find(schema: string, options: FindOptionsType, context: HookContext) {
    this.hookContext = context;
    return this._connection.find(schema, options);
  }

  findById(schema: string, id: string, context: HookContext) {
    this.hookContext = context;
    return this._connection.findOne(schema, id);
  }

  create(
    schema: string,
    data: RecordType | RecordType[],
    context: HookContext,
  ) {
    this.hookContext = context;
    return this._connection.create(schema, data);
  }

  update(
    schema: string,
    filter: FilterType,
    data: RecordType,
    context: HookContext,
  ) {
    this.hookContext = context;
    return this._connection.update(schema, filter, data);
  }

  updateById(
    schema: string,
    id: string,
    data: RecordType,
    context: HookContext,
  ) {
    this.hookContext = context;
    return this._connection.updateById(schema, id, data);
  }

  deleteMany(schema: string, filter: FilterType, context: HookContext) {
    this.hookContext = context;
    return this._connection.delete(schema, filter);
  }

  deleteById(schema: string, id: string, context: HookContext) {
    this.hookContext = context;
    return this._connection.deleteById(schema, id);
  }

  async operate(
    schema: string,
    operationType: string,
    action: string,
    query: any,
    body: any,
  ) {
    const optionHook = this.options.schemas?.[schema]?.hooks.operation.find(
      (item) => item.operationType === operationType && item.action === action,
    );
    const decorationHook = this.options.schemas?.[schema]?.hooks.operation.find(
      (item) => item.operationType === operationType && item.action === action,
    );
    let hook: OperationHookType = null;
    if (optionHook) {
      hook = optionHook.hook;
    }
    if (decorationHook) {
      hook = decorationHook.hook.bind(this);
    }
    if (hook) {
      return hook({
        schema,
        operationType,
        action,
        query,
        body,
        db: this._connection,
        rawDb: this.connection,
        context: this.hookContext,
      });
    }

    throw new NotFoundException(
      `missing resource error: schema: ${schema}, operationType: ${operationType}, action: ${action}`,
    );
  }
}
