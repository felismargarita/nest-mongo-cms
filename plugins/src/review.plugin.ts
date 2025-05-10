import { OptionsType, HookException, CatchHookExceptionDataType } from 'nest-mongo-cms';
import { v4 as uuid } from 'uuid';
import { NotFoundException, BadRequestException } from '@nestjs/common';

type ContentReviewParams = {
  [schema: string]: {
    collection?: string
  }
}

class ReviewInteruptException extends HookException {
  constructor(message: string) {
    super(message);
    this.name = 'ReviewInteruptException';
    Object.setPrototypeOf(this, ReviewInteruptException.prototype);
  }
}
/**
 * This plugin is recommended to be used when the target schema is independent and no other hooks are injected,
 * if there existing other plugins or hooks for this schema, the review data logic could not be stable / robust enough
 * @param schemas 
 * @returns 
 */
const ContentReview = (schemas: ContentReviewParams) => {
  const inject = (options: OptionsType) => {
    const schemaKeys = Object.keys(schemas);
    if (schemaKeys.length === 0) return options;


    //interupt the update / create / delete hooks
    schemaKeys.map((schemaEnableReview) => {
      const schemaConfig = options.schemas[schemaEnableReview] ?? {};

      const hooks = schemaConfig?.hooks ?? {};

      const beforeCreateHooks = hooks?.beforeCreate ?? [];

      const collection = schemas[schemaEnableReview].collection ?? `__${schemaEnableReview}_review`;
      /**
       * interput the create flow
       */
      beforeCreateHooks.push((params) => {
        if (params.context.reviewReplay) {
          // if this is a replay action don't interupt it!
          return params.data;
        }
        throw new ReviewInteruptException(`interupt the normal data change, insert data to review collection: ${collection}`);
      });
      hooks.beforeCreate = beforeCreateHooks;

      /**
       * recover from catchException hook
       */
      const catchException = hooks?.catchHookException ?? [];

      catchException.push(async (params) => {
        if (params.exception instanceof ReviewInteruptException) {
          params.exceptionActions.clear();

          /**
           * insert data to the review collection
           */
          const rawClient = params.rawDb.getClient().db().collection(collection);
          const reviewId = `review_${schemaEnableReview}_${uuid().replaceAll('-', '')}`;
          /**
           * review for create documents
           */
          if (params.name === 'beforeCreate') {
            const data = params.data as CatchHookExceptionDataType<'beforeCreate'>
            const result = await rawClient.insertOne({
              reviewId,
              type: 'create',
              createdAt: new Date(),
              payload: {
                data: data.pureData
              },
              status: 'in review'
            });
            
            const reviewDoc = await rawClient.findOne({ _id: result.insertedId });
            params.returnActions.set(reviewDoc);
          }

          if (params.name === 'beforeUpdate') {
            const data = params.data as CatchHookExceptionDataType<'beforeUpdate'>;
            const result = await rawClient.insertOne({
              reviewId,
              type: 'update',
              createdAt: new Date(),
              payload: {
                _id: (data.originalDocument as any)._id,
                data: data.pureData
              },
              status: 'in review'
            });
            const reviewDoc = await rawClient.findOne({ _id: result.insertedId });
            params.returnActions.set(reviewDoc);
          }

          if (params.name === 'beforeDelete') {
            const data = params.data as CatchHookExceptionDataType<'beforeDelete'>;
            const currentDocument = data.document
            const result = await rawClient.insertOne({
              reviewId,
              type: 'delete',
              createdAt: new Date(),
              payload: { 
                _id: currentDocument._id
              },
              status: 'in review'
            });
            const reviewDoc = await rawClient.findOne({ _id: result.insertedId });
            params.returnActions.set(reviewDoc);
          }
        }
      });
      hooks.catchHookException = catchException;

      /**
       * build some apis for quering the review collections
       */
      const operation = hooks.operation ?? [];

      operation.unshift({
        operationType: 'review',
        action: 'confirm',
        hook: async (params) => {
          const db = params.rawDb.getClient().db().collection(collection);

          const { reviewId, status } = params.context.body;

          if (status === 'approved') {
            let reviewDoc = await db.findOne({ reviewId });
            if (reviewDoc.status === 'approved') {
              throw new BadRequestException("review is already approved, don't approve twice!");
            }
            reviewDoc = await db.findOneAndUpdate({ reviewId }, { $set: { status } });
            if (!reviewDoc) {
              throw new NotFoundException("reivew doc is not found for id:" + reviewId );
            }
            /**
             * mark it as the review confirm process, otherwise, this action will be 
             * treated as the normal workflow that would be interupted as this plugin hook
            */
            params.context.reviewReplay = true;
            
            if (reviewDoc.type === 'create') {
              const { payload: { data } } = reviewDoc;
              return await params.db.create(params.schema, data);
            }
            if (reviewDoc.type === 'update') {
              const { payload: { data, _id } } = reviewDoc;
              return await params.db.updateById(params.schema, _id, data);
            }
            if (reviewDoc.type === 'delete') {
              return await params.db.deleteById(params.schema, reviewDoc.payload._id);
            }
            throw new BadRequestException("review doc status is unexpected", reviewDoc.status);
          } else if (status === 'reject') {
            return await db.findOneAndUpdate({ reviewId }, { $set: { status } });
          } else {
            throw new BadRequestException('review action is not supported')
          }
        }
      });

      operation.unshift({
        operationType: 'review',
        action: 'list',
        async hook(params) {
          const reviewCollection = params.rawDb.getClient().db().collection(collection);
          const {
            filter,
            sort,
            skip = 0,
            limit = 10
          } = params.context.body ?? {};
          //TODO validate the params
          return reviewCollection.find(filter).sort(sort).skip(skip).limit(limit).toArray()
        }
      })

      hooks.operation = operation;
      //######################################################
      schemaConfig.hooks = hooks;
      options.schemas[schemaEnableReview] = schemaConfig;
    })

    //add a opeation hook list / confirm / reject the content change
    return options;
  }
  return {
    name: 'ContentReview',
    inject,
    priority: 0,
    depends: [],
  }
}

export { ContentReview }