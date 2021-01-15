import {Base} from '../mixins';
import {ClassManager} from '../utility/classes';
import {Config} from '../utility/config';
import {ConfigMixin} from '../mixins/config';
import {DEFAULT_ZONE_KEY} from './validation';
import {Types} from './types';

export interface RuleComponent {
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

  getZones(): Array<string> {
    return Object.keys(this.zoneToRules);
  }
}

export class Rule extends ConfigMixin(Base) implements RuleComponent {
  constructor(config: Config) {
    super();
    this.config = config;
  }
}
