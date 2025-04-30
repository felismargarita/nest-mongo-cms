import { ModuleRef, Reflector } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  CMS_HOOK_META,
  methodHookMetas,
  SCHEMA_DEFAULT_SYMBOL,
} from './cms.decorator';
import { SchemaHooksType } from './types';

@Injectable()
export class HooksCollector implements OnModuleInit {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleRef: ModuleRef,
  ) {}

  public schemaHooks: { [schema: string]: SchemaHooksType } = {};

  onModuleInit() {
    this.collect();
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
                  if (hookSchemaMethod) {
                    this.mergeHook(
                      hookSchemaMethod === SCHEMA_DEFAULT_SYMBOL
                        ? hookSchemaCls
                        : hookSchemaMethod,
                      META.description as keyof SchemaHooksType,
                      instance[methodName],
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

  private mergeHook(
    schema: string,
    type: keyof SchemaHooksType,
    hook: SchemaHooksType[keyof SchemaHooksType][number],
  ) {
    const allHooks = this.schemaHooks[schema];
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
