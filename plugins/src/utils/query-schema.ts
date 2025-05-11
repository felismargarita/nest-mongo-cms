import { z } from 'zod';

const sortValues = ['asc', 'desc', 'ascending', 'descending'] as const;



export const QueryZod = (keys: string[] = []) => {
  return z.object({
    filter: z.any(),
    sort: keys.reduce((pre, key) => {
      return {

        ...pre,
        [key]: z.enum(sortValues)
      }
    }, {} as any),
    skip: z.number(),
    limit: z.number(),
  }) 
}