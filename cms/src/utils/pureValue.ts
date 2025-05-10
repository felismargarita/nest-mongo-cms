import { cloneDeep } from 'lodash';
export const createPureValue = <T>(value: T) => Object.freeze(cloneDeep(value));
