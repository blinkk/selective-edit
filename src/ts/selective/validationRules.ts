import {DEFAULT_ZONE_KEY, ValidationLevel} from './validation';
import {Base} from '../mixins';
import {ClassManager} from '../utility/classes';
import {Types} from './types';

export interface AllowExcludeRuleConfig {
  message?: string;
  pattern?: string;
  values?: Array<string | RegExp>;
}

export interface MinMaxRuleConfig {
  message?: string;
  value: number;
}

export interface RuleConfig {
  level?: ValidationLevel;
  message?: string;
  type: string;
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
   * Does the rule make the value required?
   *
   * The UI needs to be able to mark fields that are required
   * without needing to show the entire error state.
   *
   * If a validation rule makes it required, this allows the
   * UI to flag the field for the user without a full error
   * display.
   */
  isRequired: boolean;

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
}

export type RuleConstructor = (types: Types) => RuleComponent;

export class Rules {
  zoneToRules: Record<string, Array<RuleComponent>>;
  types: ClassManager<RuleConstructor, RuleComponent>;

  constructor(ruleTypes: ClassManager<RuleConstructor, RuleComponent>) {
    this.zoneToRules = {};
    this.types = ruleTypes;
  }

  addRuleFromConfig(ruleConfig: RuleConfig, zoneKey = DEFAULT_ZONE_KEY) {
    const newRule = this.types.newFromKey(ruleConfig.type, ruleConfig);
    if (!newRule) {
      console.error(
        `Unable to add validation rule for unknown validation type: ${ruleConfig.type}`
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

export class Rule extends Base implements RuleComponent {
  config: RuleConfig;
  defaultMessage = 'Value is invalid.';
  defaultLevel: ValidationLevel;

  constructor(config: RuleConfig) {
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
   * Does the rule make the value required?
   *
   * By default, a validation rule does not make the value required.
   */
  get isRequired(): boolean {
    return false;
  }

  /**
   * Validation level to use if the validation fails.
   */
  get level(): ValidationLevel {
    return this.config.level || this.defaultLevel;
  }

  /**
   * Error message from the config or fall back to the default.
   */
  get message(): string {
    return this.config.message || this.defaultMessage;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  validate(value: any): string | null {
    console.error('Validation check not defined.');
    return null;
  }
}
