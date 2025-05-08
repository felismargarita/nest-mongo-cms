import { SetMetadata } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const SCHEMA_DEFAULT = 'SchemaDefault';
const CONNECTION_DEFAULT = getConnectionToken();
const CMS_HOOK_META = Symbol('CMS_HOOK_META');

const CMSHook = (options?: { connection?: string; schema?: string }) => {
  const { connection, schema } = options ?? {};
  return SetMetadata(CMS_HOOK_META, {
    connection: connection ?? CONNECTION_DEFAULT,
    schema: schema ?? SCHEMA_DEFAULT,
  });
};

const CMS_HOOK_AFTER_QUERY_META = Symbol('afterQuery');
const AfterQuery = (schema?: string) =>
  SetMetadata(CMS_HOOK_AFTER_QUERY_META, schema ?? SCHEMA_DEFAULT);

const CMS_HOOK_BEFORE_CREATE_META = Symbol('beforeCreate');
const BeforeCreate = (schema?: string) =>
  SetMetadata(CMS_HOOK_BEFORE_CREATE_META, schema ?? SCHEMA_DEFAULT);
const CMS_HOOK_AFTER_CREATE_META = Symbol('afterCreate');
const AfterCreate = (schema?: string) =>
  SetMetadata(CMS_HOOK_AFTER_CREATE_META, schema ?? SCHEMA_DEFAULT);

const CMS_HOOK_BEFORE_UPDATE_META = Symbol('beforeUpdate');
const BeforeUpdate = (schema?: string) =>
  SetMetadata(CMS_HOOK_BEFORE_UPDATE_META, schema ?? SCHEMA_DEFAULT);
const CMS_HOOK_AFTER_UPDATE_META = Symbol('afterUpdate');
const AfterUpdate = (schema?: string) =>
  SetMetadata(CMS_HOOK_AFTER_UPDATE_META, schema ?? SCHEMA_DEFAULT);

const CMS_HOOK_BEFORE_DELETE_META = Symbol('beforeDelete');
const BeforeDelete = (schema?: string) =>
  SetMetadata(CMS_HOOK_BEFORE_DELETE_META, schema ?? SCHEMA_DEFAULT);
const CMS_HOOK_AFTER_DELETE_META = Symbol('afterDelete');
const AfterDelete = (schema?: string) =>
  SetMetadata(CMS_HOOK_AFTER_DELETE_META, schema ?? SCHEMA_DEFAULT);

const CMS_HOOK_AFTER_ERROR_META = Symbol('afterError');
const AfterError = (schema?: string) =>
  SetMetadata(CMS_HOOK_AFTER_ERROR_META, schema ?? SCHEMA_DEFAULT);

const CMS_HOOK_OPERATION_META = Symbol('operation');
const Operation = (schema?: string) =>
  SetMetadata(CMS_HOOK_OPERATION_META, schema ?? SCHEMA_DEFAULT);

const methodHookMetas = [
  CMS_HOOK_AFTER_QUERY_META,
  CMS_HOOK_BEFORE_CREATE_META,
  CMS_HOOK_AFTER_CREATE_META,
  CMS_HOOK_BEFORE_UPDATE_META,
  CMS_HOOK_AFTER_UPDATE_META,
  CMS_HOOK_BEFORE_DELETE_META,
  CMS_HOOK_AFTER_DELETE_META,
  CMS_HOOK_AFTER_ERROR_META,
  CMS_HOOK_OPERATION_META,
];

export {
  CMS_HOOK_META,
  CMSHook,
  SCHEMA_DEFAULT,
  CONNECTION_DEFAULT,
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
  CMS_HOOK_AFTER_ERROR_META,
  AfterError,
  CMS_HOOK_OPERATION_META,
  Operation,
};
