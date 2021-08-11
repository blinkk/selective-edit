import {LengthRule, LengthRuleConfig} from './rule/length';
import {RuleComponent, RuleConstructor, Rules} from './validationRules';
import {ClassManager} from '../utility/classes';
import test from 'ava';

test('rules can add validation rules', t => {
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

  t.is(rules.getRulesForZone().length, 1);
});
