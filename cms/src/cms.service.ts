import { HooksCollector } from './hooks-collector.service';
import { Injectable, Logger, NotFoundException, Scope } from '@nestjs/common';
import { ClientSession, Connection, Document } from 'mongoose';
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
  DocumentLike,
  DBType,
  DeferredCall,
} from './types';
import { HookException } from './exceptions/hook.exception';
import { createPureValue } from './utils/pureValue';

@Injectable({ scope: Scope.REQUEST })
export class CMSService {
  logger = new Logger(CMSService.name);
  private hookContext: HookContext;
  private mongoSession?: ClientSession;
  private deferredCalls: DeferredCall[] = [];

  constructor(
    private readonly connection: Connection,
    private readonly options: OptionsType,
    private readonly hooksCollector: HooksCollector,
  ) {}

  private async getMongoSession() {
    if (!this.mongoSession) {
      this.mongoSession = await this.connection.startSession();
    }
    return this.mongoSession;
  }

  private async commitTransaction() {
    if (this.mongoSession) {
      await this.mongoSession.commitTransaction();
    }
    this.mongoSession = null;
  }

  private async abortTransaction() {
    if (this.mongoSession) {
      await this.mongoSession.abortTransaction();
    }
    this.mongoSession = null;
  }

  private async defer(fn: DeferredCall) {
    this.deferredCalls.push(fn);
  }
  private async deferCall() {
    return Promise.all(this.deferredCalls.map((fn) => fn()));

    /**
     * The this.deferredCalls no need to be cleared manually,
     * since this request scope instance will be GC entirely
     * after the request finish
     */
    // this.deferredCalls = [] # Not needed
  }

  _connection: DBType = {
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
            const pureDocument = createPureValue(doc);
            try {
              return await this.executeAfterQueryHooks(
                schema,
                doc,
                pureDocument,
              );
            } catch (e) {
              if (e instanceof HookException) {
                return await this.executeExceptionHooks(
                  schema,
                  'afterQuery',
                  {
                    document: doc,
                    pureDocument,
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
        const pureDocument = createPureValue(document);
        try {
          return await this.executeAfterQueryHooks(
            schema,
            document,
            pureDocument,
          );
        } catch (e) {
          if (e instanceof HookException) {
            return await this.executeExceptionHooks(
              schema,
              'afterQuery',
              {
                document,
                pureDocument,
              },
              e,
            );
          } else {
            throw e;
          }
        }
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
    mongoSession: {
      getMongoSession: this.getMongoSession.bind(this),
      commitTransaction: this.commitTransaction.bind(this),
      abortTransaction: this.abortTransaction.bind(this),
    },
  };

  private async createOne(schema: string, data: RecordType) {
    const pureData = createPureValue(data);
    try {
      data = await this.executeBeforeCreateHooks(schema, data, pureData);
    } catch (e) {
      if (e instanceof HookException) {
        return await this.executeExceptionHooks(
          schema,
          'beforeCreate',
          { data, pureData },
          e,
        );
      } else {
        throw e;
      }
    }
    const model = this.connection.model(schema);
    const docs = await model.create([data], {
      new: true,
      session: await this.getMongoSession(),
    });
    if (docs.length === 1) {
      let document: Document = docs[0];
      const pureData = createPureValue(data);
      const pureDocument = createPureValue(document);
      try {
        document = await this.executeAfterCreateHooks(
          schema,
          docs[0],
          data,
          pureData,
          pureDocument,
        );
        await this.commitTransaction();
        return document;
      } catch (e) {
        if (e instanceof HookException) {
          return await this.executeExceptionHooks(
            schema,
            'afterCreate',
            {
              data,
              pureData,
              document,
              pureDocument,
            },
            e,
          );
        } else {
          await this.abortTransaction();
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
    originalDoc: Document,
  ) {
    const pureData = createPureValue(data);
    const targetDoc = { ...originalDoc, ...data } as Document;
    let hookedData = data;
    try {
      hookedData = await this.executeBeforeUpdateHooks(
        schema,
        data,
        pureData,
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
            pureData,
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
        session: await this.getMongoSession(),
      })
      .lean()) as any;

    let doc = currentDoc;
    const pureCurrentDocument = createPureValue(currentDoc);
    try {
      doc = await this.executeAfterUpdateHooks(
        schema,
        hookedData,
        pureData,
        originalDoc,
        currentDoc,
        pureCurrentDocument,
      );
      await this.commitTransaction();
      return doc;
    } catch (e) {
      if (e instanceof HookException) {
        return await this.executeExceptionHooks(
          schema,
          'afterUpdate',
          {
            data: hookedData,
            pureData,
            originalDocument: originalDoc,
            currentDocument: doc,
            pureCurrentDocument,
          },
          e,
        );
      } else {
        await this.abortTransaction();
        throw e;
      }
    }
  }

  private async deleteOne(schema: string, document: any) {
    const pureDocument = createPureValue(document);
    try {
      await this.executeBeforeDeleteHooks(schema, document, pureDocument);
    } catch (e) {
      if (e instanceof HookException) {
        return await this.executeExceptionHooks(
          schema,
          'beforeDelete',
          {
            document,
            pureDocument,
          },
          e,
        );
      } else {
        throw e;
      }
    }

    await this.connection
      .model(schema)
      .deleteOne(
        { _id: document._id },
        { session: await this.getMongoSession() },
      );
    try {
      await this.executeAfterDeleteHooks(schema, document, pureDocument);
      await this.commitTransaction();
    } catch (e) {
      if (e instanceof HookException) {
        return await this.executeExceptionHooks(
          schema,
          'afterDelete',
          {
            document,
            pureDocument,
          },
          e,
        );
      } else {
        await this.abortTransaction();
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

  async executeAfterQueryHooks(
    schema: string,
    document: Document,
    pureDocument: Readonly<Document>,
  ) {
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
          pureDocument: pureDocument,
          document: document,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
          defer: this.defer.bind(this),
        });
      }
    }
    await this.deferCall();
    return document;
  }

  async executeBeforeCreateHooks(
    schema: string,
    data: RecordType,
    pureData: Readonly<RecordType>,
  ) {
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
          pureData,
          data,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
          defer: this.defer.bind(this),
        });
      }
    }

    await this.deferCall();
    return data;
  }

  async executeAfterCreateHooks(
    schema: string,
    document: DocumentLike,
    data: RecordType,
    pureData: Readonly<RecordType>,
    pureDocument: Readonly<Document>,
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
          pureData,
          document: document,
          pureDocument,
          data,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
          defer: this.defer.bind(this),
        });
      }
    }

    await this.deferCall();

    return document;
  }

  async executeBeforeUpdateHooks(
    schema: string,
    data: RecordType,
    pureData: Readonly<RecordType>,
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
          pureData,
          db: this._connection,
          rawDb: this.connection,
          originalDocument,
          targetDocument,
          context: this.hookContext,
          defer: this.defer.bind(this),
        });
      }
    }
    await this.deferCall();
    return data;
  }

  async executeAfterUpdateHooks(
    schema: string,
    data: RecordType,
    pureData: Readonly<RecordType>,
    originalDocument: Document,
    currentDocument: Document,
    pureCurrentDocument: Readonly<Document>,
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
          pureData,
          pureCurrentDocument,
          db: this._connection,
          rawDb: this.connection,
          originalDocument,
          currentDocument,
          context: this.hookContext,
          defer: this.defer.bind(this),
        });
      }
    }
    await this.deferCall();

    return currentDocument;
  }

  async executeBeforeDeleteHooks(
    schema: string,
    document: Document,
    pureDocument: Readonly<Document>,
  ) {
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
          pureDocument,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
          defer: this.defer.bind(this),
        });
      }
    }

    await this.deferCall();
  }
  async executeAfterDeleteHooks(
    schema: string,
    document: Document,
    pureDocument: Readonly<Document>,
  ) {
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
          pureDocument,
          db: this._connection,
          rawDb: this.connection,
          context: this.hookContext,
          defer: this.defer.bind(this),
        });
      }
    }

    await this.deferCall();
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
          defer: this.defer.bind(this),
        });
      }
    }

    await this.deferCall();
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
    context: HookContext,
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
    this.hookContext = context;
    if (hook) {
      return hook({
        schema,
        operationType,
        action,
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
