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
} from 'nest-cms';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
@CMSHook('books')
export class HookService {
  constructor(@InjectConnection() public readonly connection: Connection) {}

  @BeforeCreate()
  customize_book_id({ data }: BeforeCreateHookParams) {
    console.log(data)
    data._id = `book_${new Date().getTime().toString()}`;
    return data;
  }

  @AfterCreate()
  async after_create_book({ data, db, document }: AfterCreateHookParams) {
    console.log(data, document);
    return document;
  }

}
