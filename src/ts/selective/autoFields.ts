import {DataType} from '../utility/dataType';
import {FieldConfig} from './field';
import {ListFieldConfig} from './field/list';

export interface AutoFieldsConfig {
  ignoreKeys?: Array<string>;
  ignorePatterns?: Array<string>;
}

export interface AutoFieldsComponent {
  config: AutoFieldsConfig;

  /**
   * Use the provided data to guess what types of field to use
   * to edit the data.
   *
   * @param key Key to use in the configuration.
   * @param data Data to use for guessing field configurations.
   */
  guessField(key: string, data: any): FieldConfig;

  /**
   * Use the provided data to guess what types of fields to use
   * to edit the data.
   *
   * @param data Data to use for guessing field configurations.
   */
  guessFields(data: any): Array<FieldConfig>;
}

export interface AutoFieldsConstructor {
  new (config: AutoFieldsConfig): AutoFieldsComponent;
}

export class AutoFields implements AutoFieldsComponent {
  config: AutoFieldsConfig;

  constructor(config?: AutoFieldsConfig) {
    this.config = config || {};
  }

  protected deepGuess(data: any, keyBase?: Array<string>): Array<FieldConfig> {
    keyBase = keyBase || [];

    if (DataType.isArray(data)) {
      return this.deepGuessArray(data, keyBase);
    }

    // Object are guessed based on keys.
    if (DataType.isObject(data)) {
      return this.deepGuessObject(
        data as unknown as Record<string, any>,
        keyBase
      );
    }

    // Default to guessing as a single field.
    return [this.guessField(keyBase.join('.'), data)];
  }

  protected deepGuessArray(
    data: Array<any>,
    keyBase?: Array<string>
  ): Array<FieldConfig> {
    keyBase = keyBase || [];

    if (!data.length) {
      return [];
    }
    // Handle arrays by guessing for first element.
    return this.deepGuess(data[0], keyBase);
  }

  protected deepGuessObject(
    data: Record<string, any>,
    keyBase?: Array<string>
  ) {
    let fieldConfigs: Array<FieldConfig> = [];
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

  protected deepGuessSimple(data: any, keyBase?: Array<string>): FieldConfig {
    keyBase = keyBase || [];
    const fullKey = keyBase.join('.');
    return this.guessField(fullKey, data);
  }

  guessField(key: string, data: any): FieldConfig {
    const fieldType = this.guessType(key, data);
    const label = guessLabel(key);
    const fieldConfig: FieldConfig = {
      key: key,
      type: fieldType,
    };

    if (label !== '') {
      fieldConfig.label = label;
    }

    if (fieldType === 'list') {
      (fieldConfig as ListFieldConfig).fields = this.deepGuess(data);
    }

    return fieldConfig;
  }

  guessFields(data: any): Array<FieldConfig> {
    return this.deepGuess(data);
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
    const ignorePatterns: Array<string> = this.config.ignorePatterns || [];
    const ignoreKeys: Array<string> = this.config.ignoreKeys || [];

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

/**
 * From the key guess the label of the field.
 *
 * ex: key.subKey => Key SubKey
 */
export function guessLabel(key: string): string {
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
