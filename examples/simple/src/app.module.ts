import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CMSModule } from 'nest-cms';
import { BookSchema } from './book.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChapterSchema } from './chapter.schema';

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
            beforeCreate: [
              async ({ data, db }) => {
                data._id = `book_${new Date().getTime().toString()}`;
                const { chapters = [], ...rest } = data;
                const result = await db.create('chapters', chapters);
                console.log('result', result);
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
  providers: [AppService],
})
export class AppModule {}
