import { Request, Response } from 'express';
import { Connection } from 'mongoose';
import { HookException } from './exceptions/hook.exception';

type DBType = {
  find: (schema: string, options: FindOptionsType) => Promise<any>;
  findOne: (schema: string, id: string) => Promise<any>;
  create: (schema: string, data: any | any[]) => Promise<any>;
  update: (
    schema: string,
    filter: FilterType,
    data: RecordType,
  ) => Promise<any>;
  updateById: (schema: string, id: string, data: RecordType) => Promise<any>;
  delete: (schema: string, filter: FilterType) => Promise<any>;
  deleteById: (schema: string, id: string) => Promise<any>;
};

export type HookContext = {
  request: Request;
  response: Response;
  session: any;
  params: any;
  query: any;
  body: any;
};

export type HookTypeNoReturn = (params: {
  schema: string;
  data: any;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => Promise<void> | void;

export type AfterQueryHookType = (params: {
  schema: string;
  document: Document;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => Promise<any> | any;

export type BeforeCreateHookType = (params: {
  schema: string;
  data: RecordType;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => Promise<any> | any;

export type AfterCreateHookType = (params: {
  schema: string;
  data: RecordType;
  document: Document;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => Promise<Document> | Document;

export type BeforeUpdateHookType = (params: {
  schema: string;
  data: RecordType;
  originalDocument: Document;
  targetDocument: Document;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => Promise<Document> | Document;

export type AfterUpdateHookType = (params: {
  schema: string;
  data: RecordType;
  originalDocument: Document;
  currentDocument: Document;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => Promise<Document> | Document;

export type BeforeDeleteHookType = (params: {
  schema: string;
  document: Document;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => Promise<void> | void;

export type AfterDeleteHookType = (params: {
  schema: string;
  document: Document;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => Promise<void> | void;

export type AfterErrorHookType = (params: {
  schema: string;
  path: string;
  error: Error;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => Promise<void> | void;

export type OperationHookType = (params: {
  schema: string;
  operationType: string;
  action: string;
  query: any;
  body: any;
  db: DBType;
  rawDb: Connection;
  context: HookContext;
}) => any;

export type CatchHookExceptionDataType<T extends keyof SchemaHooksType> =
  T extends 'afterQuery'
    ? { document: Document }
    : T extends 'beforeCreate'
      ? { data: RecordType }
      : T extends 'afterCreate'
        ? { data: RecordType; document: Document }
        : T extends 'beforeUpdate'
          ? {
              data: RecordType;
              originalDocument: Document;
              targetDocument: Document;
            }
          : T extends 'afterUpdate'
            ? {
                data: RecordType;
                originalDocument: Document;
                currentDocument: Document;
              }
            : T extends 'beforeDelete'
              ? { document: Document }
              : T extends 'afterDelete'
                ? { document: Document }
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

export type PluginType = {
  name: string;
  depends?: string[];
  priority?: number;
  inject: (options: OptionsType) => OptionsType;
};

export type OptionsType = {
  path?: string;
  connectionName?: string;
  inject?: any[];
  schemas?: {
    [schema: string]: {
      hooks?: SchemaHooksType;
    };
  };
  plugins?: Array<PluginType>;
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
