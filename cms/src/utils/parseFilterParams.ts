export const parseFilterParams = (filterType: string, filter: string) => {
  if (filterType === 'operator') {
    throw new Error('not supported filterType: ' + filterType);
  }
  if (filterType === 'json') {
    return JSON.parse(filter);
  }

  return {};
};
