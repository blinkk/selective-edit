import {RequireRule} from './require';
import test from 'ava';

test('required rule respects value', t => {
  const failMessage = 'failed';
  const rule = new RequireRule({
    type: 'require',
    message: failMessage,
  });

  // Fails when there is no value or empty.
  t.is(rule.validate(undefined), failMessage);
  t.is(rule.validate(null), failMessage);
  t.is(rule.validate(''), failMessage);
  t.is(rule.validate([]), failMessage);

  // Success when there is a value.
  t.is(rule.validate('3'), null);
  t.is(rule.validate(1), null);
  t.is(rule.validate('-100'), null);
  t.is(rule.validate(['foo']), null);
});
