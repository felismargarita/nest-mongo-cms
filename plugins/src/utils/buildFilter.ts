
type Operator = {
  contains?: string
  eq?: string | number | Date
  lt?: string | number | Date
  lte?: string | number | Date
  gt?: string | number | Date
  gte?: string | number | Date
  exists?: boolean
}

type Filters = {
  [key: string]: string | number | Date | null | undefined | Operator
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/

export const buildFilter = (filters?: Filters | boolean | null): Record<string, any> => {
  if (!filters || typeof filters !== 'object') return {}
  return Object.entries(filters).reduce((acc, [field, value]) => {
    if (value === null || value === undefined) {
      return acc
    }

    if (typeof value === 'object' && !(value instanceof Date)) {
      const operatorObj = value as Operator
      const mongoOperators: Record<string, any> = {}

      if (operatorObj.contains !== undefined) {
        mongoOperators.$regex = operatorObj.contains
        mongoOperators.$options = 'i'
      }

      const processNumericOp = (op: keyof Operator, mongoOp: string) => {
        if (operatorObj[op] !== undefined) {
          mongoOperators[mongoOp] = convertValue(operatorObj[op]!)
        }
      }

      processNumericOp('eq', '$eq')
      processNumericOp('lt', '$lt')
      processNumericOp('lte', '$lte') 
      processNumericOp('gt', '$gt')
      processNumericOp('gte', '$gte')

      if (operatorObj.exists !== undefined) {
        mongoOperators.$exists = operatorObj.exists
      }

      acc[field] = { ...acc[field], ...mongoOperators }
    } else {
      acc[field] = convertValue(value)
    }

    return acc
  }, {} as Record<string, any>)
}

const convertValue = (value: string | number | Date | boolean): any => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (ISO_DATE_REGEX.test(value)) {
      return new Date(value)
    }
    return value
  }
  
  if (value instanceof Date) {
    return value
  }
  
  return value
}