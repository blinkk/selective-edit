import {MatchRule} from './match';
import test from 'ava';

test('match rule respects allowed pattern', t => {
  const failMessage = 'failed';
  const rule = new MatchRule({
    type: 'match',
    allowed: {
      pattern: '^s.*y$',
      message: failMessage,
    },
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

test('match rule respects allowed values', t => {
  const failMessage = 'failed';
  const rule = new MatchRule({
    type: 'match',
    allowed: {
      values: ['apple', 'banana', 'grape'],
      message: failMessage,
    },
  });

  // Fails with invalid value.
  t.is(rule.validate('testing'), failMessage);
  t.is(rule.validate('foobar'), failMessage);

  // Success when there is a correct value.
  t.is(rule.validate('apple'), null);
  t.is(rule.validate('banana'), null);
  t.is(rule.validate('grape'), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});

test('match rule respects allowed regexp values', t => {
  const failMessage = 'failed';
  const rule = new MatchRule({
    type: 'match',
    allowed: {
      values: [/ap.*/, /bana.*/, /.*pe/],
      message: failMessage,
    },
  });

  // Fails with invalid value.
  t.is(rule.validate('testing'), failMessage);
  t.is(rule.validate('foobar'), failMessage);

  // Success when there is a correct value.
  t.is(rule.validate('apple'), null);
  t.is(rule.validate('banana'), null);
  t.is(rule.validate('grape'), null);
  t.is(rule.validate('tape'), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});

test('match rule respects excluded pattern', t => {
  const failMessage = 'failed';
  const rule = new MatchRule({
    type: 'match',
    excluded: {
      pattern: '^s.*y$',
      message: failMessage,
    },
  });

  // Fails with invalid value.
  t.is(rule.validate('slurry'), failMessage);
  t.is(rule.validate('starry'), failMessage);

  // Success when there is a correct value.
  t.is(rule.validate('testing'), null);
  t.is(rule.validate('foobar!@#@'), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});

test('match rule respects excluded values', t => {
  const failMessage = 'failed';
  const rule = new MatchRule({
    type: 'match',
    excluded: {
      values: ['apple', 'banana', 'grape'],
      message: failMessage,
    },
  });

  // Fails with invalid value.
  t.is(rule.validate('apple'), failMessage);
  t.is(rule.validate('banana'), failMessage);
  t.is(rule.validate('grape'), failMessage);

  // Success when there is a correct value.
  t.is(rule.validate('testing'), null);
  t.is(rule.validate('foobar'), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});

test('match rule respects excluded regex values', t => {
  const failMessage = 'failed';
  const rule = new MatchRule({
    type: 'match',
    excluded: {
      values: [/ap.*/, /bana.*/, /.*pe/],
      message: failMessage,
    },
  });

  // Fails with invalid value.
  t.is(rule.validate('apple'), failMessage);
  t.is(rule.validate('banana'), failMessage);
  t.is(rule.validate('grape'), failMessage);

  // Success when there is a correct value.
  t.is(rule.validate('testing'), null);
  t.is(rule.validate('foobar'), null);

  // Success when there is no value or empty.
  t.is(rule.validate(undefined), null);
  t.is(rule.validate(null), null);
  t.is(rule.validate(''), null);
});
