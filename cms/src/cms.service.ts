import { HooksCollector } from './hooks-collector.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
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
    @InjectConnection() public readonly connection: Connection,
    @Inject('CONFIG_OPTIONS') private readonly options: OptionsType,
    private readonly hooksCollector: HooksCollector,
  ) {}

  _connection = {
    find: async (schema: string, options: FindOptionsType) => {
      const { skip, limit } = options;
      const model = this.connection.model(schema);
      const documents = await model
        .find()
        .skip(skip)
        .limit(limit)
        .sort()
        .exec();

      return Promise.all(
        documents.map((doc) => this.executeAfterQueryHooks(schema, doc)),
      );
    },
    findOne: async (schema: string, id: string) => {
      const model = this.connection.model(schema);
      const document = await model.findById(id).exec();
      return this.executeAfterQueryHooks(schema, document);
    },
    create: async (schema: string, data: RecordType | RecordType[]) => {
      if (Array.isArray(data)) {
        return Promise.all(
          data.map((_data: RecordType) => this.createOne(schema, _data)),
        );
      }
      return this.createOne(schema, data);
    },
    update: async (schema: string, filter: FilterType, data: RecordType) => {
      let documents = await this.connection.model(schema).find(filter);
      documents = await Promise.all(
        documents.map((doc) => {
          return this.executeBeforeUpdateHooks(schema, { ...doc, ...data });
        }),
      );

      documents = await Promise.all(
        documents.map((doc) => {
          return this.connection
            .model(schema)
            .findByIdAndUpdate(doc._id, doc, { new: true });
        }),
      );

      return Promise.all(
        documents.map((doc) => {
          return this.executeAfterUpdateHooks(schema, doc);
        }),
      );
    },
    updateById: async (schema: string, id: string, data: RecordType) => {
      let document = await this.connection.model(schema).findById(id);
      document = await this.executeBeforeUpdateHooks(schema, {
        ...document,
        ...data,
      });

      document = await this.connection
        .model(schema)
        .findByIdAndUpdate(document._id, document, { new: true });

      return this.executeAfterUpdateHooks(schema, document);
    },
    delete: async (schema: string, filter: FilterType) => {
      const documents = await this.connection.model(schema).find(filter);

      await Promise.all(
        documents.map((doc) => {
          return this.executeBeforeDeleteHooks(schema, doc);
        }),
      );

      await this.connection.model(schema).deleteMany(filter);

      await Promise.all(
        documents.map((doc) => {
          return this.executeAfterDeleteHooks(schema, doc);
        }),
      );

      return documents;
    },
    deleteById: async (schema: string, id: string) => {
      const document = await this.connection.model(schema).findById(id);
      await this.executeBeforeDeleteHooks(schema, document);

      await this.connection.model(schema).findByIdAndDelete(id);

      await this.executeAfterDeleteHooks(schema, document);
      return document;
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

  async executeAfterQueryHooks(schema: string, document: Document) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterQuery ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema].afterQuery ?? [];
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
      this.hooksCollector.schemaHooks[schema].beforeCreate ?? [];
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
      this.hooksCollector.schemaHooks[schema].afterCreate ?? [];
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

  async executeBeforeUpdateHooks(schema: string, data: RecordType) {
    const optionHooks =
      this.options.schemas?.[schema]?.hooks.beforeUpdate ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema].beforeUpdate ?? [];
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

  async executeAfterUpdateHooks(schema: string, document: Document) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterUpdate ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema].afterUpdate ?? [];
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

  async executeBeforeDeleteHooks(schema: string, data: RecordType) {
    const optionHooks =
      this.options.schemas?.[schema]?.hooks.beforeDelete ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema].beforeDelete ?? [];
    for (const hook of optionHooks) {
      await hook({
        schema,
        data,
        db: this._connection,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      await hook.bind(this)({
        schema,
        data,
        db: this._connection,
        context: this.hookContext,
      });
    }
  }
  async executeAfterDeleteHooks(schema: string, document: Document) {
    const optionHooks = this.options.schemas?.[schema]?.hooks.afterDelete ?? [];
    const decorationHooks =
      this.hooksCollector.schemaHooks[schema].afterDelete ?? [];
    for (const hook of optionHooks) {
      await hook({
        schema,
        data: document,
        db: this._connection,
        context: this.hookContext,
      });
    }
    for (const hook of decorationHooks) {
      await hook.bind(this)({
        schema,
        data: document,
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
