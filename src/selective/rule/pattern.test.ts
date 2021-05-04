import {PatternRule} from './pattern';
import test from 'ava';

test('pattern rule respects pattern', t => {
  const failMessage = 'failed';
  const rule = new PatternRule({
    type: 'pattern',
    pattern: '^s.*y$',
    message: failMessage,
  });

  // Fails with invalid value.
  t.is(rule.validate('testing'), failMessage);
  t.is(rule.validate('foobar!@#@'), failMessage);

  // Success when there is a correct value.
  t.is(rule.validate('slurry'), null);
  t.is(rule.validate('starry'), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});
