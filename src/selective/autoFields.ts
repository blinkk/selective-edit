import {Base} from '../mixins';
import {Config} from '../utility/config';
import {ConfigMixin} from '../mixins/config';
import {DataType} from '../utility/dataType';

export interface AutoFieldsComponent {
  /**
   * Use the provided data to guess what types of field to use
   * to edit the data.
   *
   * @param key Key to use in the configuration.
   * @param data Data to use for guessing field configurations.
   */
  guessField(key: string, data: any): Config;

  /**
   * Use the provided data to guess what types of fields to use
   * to edit the data.
   *
   * @param data Data to use for guessing field configurations.
   */
  guessFields(data: any): Array<Config>;

  /**
   * AutoFields can define any properties or methods they need.
   */
  [x: string]: any;
}

export interface AutoFieldsConstructor {
  new (config: Config): AutoFieldsComponent;
}

export class AutoFields
  extends ConfigMixin(Base)
  implements AutoFieldsComponent {
  constructor(config: Config) {
    super();
    this.config = config;
  }

  protected deepGuess(data: string, keyBase?: Array<string>): Array<Config> {
    keyBase = keyBase || [];

    // Handle arrays by guessing for first element.
    if (DataType.isArray(data)) {
      if (!data.length) {
        return [];
      }
      return this.deepGuess(data[0], keyBase);
    }

    // Object are guessed based on keys.
    if (DataType.isObject(data)) {
      return this.deepGuessObject(
        (data as unknown) as Record<string, any>,
        keyBase
      );
    }

    // Default to guessing as a single field.
    return [this.guessField(keyBase.join('.'), data)];
  }

  protected deepGuessObject(
    data: Record<string, any>,
    keyBase?: Array<string>
  ) {
    let fieldConfigs: Array<Config> = [];
    keyBase = keyBase || [];

    for (const key of Object.keys(data)) {
      // Skip ignored keys.
      if (this.isIgnoredKey(key)) {
        continue;
      }

      const newKeyBase = keyBase.concat([key]);
      const newData = data[key];

      if (DataType.isObject(newData)) {
        fieldConfigs = fieldConfigs.concat(
          this.deepGuessObject(newData, newKeyBase)
        );
      } else {
        fieldConfigs.push(this.deepGuessSimple(data[key], newKeyBase));
      }
    }

    return fieldConfigs;
  }

  protected deepGuessSimple(data: any, keyBase?: Array<string>): Config {
    keyBase = keyBase || [];
    const fullKey = keyBase.join('.');
    return this.guessField(fullKey, data);
  }

  guessField(key: string, data: any): Config {
    const fieldType = this.guessType(key, data);
    const label = this.guessLabel(key);
    const fieldConfig: Record<string, any> = {
      type: fieldType,
    };

    if (key !== '') {
      fieldConfig['key'] = key;
    }

    if (label !== '') {
      fieldConfig['label'] = label;
    }

    if (fieldType === 'list') {
      fieldConfig['fields'] = this.deepGuess(data);
    }

    return new Config(fieldConfig);
  }

  guessFields(data: any): Array<Config> {
    return this.deepGuess(data);
  }

  guessFieldsAsConfig(data: any): Config {
    return new Config({
      fields: this.guessFields(data),
    });
  }

  /**
   * From the key guess the label of the field.
   */
  guessLabel(key: string): string {
    key = key.replace(/\./g, ' ');
    key = key.replace(/-/g, ' ');
    key = key.replace(/_/g, ' ');
    return key
      .split(' ')
      .map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  /**
   * Guess the type of field to use based on the key and value.
   *
   * @param key Key to guess the type of field.
   * @param data Data to use for guessing field type.
   */
  guessType(key: string, data: any): string {
    if (DataType.isNull(data) || DataType.isUndefined(data)) {
      return 'text';
    }

    if (DataType.isArray(data)) {
      return 'list';
    }

    if (DataType.isString(data) && data.length > 75) {
      return 'textarea';
    }

    return 'text';
  }

  protected isIgnoredKey(key: string): boolean {
    // Ignore keys based on patterns or a set of keys.
    const ignorePatterns: Array<string> =
      this.config?.get('ignorePatterns') || [];
    const ignoreKeys: Array<string> = this.config?.get('ignoreKeys') || [];

    // Test for the ignored keys.
    if (ignoreKeys.includes(key)) {
      return true;
    }

    // Test for the ignored patterns.
    for (const ignorePattern of ignorePatterns) {
      const ignoreRegex = new RegExp(ignorePattern);
      if (ignoreRegex.test(key)) {
        return true;
      }
    }

    return false;
  }
}
