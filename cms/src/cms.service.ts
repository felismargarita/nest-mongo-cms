import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { OptionsType } from './types';

@Injectable()
export class CMSService {
  logger = new Logger(CMSService.name);
  constructor(
    @InjectConnection() public readonly connection: Connection,
    @Inject('CONFIG_OPTIONS') private readonly options: OptionsType,
  ) {}

  findById(schema: string, id: string, projection?: any, options?: any) {
    return this.connection.model(schema).findById(id, projection, options);
  }

  findOne(schema: string, filter: any, projection: any, options: any) {
    return this.connection.model(schema).findOne(filter, projection, options);
  }

  find(schema: string, filter: any, projection: any, options: any) {
    return this.connection.model(schema).find(filter, projection, options);
  }

  findOneAndUpdate(schema: string, filter: any, update: any, options: any) {
    return this.connection
      .model(schema)
      .findOneAndUpdate(filter, update, options);
  }

  create(schema: string, data: any, options: any) {
    return this.connection.model(schema).create(data, options);
  }

  updateOne(schema: string, filter: any, update: any, options: any) {
    return this.connection.model(schema).updateOne(filter, update, options);
  }

  updateMany(schema: string, filter: any, update: any, options: any) {
    return this.connection.model(schema).updateMany(filter, update, options);
  }

  deleteOne(schema: string, filter: any, options: any): Promise<any> {
    return this.connection.model(schema).deleteOne(filter, options);
  }

  deleteMany(schema: string, filter: any, options: any): Promise<any> {
    return this.connection.model(schema).deleteMany(filter, options);
  }

  findOneAndDelete(schema: string, filter: any, options: any) {
    return this.connection.model(schema).findOneAndDelete(filter, options);
  }

  replace(schema: string, filter: any, replacement: any, options: any) {
    return this.connection
      .model(schema)
      .replaceOne(filter, replacement, options);
  }

  findOneAndReplace(
    schema: string,
    filter: any,
    replacement: any,
    options: any,
  ) {
    return this.connection
      .model(schema)
      .findOneAndReplace(filter, replacement, options);
  }

  //TODO: implement remaining mongoose methods, like count, distinct, exists
}
