import { Request, Response } from 'express';

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

export type HookType = ({
  schema,
  data,
  db,
  context,
}: {
  schema: string;
  data: any;
  db: DBType;
  context: HookContext;
}) => Promise<any>;

export type HookTypeNoReturn = ({
  schema,
  data,
  db,
  context,
}: {
  schema: string;
  data: any;
  db: DBType;
  context: HookContext;
}) => Promise<void>;

export type AfterQueryHookType = HookType;
export type BeforeCreateHookType = HookType;
export type AfterCreateHookType = (params: {
  schema: string;
  data: RecordType;
  db: DBType;
  document: Document;
  context: HookContext;
}) => Promise<Document>;

export type BeforeUpdateHookType = HookType;
export type AfterUpdateHookType = HookType;

export type BeforeDeleteHookType = HookTypeNoReturn;
export type AfterDeleteHookType = HookTypeNoReturn;

export type SchemaHooksType = {
  afterQuery?: AfterQueryHookType[];
  beforeCreate?: BeforeCreateHookType[];
  afterCreate?: AfterCreateHookType[];
  beforeUpdate?: BeforeUpdateHookType[];
  afterUpdate?: AfterUpdateHookType[];
  beforeDelete?: BeforeDeleteHookType[];
  afterDelete?: AfterDeleteHookType[];
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

export type OptionsType = {
  path?: string;
  connectionName?: string;
  inject?: any[];
  schemas?: {
    [schema: string]: {
      hooks?: SchemaHooksType;
    };
  };
};

export type FindOptionsType = {
  skip?: number;
  limit?: number;
};

export type FilterType = {
  [key: string]: any;
};

export type RecordType = {
  [key: string]: any;
};
