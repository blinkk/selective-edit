import {LengthRule, LengthRuleConfig} from './rule/length';
import {RuleComponent, RuleConstructor, Rules} from './validationRules';
import {ClassManager} from '../utility/classes';
import {Validation} from './validation';
import test from 'ava';

test('validation errors are stored when there are errors', t => {
  const failMessage = 'failed';
  const classManager: ClassManager<RuleConstructor, RuleComponent> =
    new ClassManager();
  classManager.registerClass(
    'length',
    LengthRule as unknown as RuleConstructor
  );
  const rules = new Rules(classManager);
  rules.addRuleFromConfig({
    type: 'length',
    min: {
      value: 3,
      message: failMessage,
    },
  } as LengthRuleConfig);

  const validation = new Validation(rules);

  // Should fail validation.
  validation.validate('ab');

  t.is(true, validation.hasAnyResults(null));
});
