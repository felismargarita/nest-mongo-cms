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
} from 'nest-cms';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
@CMSHook('books')
export class HookService {
  constructor(@InjectConnection() public readonly connection: Connection) {}

  @BeforeCreate()
  @AfterCreate()
  @AfterQuery()
  @BeforeUpdate()
  @AfterUpdate()
  @BeforeDelete()
  @AfterDelete()
  async test_my_function({ data }) {
    this.connection.model('chapters').create({
      _id: 'chaptor' + new Date().getTime().toString(),
      name: 'dadsada',
      content: 'asddasda',
    });
    return data;
  }
}
