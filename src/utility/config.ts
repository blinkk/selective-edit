/**
 * Utility for working with configurations.
 */

/**
 * Manage configuration values.
 */
export class Config {
  config: Record<string, any>;
  private defaultValues: Record<string, any>;
  constructor(
    config?: Record<string, any>,
    defaultValues?: Record<string, any>
  ) {
    this.defaultValues = defaultValues || {};
    this.config = Object.assign({}, this.defaultValues, config || {});
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  get(key: string, defaultValue?: any): any {
    if (!(key in this.config)) {
      return defaultValue;
    }
    return this.config[key];
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  set(key: string, value: any): any {
    return (this.config[key] = value);
  }
}

export const autoConfig = (
  value: Record<string, any> | Config,
  defaultValues?: Record<string, any>
): Config => {
  if (value instanceof Config) {
    return value;
  }
  return new Config(value, defaultValues);
};
