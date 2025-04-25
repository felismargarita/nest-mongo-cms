import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { OptionsType, ConnectionType } from './types';

@Injectable()
export class CMSService {
  logger = new Logger(CMSService.name);
  constructor(
    @InjectConnection() public readonly connection: Connection,
    @Inject('CONFIG_OPTIONS') private readonly options: OptionsType,
  ) {}

  wrapperConnection(): ConnectionType {
    return {
      slug: (slug: string) => ({
        findOne: async (filters: any) => {
          const data = await this.connection.db
            .collection(slug)
            .findOne(filters);
          return this.executeHooks('afterQuery', slug, data);
        },
        find: async (filters: any) => {
          const list = await this.connection.db
            .collection(slug)
            .find(filters)
            .toArray();
          const records = [];
          for (const item of list) {
            records.push(await this.executeHooks('afterQuery', slug, item));
          }
          return records;
        },
        insertOne: async (body: any) => {
          //execute beforeCreate hooks
          body = await this.executeHooks('beforeCreate', slug, body);

          const data = await this.connection.db
            .collection(slug)
            .insertOne(body);

          //execute afterCreate hooks
          return this.executeHooks('afterCreate', slug, data);
        },
        updateOne: async (filters: any, body: any) => {
          //execute beforeUpdate hooks
          body = await this.executeHooks('beforeUpdate', slug, body);

          const data = await this.connection.db
            .collection(slug)
            .updateOne(filters, body);

          //execute afterUpdate hooks
          return this.executeHooks('afterUpdate', slug, data);
        },
        deleteOne: async (filters: any) => {
          //execute beforeDelete hooks
          await this.executeHooks('beforeDelete', slug, filters);

          const data = await this.connection.db
            .collection(slug)
            .deleteOne(filters);

          //execute afterDelete hooks
          return this.executeHooks('afterDelete', slug, data);
        },
        // deleteMany: async (filters: any) => {
        //   //execute beforeDelete hooks
        //   const data = await this.connection.db
        //     .collection(slug)
        //     .deleteMany(filters);

        //   //execute afterDelete hooks
        //   return this.executeHooks('afterDelete', slug, data);
        // },
      }),
    };
  }

  async executeHooks(hookType: string, slug: string, data: unknown) {
    //execute global hooks

    // /**
    //  * @description afterQuery hooks
    //  */
    // const afterQueryHooksGlobal = this.options?.hooks?.afterQuery ?? [];
    // for (const hook of afterQueryHooksGlobal) {
    //   data =
    //     (await hook({ data, connection: this.wrapperConnection() })) ?? data;
    // }

    //execute slug hooks
    const slugOption = this.options.slugs[slug];

    /**
     * @description afterQuery hooks
     */
    if (hookType === 'afterQuery') {
      const afterQueryHooksSlug = slugOption?.hooks?.afterQuery ?? [];
      for (const hook of afterQueryHooksSlug) {
        data =
          (await hook({ data, connection: this.wrapperConnection() })) ?? data;
      }
    }

    /**
     * @description beforeCreate hooks
     */
    if (hookType === 'beforeCreate') {
      const beforeCreateHooksSlug = slugOption?.hooks?.beforeCreate ?? [];
      for (const hook of beforeCreateHooksSlug) {
        data =
          (await hook({ data, connection: this.wrapperConnection() })) ?? data;
      }
    }
    /**
     * @description afterCreate hooks
     */
    if (hookType === 'afterCreate') {
      const afterCreateHooksSlug = slugOption?.hooks?.afterCreate ?? [];
      for (const hook of afterCreateHooksSlug) {
        data =
          (await hook({ data, connection: this.wrapperConnection() })) ?? data;
      }
    }

    /**
     * @description beforeUpdate hooks
     */
    if (hookType === 'beforeUpdate') {
      const beforeUpdateHooksSlug = slugOption?.hooks?.beforeUpdate ?? [];
      for (const hook of beforeUpdateHooksSlug) {
        data =
          (await hook({ data, connection: this.wrapperConnection() })) ?? data;
      }
    }

    /**
     * @description afterUpdate hooks
     */
    if (hookType === 'afterUpdate') {
      const afterUpdateHooksSlug = slugOption?.hooks?.afterUpdate ?? [];
      for (const hook of afterUpdateHooksSlug) {
        data =
          (await hook({ data, connection: this.wrapperConnection() })) ?? data;
      }
    }

    /**
     * @description beforeDelete hooks
     */
    if (hookType === 'beforeDelete') {
      const beforeDeleteHooksSlug = slugOption?.hooks?.beforeDelete ?? [];
      for (const hook of beforeDeleteHooksSlug) {
        data =
          (await hook({ data, connection: this.wrapperConnection() })) ?? data;
      }
    }

    /**
     * @description afterDelete hooks
     */
    if (hookType === 'afterDelete') {
      const afterDeleteHooksSlug = slugOption?.hooks?.afterDelete ?? [];
      for (const hook of afterDeleteHooksSlug) {
        data =
          (await hook({ data, connection: this.wrapperConnection() })) ?? data;
      }
    }

    return data;
  }

  getBySlug(slug: string): Promise<any> {
    return this.wrapperConnection().slug(slug).findOne();
  }

  getRecordBySlugAndByKey(slug: string, key: any): Promise<any> {
    return this.wrapperConnection().slug(slug).findOne({ _id: key });
  }

  createRecordBySlug(slug: string, body: any): Promise<any> {
    return this.wrapperConnection().slug(slug).insertOne(body);
  }
}
