import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CMSModule } from 'nest-cms';

@Module({
  imports: [
    CMSModule.register({
      // hooks: {

      // },
      slugs: {
        books: {
          hooks: {
            afterQuery: [
              async ({ data, connection }) => {
                return {
                  ...(data as any),
                  list: await connection.slug('extra').find(),
                };
              },
            ],
            beforeCreate: [
              async ({ data, connection }) => {
                (data as any)._id =
                  'book_' + Math.random().toString(36).substring(2, 15);
                return {
                  ...(data as any),
                  new_field: 'this hooked data',
                };
              },
            ],
            afterCreate: [
              async ({ data, connection }) => {
                connection.slug('logs').insertOne({
                  ...(data as any),
                  createdAt: new Date(),
                });
                return {
                  ...(data as any),
                  new_field: 'this hooked data',
                };
              },
            ],
          },
        },
        extra: {
          hooks: {
            afterQuery: [
              async ({ data }) => {
                return {
                  ...(data as any),
                  extra: 'data hooked by extra hooks',
                };
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
