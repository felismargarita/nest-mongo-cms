import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CMSModule } from 'nest-mongo-cms';
import { BookSchema } from './book.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ChapterSchema } from './chapter.schema';
import { HookService } from './hook.service';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/cms-test', {
      connectionName: 'library',
    }),
    MongooseModule.forFeature([
      {
        name: 'books',
        schema: BookSchema,
      },
      {
        name: 'chapters',
        schema: ChapterSchema,
      },
    ], 'library'),
    CMSModule.register({
      path: '/cms',
      connectionName: 'library',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, HookService],
})
export class AppModule {}
