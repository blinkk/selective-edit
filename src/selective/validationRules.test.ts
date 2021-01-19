import {
  LengthRule,
  MatchRule,
  PatternRule,
  RangeRule,
  RequireRule,
  RuleComponent,
  RuleConstructor,
  Rules,
} from './validationRules';
import {ClassManager} from '../utility/classes';
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
