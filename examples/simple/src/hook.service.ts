import { Injectable } from '@nestjs/common';
import {
  CMSHook,
  BeforeCreate,
  AfterCreate,
  BeforeUpdate,
  AfterUpdate,
  BeforeDelete,
  AfterDelete,
  AfterError,
  AfterCreateHookParams,
  BeforeCreateHookParams,
  BeforeUpdateHookParams,
  AfterUpdateHookParams,
  BeforeDeleteHookParams,
  AfterDeleteHookParams,
  AfterErrorHookParams,
} from 'nest-mongo-cms';

@Injectable()
@CMSHook({ connection: 'library1' })
export class HookService {
  constructor() {}

  @BeforeCreate('books')
  customize_book_id({ data, context }: BeforeCreateHookParams) {
    // console.log(data);
    const _id = `book_${new Date().getTime().toString()}`;
    return {
      ...data,
      _id,
    };
  }

  @AfterCreate('books')
  async after_create_book({
    data,
    db,
    document,
    context,
  }: AfterCreateHookParams) {
    // console.log(data, document);
    console.log(context.body);
    // context.response.send(document)
    return document;
  }

  @BeforeUpdate('books')
  beforeUpdateHook(params: BeforeUpdateHookParams) {
    return {
      ...params.data,
      title: 'new title:' + new Date().getTime().toString(),
    };
  }

  @AfterUpdate('books')
  afterUpdateHook({ context, db, ...rest }: AfterUpdateHookParams) {
    console.log(rest);
    return {
      ...rest.currentDocument,
      dsddsdad: 2313,
    };
  }

  @BeforeDelete('books')
  beforeDeleteHooktest(params: BeforeDeleteHookParams) {
    console.log('beforeDeleteHooktest', params);
  }

  @AfterDelete('books')
  afterDeleteHooktest(params: AfterDeleteHookParams) {
    console.log('afterDeleteHooktest', params);
  }

  @AfterError('books')
  afterErrorTest(params: AfterErrorHookParams) {
    console.log(params);
  }
}
