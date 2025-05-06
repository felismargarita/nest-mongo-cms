import { HooksCollector } from './hooks-collector.service';
import { Injectable, Logger } from '@nestjs/common';
import { Connection } from 'mongoose';
import {
  OptionsType,
  FindOptionsType,
  FilterType,
  RecordType,
  HookContext,
} from './types';

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
          documents.map((doc) => this.executeAfterQueryHooks(schema, doc)),
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
    data = await this.executeBeforeCreateHooks(schema, data);
    const model = this.connection.model(schema);
    const docs = await model.create([data], { new: true });
    if (docs.length === 1) {
      const document = await this.executeAfterCreateHooks(
        schema,
        docs[0],
        data,
      );
      return document;
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
    const hookedData = await this.executeBeforeUpdateHooks(
      schema,
      data,
      { ...originalDoc, ...data },
      originalDoc,
    );
    const currentDoc = (await this.connection
      .model(schema)
      .findByIdAndUpdate(originalDoc._id, hookedData, {
        new: true,
      })
      .lean()) as any;
    return this.executeAfterUpdateHooks(
      schema,
      hookedData,
      originalDoc,
      currentDoc,
    );
  }

  private async deleteOne(schema: string, document: any) {
    await this.executeBeforeDeleteHooks(schema, document);

    await this.connection.model(schema).deleteOne({ _id: document._id });

    await this.executeAfterDeleteHooks(schema, document);

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
    for (const hook of optionHooks) {
      document = await hook({
        schema,
        data: document,
        db: this._connection,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      document = await hook.bind(this)({
        schema,
        data: document,
        db: this._connection,
        context: this.hookContext,
      });
    }
    return document;
  }

  async executeBeforeCreateHooks(schema: string, data: RecordType) {
    const optionHooks =
      this.options.schemas?.[schema]?.hooks.beforeCreate ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.beforeCreate ?? [];
    for (const hook of optionHooks) {
      data = await hook({
        schema,
        data,
        db: this._connection,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      data = await hook.bind(this)({
        schema,
        data,
        db: this._connection,
        context: this.hookContext,
      });
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
    for (const hook of optionHooks) {
      document = await hook({
        schema,
        document: document,
        data,
        db: this._connection,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      document = await hook.bind(this)({
        schema,
        document: document,
        data,
        db: this._connection,
        context: this.hookContext,
      });
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
    for (const hook of optionHooks) {
      data = await hook({
        schema,
        data,
        db: this._connection,
        originalDocument,
        targetDocument,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      data = await hook.bind(this)({
        schema,
        data,
        db: this._connection,
        originalDocument,
        targetDocument,
        context: this.hookContext,
      });
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
    for (const hook of optionHooks) {
      currentDocument = await hook({
        schema,
        data,
        db: this._connection,
        originalDocument,
        currentDocument,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      currentDocument = await hook.bind(this)({
        schema,
        data,
        db: this._connection,
        originalDocument,
        currentDocument,
        context: this.hookContext,
      });
    }
    return currentDocument;
  }

  async executeBeforeDeleteHooks(schema: string, document: Document) {
    const optionHooks =
      this.options.schemas?.[schema]?.hooks.beforeDelete ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.beforeDelete ?? [];
    for (const hook of optionHooks) {
      await hook({
        schema,
        document,
        db: this._connection,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      await hook.bind(this)({
        schema,
        document,
        db: this._connection,
        context: this.hookContext,
      });
    }
  }
  async executeAfterDeleteHooks(schema: string, document: Document) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterDelete ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.afterDelete ?? [];
    for (const hook of optionHooks) {
      await hook({
        schema,
        document,
        db: this._connection,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      await hook.bind(this)({
        schema,
        document,
        db: this._connection,
        context: this.hookContext,
      });
    }
  }

  async executeAfterErrorHooks(schema: string, path: string, error: Error) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterError ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema]?.afterError ?? [];
    for (const hook of optionHooks) {
      await hook({
        schema,
        path,
        error,
        db: this._connection,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      await hook.bind(this)({
        schema,
        path,
        error,
        db: this._connection,
        context: this.hookContext,
      });
    }
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
}
