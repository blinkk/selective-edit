import {FieldComponent, FieldConstructor} from './field';
import {RuleComponent, RuleConstructor} from './validationRules';
import {AutoFieldsConstructor} from './autoFields';
import {ClassManager} from '../utility/classes';
import {FieldsConstructor} from './fields';

export interface GlobalTypes {
  FieldsCls: FieldsConstructor;
  AutoFieldsCls: AutoFieldsConstructor;
}

export interface Types {
  fields: ClassManager<FieldConstructor, FieldComponent>;
  globals: GlobalTypes;
  rules: ClassManager<RuleConstructor, RuleComponent>;
}
