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
    }),
  ],
  controllers: [AppController],
  providers: [AppService, HookService],
})
export class AppModule {}
