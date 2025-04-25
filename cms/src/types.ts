type OperationsType<T = unknown> = {
  findOne: (filters?: any) => Promise<T>;
  find: (filters?: any) => Promise<T[]>;
  insertOne: (body: any) => Promise<T>;
  updateOne: (filters: any, body: any) => Promise<T>;
  deleteOne: (filters: any) => Promise<T>;
};

export type ConnectionType = {
  slug: (value: string) => OperationsType;
};

type AfterQueryParams = {
  data: unknown;
  connection: ConnectionType;
};

type HookType = ({
  data,
  connection,
}: AfterQueryParams) => Promise<unknown> | unknown;

type BeforeQueryType = HookType;
type BeforeCreateType = HookType;
type BeforeUpdateType = HookType;
type BeforeDeleteType = HookType;
type BeforeOperationType = HookType;

type AfterQueryType = HookType;
type AfterCreateType = HookType;
type AfterUpdateType = HookType;
type AfterDeleteType = HookType;
type AfterOperationType = HookType;

type AfterErrorType = HookType;

export type HooksType = {
  beforeQuery?: Array<BeforeQueryType> | null;
  beforeCreate?: Array<BeforeCreateType> | null;
  beforeUpdate?: Array<BeforeUpdateType> | null;
  beforeDelete?: Array<BeforeDeleteType> | null;
  beforeOperation?: Array<BeforeOperationType> | null;
  afterQuery?: Array<AfterQueryType> | null;
  afterCreate?: Array<AfterCreateType> | null;
  afterUpdate?: Array<AfterUpdateType> | null;
  afterDelete?: Array<AfterDeleteType> | null;
  AfterOperation?: Array<AfterOperationType> | null;
  afterError?: Array<AfterErrorType> | null;
};

// export type SlugValidatorParams = {
//   data: unknown;
//   connection: ConnectionType;
// };
// export type SlugValidtorType = ({
//   data,
//   connection,
// }: SlugValidatorParams) => boolean | Promise<any>;

// export type FieldValidatorParams = {
//   value: unknown;
//   data: unknown;
//   connection: ConnectionType;
// };

// export type FieldValidatorType = ({
//   value,
//   data,
//   connection,
// }: FieldValidatorParams) => boolean | Promise<any>;

export type OptionsType = {
  hooks?: HooksType;
  slugs?: {
    [slug: string]: {
      hooks?: HooksType;
      // validators?: Array<SlugValidtorType>;
      fields?: {
        [field: string]: {
          hooks: HooksType;
          // validators?: Array<FieldValidatorType>;
        };
      };
    };
  };
};
