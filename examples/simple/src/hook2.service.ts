import { Injectable } from '@nestjs/common';
import {
  CMSHook,
  BeforeCreate,
  AfterCreate,
  AfterCreateHookParams,
  BeforeCreateHookParams,
} from 'nest-mongo-cms';

@Injectable()
@CMSHook({ connection: 'library2' })
export class Hook2Service {
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
}
