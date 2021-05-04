import {LengthRule} from './length';
import test from 'ava';

test('length rule respects min length on strings', t => {
  const failMessage = 'failed';
  const rule = new LengthRule({
    type: 'length',
    min: {
      value: 3,
      message: failMessage,
    },
  });

  // Fails with length less than min value.
  t.is(rule.validate('a'), failMessage);

  // Success when there is a value at least the correct length.
  t.is(rule.validate('abc'), null);
  t.is(rule.validate('abcefg'), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});

test('length rule respects max length on strings', t => {
  const failMessage = 'failed';
  const rule = new LengthRule({
    type: 'length',
    max: {
      value: 3,
      message: failMessage,
    },
  });

  // Fails with length greater than max value.
  t.is(rule.validate('abcd'), failMessage);

  // Success when there is a value at most the correct length.
  t.is(rule.validate('abc'), null);
  t.is(rule.validate('a'), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});

test('length rule respects min length on arrays', t => {
  const failMessage = 'failed';
  const rule = new LengthRule({
    type: 'length',
    min: {
      value: 3,
      message: failMessage,
    },
  });

  // Fails with length less than min value.
  t.is(rule.validate(['a', 'b']), failMessage);
  t.is(rule.validate(['a']), failMessage);

  // Success when there is a value at least the correct length.
  t.is(rule.validate(['a', 'b', 'c']), null);
  t.is(rule.validate(['a', 'b', 'c', 'd', 'e', 'f']), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate([]), null);
});

test('length rule respects max length on arrays', t => {
  const failMessage = 'failed';
  const rule = new LengthRule({
    type: 'length',
    max: {
      value: 3,
      message: failMessage,
    },
  });

  // Fails with length greater than max value.
  t.is(rule.validate(['a', 'b', 'c', 'd']), failMessage);
  t.is(rule.validate(['a', 'b', 'c', 'd', 'e', 'f']), failMessage);

  // Success when there is a value at most the correct length.
  t.is(rule.validate(['a', 'b']), null);
  t.is(rule.validate(['a']), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate([]), null);
});
