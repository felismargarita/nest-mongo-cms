import { Module, DynamicModule } from '@nestjs/common';
import { CMSController } from './cms.controller';
import { CMSService } from './cms.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OptionsType } from './types';

@Module({})
export class CMSModule {
  static register(options: OptionsType): DynamicModule {
    return {
      module: CMSModule,
      imports: [MongooseModule.forRoot('mongodb://localhost/cms-test')],
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
