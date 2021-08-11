import {Rule, RuleConfig} from '../validationRules';
import {DataType} from '../../utility/dataType';

export interface RequireRuleConfig extends RuleConfig {
  /**
   * For some fields a blank is not an empty value. Allow for setting
   * alternative values that are also considered as being empty.
   */
  alternativeEmpties?: Array<string>;
}

export class RequireRule extends Rule {
  config: RequireRuleConfig;
  defaultMessage = 'Value is required. Cannot be empty.';

  constructor(config: RequireRuleConfig) {
    super(config);
    this.config = config;
  }

  /**
   * Required rule makes the field required.
   */
  get isRequired(): boolean {
    return true;
  }

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
    for (const alternativeEmpty of this.config.alternativeEmpties || []) {
      if (value === alternativeEmpty) {
        return this.message;
      }
    }

    return null;
  }
}
