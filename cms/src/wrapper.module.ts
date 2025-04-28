import { Module, DynamicModule } from '@nestjs/common';
import { OptionsType } from './types';
import { CMSModule } from './cms.module';
import { RouterModule } from '@nestjs/core';

@Module({})
export class WrapperModule {
  static register({ path, ...options }: OptionsType): DynamicModule {
    return {
      module: WrapperModule,
      imports: [
        CMSModule.register(options),
        RouterModule.register([
          {
            path: path ?? '/cms',
            module: CMSModule,
          },
        ]),
      ],
    };
  }
}
