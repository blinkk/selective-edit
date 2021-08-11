import {Base} from '../mixins';
import {Rules} from './validationRules';
import {UuidMixin} from '../mixins/uuid';

export const DEFAULT_ZONE_KEY = 'default';

export enum ValidationLevel {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export interface ValidationComponent {
  zoneToResults: Record<string, Array<ValidationResult>>;

  addResult(result: ValidationResult, zoneKey?: string): void;
  /**
   * Filter results by level.
   *
   * @param level Result level to filter by.
   * @param zoneKey Zone to check for results. Defaults to DEFAULT_ZONE_KEY.
   */
  filterResults(
    level: ValidationLevel,
    zoneKey?: string
  ): Array<ValidationResult>;

  /**
   * Retrieve results by zone and/or max level.
   *
   * @param zoneKey Zone to check for results. Defaults to DEFAULT_ZONE_KEY.
   * @param maxLevel Max result level to retrieve.
   */
  getResults(
    zoneKey?: string,
    maxLevel?: ValidationLevel
  ): Array<ValidationResult>;

  /**
   * Check if a zone has any results or if any zone has results.
   *
   * @param zoneKey Zone to check for results. Defaults to DEFAULT_ZONE_KEY. Provide null to check all zones.
   * @param level Max result level to check against.
   */
  hasAnyResults(zoneKey?: string | null, maxLevel?: ValidationLevel): boolean;

  /**
   * Runs the validation rules against the value.
   *
   * @param value Value to validate.
   * @param zoneKey Zone to store validation result.
   */
  validate(value: any, zoneKey?: string): boolean;
}

export class Validation implements ValidationComponent {
  zoneToResults: Record<string, Array<ValidationResult>>;
  rules: Rules;

  constructor(rules: Rules) {
    this.rules = rules;
    this.zoneToResults = {};
  }

  addResult(result: ValidationResult, zoneKey?: string): void {
    const resultsForZone = this.getResults(zoneKey);
    resultsForZone.push(result);
  }

  filterResults(
    level: ValidationLevel,
    zoneKey?: string
  ): Array<ValidationResult> {
    const resultsForZone = this.getResults(zoneKey);
    const filterFunc = (result: ValidationResult) => {
      return result.level === level;
    };
    return resultsForZone.filter(filterFunc);
  }

  /**
   * Checks each of the rules to see if the field is required.
   */
  isRequired(zoneKey?: string): boolean {
    for (const rule of this.rules.getRulesForZone(zoneKey)) {
      if (rule.isRequired) {
        return true;
      }
    }
    return false;
  }

  getResults(
    zoneKey?: string,
    maxLevel?: ValidationLevel
  ): Array<ValidationResult> {
    zoneKey = zoneKey || DEFAULT_ZONE_KEY;

    if (!this.zoneToResults[zoneKey]) {
      this.zoneToResults[zoneKey] = [];
    }

    // Filter down the results if retrieving by level.
    if (maxLevel) {
      const filterFunc = (result: ValidationResult) => {
        if (maxLevel === ValidationLevel.Info) {
          return result.level === ValidationLevel.Info;
        }
        if (maxLevel === ValidationLevel.Warning) {
          return (
            result.level === ValidationLevel.Info ||
            result.level === ValidationLevel.Warning
          );
        }
        // Max error level matches all levels.
        return true;
      };
      return this.zoneToResults[zoneKey].filter(filterFunc);
    }

    return this.zoneToResults[zoneKey];
  }

  hasAnyResults(zoneKey?: string | null, maxLevel?: ValidationLevel): boolean {
    // Check across all zones for results.
    if (zoneKey === null) {
      for (const zoneKey of this.zones) {
        if (this.hasAnyResults(zoneKey, maxLevel)) {
          return true;
        }
      }
      return false;
    }

    // Check against specific zone for any matching results.
    return this.getResults(zoneKey, maxLevel).length > 0;
  }

  validate(value: any, zoneKey?: string): boolean {
    let hasErrors = false;
    for (const rule of this.rules.getRulesForZone(zoneKey)) {
      const result = rule.validate(value);
      if (result) {
        this.addResult(new ValidationResult(result, rule.level), zoneKey);
        hasErrors = true;
      }
    }
    return hasErrors;
  }

  get zones(): Array<string> {
    return Object.keys(this.zoneToResults);
  }
}

export class ValidationResult extends UuidMixin(Base) {
  level: ValidationLevel;
  message: string;

  constructor(message: string, level = ValidationLevel.Error) {
    super();
    this.message = message;
    this.level = level;
  }
}
