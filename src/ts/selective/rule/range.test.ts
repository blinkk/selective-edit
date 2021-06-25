import {RangeRule} from './range';
import test from 'ava';

test('range rule respects min value', t => {
  const failMessage = 'failed';
  const rule = new RangeRule({
    type: 'range',
    min: {
      value: 3,
      message: failMessage,
    },
  });

  // Fails with invalid value.
  t.is(rule.validate('2'), failMessage);
  t.is(rule.validate(1), failMessage);
  t.is(rule.validate('-100'), failMessage);

  // Success when there is a correct value.
  t.is(rule.validate('3'), null);
  t.is(rule.validate(125), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});

test('range rule respects max value', t => {
  const failMessage = 'failed';
  const rule = new RangeRule({
    type: 'range',
    max: {
      value: 3,
      message: failMessage,
    },
  });

  // Fails with invalid value.
  t.is(rule.validate('4'), failMessage);
  t.is(rule.validate(125), failMessage);

  // Success when there is a correct value.
  t.is(rule.validate('3'), null);
  t.is(rule.validate(1), null);
  t.is(rule.validate('-100'), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});
