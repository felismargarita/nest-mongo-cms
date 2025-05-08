import { OptionsType, HookAbortException } from 'nest-mongo-cms';

type ContentReviewParams = {
  [schema: string]: {
    collection?: string
  }
}


const ContentReview = (schemas: string[]) => {
  return (options: OptionsType) => {

    
    //interupt the update / create / delete hooks


    //add a opeation hook list / confirm / reject the content change



  }
}

export { ContentReview }