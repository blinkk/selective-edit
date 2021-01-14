import {ClassManager} from '../utility/classes';
import {FieldConstructor} from './field';
import {FieldsConstructor} from './fields';
import {RuleConstructor} from './rule';

export interface GlobalTypes {
  fields: FieldsConstructor;
}

export interface Types {
  fields: ClassManager<FieldConstructor>;
  globals: GlobalTypes;
  rules: ClassManager<RuleConstructor>;
}
