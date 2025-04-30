import { SetMetadata } from '@nestjs/common';

const CMS_HOOK_META = Symbol('CMS_HOOK_META');
const CMSHook = (schema: string) => SetMetadata(CMS_HOOK_META, schema);

const SCHEMA_DEFAULT_SYMBOL = 'SchemaDefault';

const CMS_HOOK_AFTER_QUERY_META = Symbol('afterQuery');
const AfterQuery = (schema?: string) =>
  SetMetadata(CMS_HOOK_AFTER_QUERY_META, schema ?? SCHEMA_DEFAULT_SYMBOL);

const CMS_HOOK_BEFORE_CREATE_META = Symbol('beforeCreate');
const BeforeCreate = (schema?: string) =>
  SetMetadata(CMS_HOOK_BEFORE_CREATE_META, schema ?? SCHEMA_DEFAULT_SYMBOL);
const CMS_HOOK_AFTER_CREATE_META = Symbol('afterCreate');
const AfterCreate = (schema?: string) =>
  SetMetadata(CMS_HOOK_AFTER_CREATE_META, schema ?? SCHEMA_DEFAULT_SYMBOL);

const CMS_HOOK_BEFORE_UPDATE_META = Symbol('beforeUpdate');
const BeforeUpdate = (schema?: string) =>
  SetMetadata(CMS_HOOK_BEFORE_UPDATE_META, schema ?? SCHEMA_DEFAULT_SYMBOL);
const CMS_HOOK_AFTER_UPDATE_META = Symbol('afterUpdate');
const AfterUpdate = (schema?: string) =>
  SetMetadata(CMS_HOOK_AFTER_UPDATE_META, schema ?? SCHEMA_DEFAULT_SYMBOL);

const CMS_HOOK_BEFORE_DELETE_META = Symbol('beforeDelete');
const BeforeDelete = (schema?: string) =>
  SetMetadata(CMS_HOOK_BEFORE_DELETE_META, schema ?? SCHEMA_DEFAULT_SYMBOL);
const CMS_HOOK_AFTER_DELETE_META = Symbol('afterDelete');
const AfterDelete = (schema?: string) =>
  SetMetadata(CMS_HOOK_AFTER_DELETE_META, schema ?? SCHEMA_DEFAULT_SYMBOL);

const methodHookMetas = [
  CMS_HOOK_AFTER_QUERY_META,
  CMS_HOOK_BEFORE_CREATE_META,
  CMS_HOOK_AFTER_CREATE_META,
  CMS_HOOK_BEFORE_UPDATE_META,
  CMS_HOOK_AFTER_UPDATE_META,
  CMS_HOOK_BEFORE_DELETE_META,
  CMS_HOOK_AFTER_DELETE_META,
];

export {
  CMS_HOOK_META,
  CMSHook,
  SCHEMA_DEFAULT_SYMBOL,
  CMS_HOOK_AFTER_QUERY_META,
  AfterQuery,
  CMS_HOOK_BEFORE_CREATE_META,
  BeforeCreate,
  CMS_HOOK_AFTER_CREATE_META,
  AfterCreate,
  CMS_HOOK_BEFORE_UPDATE_META,
  BeforeUpdate,
  CMS_HOOK_AFTER_UPDATE_META,
  AfterUpdate,
  CMS_HOOK_BEFORE_DELETE_META,
  BeforeDelete,
  CMS_HOOK_AFTER_DELETE_META,
  AfterDelete,
  methodHookMetas,
};
