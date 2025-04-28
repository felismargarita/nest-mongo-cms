import { Module, DynamicModule } from '@nestjs/common';
import { CMSService } from './cms.service';
import { OptionsType } from './types';
import { CMSController } from './cms.controller';

@Module({})
export class CMSModule {
  static register(options: Omit<OptionsType, 'path'>): DynamicModule {
    return {
      module: CMSModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        CMSService,
      ],
      exports: [CMSService],
      controllers: [CMSController],
    };
  }
}
