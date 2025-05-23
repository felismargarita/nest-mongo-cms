import { DeferredCall } from '../types';

export const produceDeferCalls = () => {
  const deferredCalls: DeferredCall[] = [];
  const defer = (deferredCall: DeferredCall) => {
    deferredCalls.push(deferredCall);
  };

  const deferCall = () => Promise.all(deferredCalls.map((fn) => fn()));
  return {
    defer,
    deferCall,
  };
};
