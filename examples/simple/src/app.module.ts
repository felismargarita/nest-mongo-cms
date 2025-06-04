import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CMSModule } from 'nest-mongo-cms';
import { BookSchema } from './book.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChapterSchema } from './chapter.schema';
import { HookService } from './hook.service';
import { Hook2Service } from './hook2.service';
import { VersionControl, ContentReview } from '@nest-mongo-cms/plugins';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/cms-test', {
      connectionName: 'library1',
    }),
    MongooseModule.forRoot('mongodb://localhost/cms-new', {
      connectionName: 'library2',
    }),
    MongooseModule.forFeature(
      [
        {
          name: 'books',
          schema: BookSchema,
        },
        {
          name: 'chapters',
          schema: ChapterSchema,
        },
      ],
      'library1',
    ),
    MongooseModule.forFeature(
      [
        {
          name: 'books',
          schema: BookSchema,
        },
        {
          name: 'chapters',
          schema: ChapterSchema,
        },
      ],
      'library2',
    ),
    CMSModule.register({
      path: '/cms1',
      connectionName: 'library1',
      schemas: {
        books: {
          plugins: [
            VersionControl({ max: 5, collection: '__book_versions' }),
            // ContentReview({ collection: '__books_review' }),
          ]
        }
      }
    }),
  ],
  controllers: [AppController],
  providers: [AppService, HookService, Hook2Service],
})
export class AppModule {}
