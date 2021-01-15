import {Base} from '../mixins';
import {ClassManager} from '../utility/classes';
import {Config} from '../utility/config';
import {ConfigMixin} from '../mixins/config';
import {DEFAULT_ZONE_KEY} from './validation';
import {Types} from './types';
import {DataType} from '../utility/dataType';

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
    const newRule = this.types.newFromKey(ruleType);
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
  constructor(config: Config) {
    super();
    this.config = config;
  }

  allowAdd(value: any): boolean {
    return DataType.isArray(value);
  }

  allowRemove(value: any): boolean {
    return DataType.isArray(value);
  }

  validate(value: any): string | null {
    if (DataType.isArray(value)) {
      return 'test';
    }

    return null;
  }
}
