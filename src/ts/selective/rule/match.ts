import {AllowExcludeRuleConfig, Rule, RuleConfig} from '../validationRules';
import {DataType} from '../../utility/dataType';

export interface MatchRuleConfig extends RuleConfig {
  allowed?: AllowExcludeRuleConfig;
  excluded?: AllowExcludeRuleConfig;
}

export class MatchRule extends Rule {
  config: MatchRuleConfig;
  defaultMessage = 'Value needs to match the validation rule.';
  patternCache: Record<string, RegExp>;

  constructor(config: MatchRuleConfig) {
    super(config);
    this.config = config;
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
    let matchConfig = this.config.allowed;
    if (matchConfig) {
      // Matching values are allowed.
      if (matchConfig.pattern) {
        if (!this.cachePattern('allowed', matchConfig.pattern).test(value)) {
          return matchConfig.message || this.message;
        }
      }

      // Matching specific values only.
      if (matchConfig.values && matchConfig.values.length) {
        let inValues = false;
        for (const possibleValue of matchConfig.values) {
          if (DataType.isRegExp(possibleValue)) {
            if ((possibleValue as RegExp).test(value)) {
              inValues = true;
              break;
            }
          } else if (possibleValue == value) {
            inValues = true;
            break;
          }
        }

        if (!inValues) {
          return matchConfig.message || this.message;
        }
      }
    }

    // Handle the excluded matching.
    matchConfig = this.config.excluded;
    if (matchConfig) {
      // Matching values are NOT allowed.
      if (matchConfig.pattern) {
        if (this.cachePattern('excluded', matchConfig.pattern).test(value)) {
          return matchConfig.message || this.message;
        }
      }

      // Matching specific values NOT allowed.
      if (matchConfig.values) {
        for (const possibleValue of matchConfig.values) {
          if (DataType.isRegExp(possibleValue)) {
            if ((possibleValue as RegExp).test(value)) {
              return matchConfig.message || this.message;
            }
          } else if (possibleValue == value) {
            return matchConfig.message || this.message;
          }
        }
      }
    }

    return null;
  }
}
