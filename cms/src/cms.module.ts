import { Module, DynamicModule } from '@nestjs/common';
import { CMSService } from './cms.service';
import { OptionsType } from './types';
import { createCMSController } from './cms.controller';
import { HooksCollector } from './hooks-collector.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Module({})
export class CMSModule {
  static register(options: OptionsType): DynamicModule {
    return {
      module: CMSModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        HooksCollector,
        {
          provide: CMSService,
          useFactory(connection: Connection, hooksCollector: HooksCollector) {
            return new CMSService(connection, options, hooksCollector);
          },
          inject: [getConnectionToken(options.connectionName), HooksCollector],
        },
      ],
      exports: [CMSService],
      controllers: [createCMSController(options.path)],
    };
  }
}
