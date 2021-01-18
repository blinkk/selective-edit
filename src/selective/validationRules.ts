import {DEFAULT_ZONE_KEY, ValidationLevel} from './validation';
import {Base} from '../mixins';
import {ClassManager} from '../utility/classes';
import {Config} from '../utility/config';
import {ConfigMixin} from '../mixins/config';
import {DataType} from '../utility/dataType';
import {Types} from './types';

export interface RuleConfig {
  message?: string;
}

/**
 * Validation rules define the validation on the editor fields.
 *
 * Each field will create an instance of the validation
 * rule based on the validation definitions in the field config.
 */
export interface RuleComponent {
  /**
   * Given the value, should it be able to add new values?
   *
   * Used when dealing with a list to control if the user can
   * add more items.
   *
   * @param value Current value of the field.
   */
  allowAdd(value: any): boolean;

  /**
   * Given the value, should it be able to remove new values?
   *
   * Used when dealing with a list to control if the user can
   * remove more items.
   *
   * @param value Current value of the field.
   */
  allowRemove(value: any): boolean;

  /**
   * Validation level used if the validation fails.
   */
  level: ValidationLevel;

  /**
   * Validates the field using the current value.
   *
   * If there is an error with the validation, return an error
   * message string to be displayed to the user.
   *
   * @param value Current value of the field.
   */
  validate(value: any): string | null;

  /**
   * Rules can define any properties or methods they need.
   */
  [x: string]: any;
}

export type RuleConstructor = (types: Types) => RuleComponent;

export class Rules {
  zoneToRules: Record<string, Array<RuleComponent>>;
  types: ClassManager<RuleConstructor, RuleComponent>;

  constructor(ruleTypes: ClassManager<RuleConstructor, RuleComponent>) {
    this.zoneToRules = {};
    this.types = ruleTypes;
  }

  addRuleFromConfig(ruleConfig: Config, zoneKey = DEFAULT_ZONE_KEY) {
    const ruleType = ruleConfig.get('type', '__missing_type__');
    const newRule = this.types.newFromKey(ruleType, ruleConfig);
    if (!newRule) {
      console.error(
        `Unable to add validation rule for unknown validation type: ${ruleType}`
      );
      return;
    }
    const zoneRules = this.getRulesForZone(zoneKey);
    zoneRules.push(newRule);
  }

  getRulesForZone(zoneKey = DEFAULT_ZONE_KEY): Array<RuleComponent> {
    if (!this.zoneToRules[zoneKey]) {
      this.zoneToRules[zoneKey] = [];
    }
    return this.zoneToRules[zoneKey];
  }

  get zones(): Array<string> {
    return Object.keys(this.zoneToRules);
  }
}

export class Rule extends ConfigMixin(Base) implements RuleComponent {
  defaultMessage = 'Value is invalid.';
  defaultLevel: ValidationLevel;

  constructor(config: Config) {
    super();
    this.config = config;

    // Default to error level.
    this.defaultLevel = ValidationLevel.Error;
  }

  /**
   * Default to allowing adding.
   *
   * @param value Current value of the field.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allowAdd(value: any): boolean {
    return true;
  }

  /**
   * Default to allowing removal.
   *
   * @param value Current value of the field.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allowRemove(value: any): boolean {
    return true;
  }

  /**
   * Validation level to use if the validation fails.
   */
  get level(): ValidationLevel {
    return this.config?.get('level') || this.defaultLevel;
  }

  /**
   * Error message from the config or fall back to the default.
   */
  get message(): string {
    return this.config?.get('message') || this.defaultMessage;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(value: any): string | null {
    console.error('Validation check not defined.');
    return null;
  }
}

export class LengthRule extends Rule {
  defaultMessage = 'Value needs to have the correct length.';

  allowAdd(value: any): boolean {
    // Allow for empty fields.
    if (!value) {
      return true;
    }

    value = this.cleanValue(value);
    const configMax = this.config?.get('max');

    // Do not allow more to be added when at max length.
    if (configMax && value.length >= configMax.value) {
      return false;
    }
    return true;
  }

  allowRemove(value: any): boolean {
    // Allow for empty fields.
    if (!value) {
      return true;
    }

    value = this.cleanValue(value);
    const configMin = this.config?.get('min');

    // Do not allow more to be removed when at max length.
    if (configMin && value.length <= configMin.value) {
      return false;
    }
    return true;
  }

  private cleanValue(value: any) {
    if (DataType.isString(value)) {
      // Do not count whitespace.
      value = value.trim();
    }
    return value;
  }

  validate(value: any): string | null {
    // Allow for empty fields.
    // Use the required rule for making sure it exists.
    if (!value || (DataType.isArray(value) && value.length === 0)) {
      return null;
    }

    value = this.cleanValue(value);
    const configMax = this.config?.get('max');
    const configMin = this.config?.get('min');

    if (configMin && value.length < configMin.value) {
      return configMin.message || this.message;
    }

    if (configMax && value.length > configMax.value) {
      return configMax.message || this.message;
    }

    return null;
  }
}

export class MatchRule extends Rule {
  defaultMessage = 'Value needs to match the validation rule.';
  patternCache: Record<string, RegExp>;

  constructor(config: Config) {
    super(config);
    this.patternCache = {};
  }

  private cachePattern(key: string, pattern: string): RegExp {
    if (!(key in this.patternCache)) {
      this.patternCache[key] = new RegExp(pattern);
    }
    return this.patternCache[key];
  }

  validate(value: any): string | null {
    // Allow for empty fields.
    // Use the required rule for making sure it exists.
    if (!value) {
      return null;
    }

    // Handle the allowed matching.
    let matchConfig = this.config?.get('allowed');
    if (matchConfig) {
      // Matching values are allowed.
      if (matchConfig.pattern) {
        if (!this.cachePattern('allowed', matchConfig.pattern).test(value)) {
          return matchConfig.message || this.message;
        }
      }

      // Matching specific values only.
      if (matchConfig.values) {
        if (!matchConfig.values.includes(value)) {
          return matchConfig.message || this.message;
        }
      }
    }

    // Handle the excluded matching.
    matchConfig = this.config?.get('excluded');
    if (matchConfig) {
      // Matching values are NOT allowed.
      if (matchConfig.pattern) {
        if (this.cachePattern('excluded', matchConfig.pattern).test(value)) {
          return matchConfig.message || this.message;
        }
      }

      // Matching specific values NOT allowed.
      if (matchConfig.values) {
        if (matchConfig.values.includes(value)) {
          return matchConfig.message || this.message;
        }
      }
    }

    return null;
  }
}

export class PatternRule extends Rule {
  defaultMessage: string;
  pattern?: RegExp;

  constructor(config: Config) {
    super(config);
    this.defaultMessage = `Value needs to match the pattern: ${
      this.config?.get('pattern') || '__missing__'
    }`;
  }

  validate(value: any): string | null {
    // Allow for empty fields.
    // Use the required rule for making sure it exists.
    if (!value) {
      return null;
    }

    // Only need to compile the pattern once.
    if (!this.pattern) {
      this.pattern = new RegExp(this.config?.get('pattern'));
    }

    // Needs to match the pattern.
    if (!this.pattern.test(value)) {
      return this.message;
    }

    return null;
  }
}

export class RangeRule extends Rule {
  defaultMessage = 'Value needs to be a number in range.';

  allowAdd(value: any): boolean {
    // Allow for empty fields.
    if (!value) {
      return true;
    }

    value = this.cleanValue(value);
    const configMax = this.config?.get('max');

    // Do not allow more to be added when at max length.
    if (configMax && value.length >= configMax.value) {
      return false;
    }
    return true;
  }

  allowRemove(value: any): boolean {
    // Allow for empty fields.
    if (!value) {
      return true;
    }

    value = this.cleanValue(value);
    const configMin = this.config?.get('min');

    // Do not allow more to be removed when at max length.
    if (configMin && value.length <= configMin.value) {
      return false;
    }
    return true;
  }

  private cleanValue(value: any) {
    if (DataType.isString(value)) {
      // Do not count whitespace.
      value = value.trim();
    }
    return value;
  }

  validate(value: any): string | null {
    // Allow for empty fields.
    // Use the required rule for making sure it exists.
    if (!value) {
      return null;
    }

    const configMax = this.config?.get('max');
    const configMin = this.config?.get('min');

    if (DataType.isArray(value)) {
      if (configMin && value.length < configMin.value) {
        return configMin.message || this.message;
      }

      if (configMax && value.length > configMax.value) {
        return configMax.message || this.message;
      }
    } else {
      value = parseFloat(value);

      if (isNaN(value)) {
        return this.message;
      }

      if (configMin && value < configMin.value) {
        return configMin.message || this.message;
      }

      if (configMax && value > configMax.value) {
        return configMax.message || this.message;
      }
    }

    return null;
  }
}

export class RequireRule extends Rule {
  alternativeEmpties?: Array<string>;
  defaultMessage = 'Value is required. Cannot be empty.';

  validate(value: any): string | null {
    if (!value) {
      return this.message;
    }

    // Handle required array values.
    if (DataType.isArray(value)) {
      if (value.length < 1) {
        return this.message;
      }
    }

    // Require that it be more than just whitespace.
    try {
      value = value.trim();
      if (!value.length) {
        return this.message;
      }
    } catch (e) {
      if (e instanceof TypeError) {
        // Value type doesn't have a trim or length.
      } else {
        throw e;
      }
    }

    // Some fields a blank is not an empty value. Allow for setting
    // alternative values that are also considered as being empty.
    for (const alternativeEmpty of this?.alternativeEmpties || []) {
      if (value === alternativeEmpty) {
        return this.message;
      }
    }

    return null;
  }
}
