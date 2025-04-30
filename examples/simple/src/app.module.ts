import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CMSModule } from 'nest-cms';
import { BookSchema } from './book.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChapterSchema } from './chapter.schema';
import { HookService } from './hook.service';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/cms-test'),
    MongooseModule.forFeature([
      {
        name: 'books',
        schema: BookSchema,
      },
      {
        name: 'chapters',
        schema: ChapterSchema,
      },
    ]),
    CMSModule.register({
      path: '/cms',
      schemas: {
        books: {
          hooks: {
            afterQuery: [
              ({ data }) => {
                console.log('options hooks')
                return data
              } 
            ],
            beforeCreate: [
              async ({ data, db }) => {
                data._id = `book_${new Date().getTime().toString()}`;
                const { chapters = [], ...rest } = data;
                const result = await db.create('chapters', chapters);
                return {
                  ...rest,
                  chapters: result.map((item) => item._id),
                };
              },
            ],
          },
        },
        chapters: {
          hooks: {
            beforeCreate: [
              ({ data }) => {
                data._id = `chapter_${new Date().getTime().toString()}`;
                return data;
              },
            ],
          },
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, HookService],
})
export class AppModule {}
