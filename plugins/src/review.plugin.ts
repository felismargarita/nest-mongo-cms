import { OptionsType, HookException, CatchHookExceptionDataType } from 'nest-mongo-cms';
import { v4 as uuid } from 'uuid'
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

      /**
       * interput the create flow
       */
      beforeCreateHooks.push(() => {
        throw new ReviewInteruptException('test interupt');
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
          const collection = schemas[schemaEnableReview].collection ?? `__${schemaEnableReview}_review`;

          const rawClient = params.rawDb.getClient().db().collection(collection);

          /**
           * review for create documents
           */
          if (params.name === 'beforeCreate') {
            const data = params.data as CatchHookExceptionDataType<'beforeCreate'>
            const result = await rawClient.insertOne({
              reviewId: `review_${schemaEnableReview}_${uuid().replaceAll('-', '')}`,
              targetDocument: data.data,
              currentDocument: null,
            });
            
            const reviewDoc = await rawClient.findOne({ _id: result.insertedId });
            params.returnActions.set(reviewDoc);
          }

          if (params.name === 'beforeUpdate') {

          }

          if (params.name === 'beforeDelete') {

          }


        }
      });
      hooks.catchHookException = catchException;

      /**
       * build some apis for quering the review collections
       */



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