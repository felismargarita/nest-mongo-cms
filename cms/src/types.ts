import { Request, Response } from 'express';
import { Connection, Document } from 'mongoose';
import { HookException } from './exceptions/hook.exception';

type DBType = {
  find: (
    schema: string,
    options: FindOptionsType,
  ) => Promise<Array<DocumentLike>>;
  findOne: (schema: string, id: string) => Promise<DocumentLike>;
  create: (schema: string, data: any | any[]) => Promise<DocumentLike>;
  update: (
    schema: string,
    filter: FilterType,
    data: RecordType,
  ) => Promise<Array<DocumentLike>>;
  updateById: (
    schema: string,
    id: string,
    data: RecordType,
  ) => Promise<DocumentLike>;
  delete: (schema: string, filter: FilterType) => Promise<Array<DocumentLike>>;
  deleteById: (schema: string, id: string) => Promise<DocumentLike>;
};

export type DocumentLike = Document & RecordType;

export type HookContext = {
  request: Request;
  response: Response;
  session: any;
  params: any;
  query: any;
  body: any;
  [prop: string]: any;
};

export type DeferredCall = () => void | Promise<void>;

export type HookTypeNoReturn = (params: {
  schema: string;
  data: any;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
  defer: (call: DeferredCall) => void;
}) => Promise<void> | void;

export type AfterQueryHookType = (params: {
  schema: string;
  pureDocument: Readonly<Document>;
  document: DocumentLike;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
  defer: (call: DeferredCall) => void;
}) => Promise<DocumentLike> | DocumentLike;

export type BeforeCreateHookType = (params: {
  schema: string;
  pureData: Readonly<RecordType>;
  data: RecordType;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
  defer: (call: DeferredCall) => void;
}) => Promise<RecordType> | RecordType;

export type AfterCreateHookType = (params: {
  schema: string;
  pureData: Readonly<RecordType>;
  data: RecordType;
  pureDocument: Readonly<Document>;
  document: DocumentLike;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
  defer: (call: DeferredCall) => void;
}) => Promise<DocumentLike> | DocumentLike;

export type BeforeUpdateHookType = (params: {
  schema: string;
  pureData: Readonly<RecordType>;
  data: RecordType;
  originalDocument: Readonly<Document>;
  targetDocument: DocumentLike;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
  defer: (call: DeferredCall) => void;
}) => Promise<DocumentLike> | DocumentLike;

export type AfterUpdateHookType = (params: {
  schema: string;
  pureData: Readonly<RecordType>;
  data: RecordType;
  originalDocument: Document;
  pureCurrentDocument: Readonly<Document>;
  currentDocument: DocumentLike;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
  defer: (call: DeferredCall) => void;
}) => Promise<DocumentLike> | DocumentLike;

export type BeforeDeleteHookType = (params: {
  schema: string;
  pureDocument: Readonly<Document>;
  document: DocumentLike;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
  defer: (call: DeferredCall) => void;
}) => Promise<any> | any;

export type AfterDeleteHookType = (params: {
  schema: string;
  pureDocument: Readonly<Document>;
  document: DocumentLike;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
  defer: (call: DeferredCall) => void;
}) => Promise<any> | any;

export type AfterErrorHookType = (params: {
  schema: string;
  path: string;
  error: Error;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
  defer: (call: DeferredCall) => void;
}) => Promise<void> | void;

export type OperationHookType = (params: {
  schema: string;
  operationType: string;
  action: string;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => any;

export type CatchHookExceptionDataType<T extends keyof SchemaHooksType> =
  T extends 'afterQuery'
    ? { document: DocumentLike; pureDocument: Readonly<Document> }
    : T extends 'beforeCreate'
      ? { data: RecordType; pureData: Readonly<RecordType> }
      : T extends 'afterCreate'
        ? {
            data: RecordType;
            document: DocumentLike;
            pureData: Readonly<RecordType>;
            pureDocument: Document;
          }
        : T extends 'beforeUpdate'
          ? {
              data: RecordType;
              pureData: Readonly<RecordType>;
              originalDocument: Readonly<Document>;
              targetDocument: Document;
            }
          : T extends 'afterUpdate'
            ? {
                data: RecordType;
                pureData: Readonly<RecordType>;
                originalDocument: Document;
                pureCurrentDocument: Readonly<Document>;
                currentDocument: DocumentLike;
              }
            : T extends 'beforeDelete'
              ? { document: DocumentLike; pureDocument: Readonly<Document> }
              : T extends 'afterDelete'
                ? { document: DocumentLike; pureDocument: Readonly<Document> }
                : never;

export type CatchHookExceptionType = <T extends keyof SchemaHooksType>(params: {
  schema: string;
  name: T;
  data: CatchHookExceptionDataType<T>;
  exception: HookException;
  exceptionActions: {
    get: () => HookException;
    clear: () => void;
    replace: (e: HookException) => void;
  };
  returnActions: {
    get: () => any;
    set: (_d: any) => void;
  };
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => any;

export type SchemaHooksType = {
  afterQuery?: AfterQueryHookType[];
  beforeCreate?: BeforeCreateHookType[];
  afterCreate?: AfterCreateHookType[];
  beforeUpdate?: BeforeUpdateHookType[];
  afterUpdate?: AfterUpdateHookType[];
  beforeDelete?: BeforeDeleteHookType[];
  afterDelete?: AfterDeleteHookType[];
  afterError?: AfterErrorHookType[];
  catchHookException?: CatchHookExceptionType[];
  operation?: Array<{
    operationType: string;
    action: string;
    hook: OperationHookType;
  }>;
};

//export hook params
type ExtractHookParams<T extends keyof SchemaHooksType> =
  SchemaHooksType[T][number] extends (X: infer P) => any ? P : never;

export type AfterQueryHookParams = ExtractHookParams<'afterQuery'>;
export type AfterCreateHookParams = ExtractHookParams<'afterCreate'>;
export type BeforeCreateHookParams = ExtractHookParams<'beforeCreate'>;
export type AfterUpdateHookParams = ExtractHookParams<'afterUpdate'>;
export type BeforeUpdateHookParams = ExtractHookParams<'beforeUpdate'>;
export type AfterDeleteHookParams = ExtractHookParams<'afterDelete'>;
export type BeforeDeleteHookParams = ExtractHookParams<'beforeDelete'>;
export type AfterErrorHookParams = ExtractHookParams<'afterError'>;
export type CatchHookExceptionParams = ExtractHookParams<'catchHookException'>;
export type PluginType = {
  name: string;
  depends?: string[];
  priority?: number;
  inject: (schema: string, config: SchemaConfig) => SchemaConfig;
};

export type SchemaConfig = {
  hooks?: SchemaHooksType;
  plugins?: Array<PluginType>;
};

export type OptionsType = {
  path?: string;
  connectionName?: string;
  inject?: any[];
  schemas?: {
    [schema: string]: SchemaConfig;
  };
};

export type FindOptionsType = {
  skip?: number;
  limit?: number;
  sort?: { [key: string]: 'asc' | 'desc' };
  filter?: Record<string, any>;
};

export type FilterType = {
  [key: string]: any;
};

export type RecordType = {
  [key: string]: any;
};
