import {ClassManager} from '../utility/classes';
import {FieldConstructor} from './field';
import {FieldsConstructor} from './fields';
import {RuleConstructor} from './rule';

export interface Types {
  field: ClassManager<FieldConstructor>;
  fields: FieldsConstructor;
  rules: ClassManager<RuleConstructor>;
}
