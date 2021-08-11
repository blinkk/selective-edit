import {MinMaxRuleConfig, Rule, RuleConfig} from '../validationRules';
import {DataType} from '../../utility/dataType';

export interface LengthRuleConfig extends RuleConfig {
  max?: MinMaxRuleConfig;
  min?: MinMaxRuleConfig;
}

export class LengthRule extends Rule {
  config: LengthRuleConfig;
  defaultMessage = 'Value needs to have the correct length.';

  constructor(config: LengthRuleConfig) {
    super(config);
    this.config = config;
  }

  allowAdd(value: any): boolean {
    // Allow for empty fields.
    if (!value) {
      return true;
    }

    value = this.cleanValue(value);

    // Do not allow more to be added when at max length.
    if (this.config.max && value.length >= this.config.max.value) {
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

    // Do not allow more to be removed when at min length.
    if (this.config.min && value.length <= this.config.min.value) {
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

  /**
   * Field is considered required when there is a min value..
   */
  get isRequired(): boolean {
    return Boolean(this.config.min && this.config.min.value > 0);
  }

  validate(value: any): string | null {
    // Allow for empty fields.
    // Use the required rule for making sure it exists.
    if (!value || (DataType.isArray(value) && value.length === 0)) {
      return null;
    }

    value = this.cleanValue(value);

    if (this.config.min && value.length < this.config.min.value) {
      return this.config.min.message || this.message;
    }

    if (this.config.max && value.length > this.config.max.value) {
      return this.config.max.message || this.message;
    }

    return null;
  }
}
