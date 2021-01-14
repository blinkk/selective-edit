import {Types} from './types';

export interface RuleComponent {
  /**
   * Rules can define any properties or methods they need.
   */
  [x: string]: any;
}

export type RuleConstructor = (types: Types) => RuleComponent;

export class Rule implements RuleComponent {}
