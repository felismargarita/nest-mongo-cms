export const parseSortParams = (
  sortStr: string,
): { [key: string]: 'asc' | 'desc' } => {
  if (!sortStr) return {};
  return sortStr
    .split(',')
    .map((condition) => {
      const match = condition.match(/([+-]?)(\w+)/);
      if (!match) return null;

      const symbol = match[1];
      const field = match[2];
      const order = symbol === '-' ? 'desc' : 'asc';
      return { field, order };
    })
    .filter(Boolean)
    .reduce((pre, curr) => {
      return {
        ...pre,
        [curr.field]: curr.order,
      };
    }, {});
};
