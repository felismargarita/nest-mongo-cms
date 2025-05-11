import { OptionsType } from '../types';
import { CMSException } from '../exceptions/cms.exception';

const injectPlugins = (options: OptionsType) => {
  for (const schemaEntry of Object.entries(options.schemas)) {
    const [schemaKey, schemaValue] = schemaEntry;
    const { plugins = [] } = schemaValue;
    if (!Array.isArray(plugins)) {
      throw new CMSException(
        `cms schema [${schemaKey}] config error, plugins must be an array.`,
      );
    }
    options.schemas[schemaKey] = plugins.reduce((preSchemaValue, plugin) => {
      return plugin.inject(schemaKey, preSchemaValue);
    }, schemaValue);
  }
  return options;
};

export { injectPlugins };
