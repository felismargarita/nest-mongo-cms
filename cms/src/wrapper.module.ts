import { Module, DynamicModule } from '@nestjs/common';
import { OptionsType } from './types';
import { CMSModule as _CMSModule } from './cms.module';
import { RouterModule } from '@nestjs/core';

@Module({})
export class CMSModule {
  static register({ path, ...options }: OptionsType): DynamicModule {
    return {
      module: CMSModule,
      imports: [
        _CMSModule.register(options),
        RouterModule.register([
          {
            path: path ?? '/cms',
            module: _CMSModule,
          },
        ]),
      ],
    };
  }
}
