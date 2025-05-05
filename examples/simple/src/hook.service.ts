import { Injectable } from '@nestjs/common';
import {
  CMSHook,
  BeforeCreate,
  AfterCreate,
  AfterQuery,
  BeforeDelete,
  AfterDelete,
  BeforeUpdate,
  AfterUpdate,
  AfterCreateHookParams,
  BeforeCreateHookParams,
} from 'nest-mongo-cms';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { response } from 'express';

@Injectable()
@CMSHook('books')
export class HookService {
  constructor(@InjectConnection() public readonly connection: Connection) {}

  @BeforeCreate()
  customize_book_id({ data, context }: BeforeCreateHookParams) {
    // console.log(data);
    const _id = `book_${new Date().getTime().toString()}`;
    return {
      ...data,
      _id,
    };
  }

  @AfterCreate()
  async after_create_book({ data, db, document, context }: AfterCreateHookParams) {
    // console.log(data, document);
    console.log(context.body);
    // context.response.send(document)
    return document;
  }

}
