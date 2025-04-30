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

export type HookType = ({
  data,
  db,
}: {
  data: any;
  db: DBType;
}) => Promise<any>;
export type HookTypeNoReturn = ({
  data,
  db,
}: {
  data: any;
  db: DBType;
}) => Promise<void>;
export type AfterQueryHookType = HookType;
export type BeforeCreateHookType = HookType;
export type AfterCreateHookType = HookType;

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

export type OptionsType = {
  path?: string;
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
