import {FieldComponent, FieldConstructor} from './field';
import {RuleComponent, RuleConstructor} from './validationRules';
import {ClassManager} from '../utility/classes';
import {FieldsConstructor} from './fields';

export interface GlobalTypes {
  fields: FieldsConstructor;
}

export interface Types {
  fields: ClassManager<FieldConstructor, FieldComponent>;
  globals: GlobalTypes;
  rules: ClassManager<RuleConstructor, RuleComponent>;
}
