import {RuleComponent, RuleConstructor, Rules} from './validationRules';
import {ClassManager} from '../utility/classes';
import {LengthRule} from './rule/length';
import test from 'ava';

test('rules can add validation rules', t => {
  const failMessage = 'failed';
  const classManager: ClassManager<
    RuleConstructor,
    RuleComponent
  > = new ClassManager();
  classManager.registerClass(
    'length',
    (LengthRule as unknown) as RuleConstructor
  );
  const rules = new Rules(classManager);
  rules.addRuleFromConfig({
    type: 'length',
    min: {
      value: 3,
      message: failMessage,
    },
  });

  t.is(rules.getRulesForZone().length, 1);
});
