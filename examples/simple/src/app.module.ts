import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CMSModule } from 'nest-cms';
import { BookSchema } from './book.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/cms-test'),
    MongooseModule.forFeature([{ name: 'books', schema: BookSchema }]),
    CMSModule.register({
      path: '/cms',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
