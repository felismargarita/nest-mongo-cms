import { ModuleRef, Reflector } from '@nestjs/core';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CMS_HOOK_META,
  methodHookMetas,
  SCHEMA_DEFAULT,
} from './cms.decorator';
import { SchemaHooksType } from './types';

@Injectable()
export class HooksCollector implements OnModuleInit {
  logger: Logger = new Logger(HooksCollector.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  public schemaHooks: { [schema: string]: SchemaHooksType } = {};

  onModuleInit() {
    this.collect();
    console.log(this.schemaHooks);
  }

  collect() {
    const modules = this.moduleRef['container'].getModules().entries();
    for (const [, module] of modules) {
      for (const [, { metatype, instance }] of module.providers) {
        if (typeof metatype === 'function') {
          const hookSchemaCls = this.reflector.get<string>(
            CMS_HOOK_META,
            metatype,
          );
          if (hookSchemaCls) {
            Object.getOwnPropertyNames(metatype.prototype).forEach(
              (methodName) => {
                if (methodName === 'constructor') return;

                methodHookMetas.forEach((META) => {
                  const hookSchemaMethod = this.reflector.get<string>(
                    META,
                    instance[methodName],
                  );
                  const schema =
                    hookSchemaMethod === SCHEMA_DEFAULT
                      ? hookSchemaCls
                      : hookSchemaMethod;
                  if (schema === SCHEMA_DEFAULT) {
                    this.logger.error(
                      'schema parameter is missing, please set it in method or class level decorator',
                      {
                        // instance: instance,
                        method: methodName,
                        hook: META.description,
                      },
                    );
                    process.exit(1);
                  }
                  if (hookSchemaMethod) {
                    this.mergeHook(
                      hookSchemaMethod === SCHEMA_DEFAULT
                        ? hookSchemaCls
                        : hookSchemaMethod,
                      META.description as keyof SchemaHooksType,
                      instance[methodName],
                      this.schemaHooks,
                    );
                  }
                });
              },
            );
          }
        }
      }
    }
  }

  private mergeHook<T extends keyof SchemaHooksType>(
    schema: string,
    type: T,
    hook: SchemaHooksType[T][number],
    schemaHooks: SchemaHooksType,
  ) {
    const allHooks = schemaHooks[schema];
    if (allHooks) {
      const hooks = allHooks[type];
      if (hooks) {
        hooks.push(hook);
      } else {
        allHooks[type] = [hook];
      }
    } else {
      this.schemaHooks[schema] = {
        [type]: [hook],
      };
    }
  }
}
