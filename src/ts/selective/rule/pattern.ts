import {Rule, RuleConfig} from '../validationRules';

export interface PatternRuleConfig extends RuleConfig {
  message?: string;
  pattern: string;
}

export class PatternRule extends Rule {
  config: PatternRuleConfig;
  defaultMessage: string;
  pattern?: RegExp;

  constructor(config: PatternRuleConfig) {
    super(config);
    this.config = config;
    this.defaultMessage = `Value needs to match the pattern: ${this.config.pattern}`;
  }

  validate(value: any): string | null {
    // Allow for empty fields.
    // Use the required rule for making sure it exists.
    if (!value) {
      return null;
    }

    // Only need to compile the pattern once.
    if (!this.pattern) {
      this.pattern = new RegExp(this.config.pattern);
    }

    // Needs to match the pattern.
    if (!this.pattern.test(value)) {
      return this.message;
    }

    return null;
  }
}
