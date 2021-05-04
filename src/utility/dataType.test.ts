import {DataType} from './dataType';
import test from 'ava';

test('array datatype matching', t => {
  t.true(DataType.isArray([]));

  t.false(DataType.isArray(undefined));
  t.false(DataType.isArray(null));
  t.false(DataType.isArray(''));
  t.false(DataType.isArray('foo'));
  t.false(DataType.isArray(/test/));
  t.false(DataType.isArray({}));
  t.false(DataType.isArray(1));
  t.false(DataType.isArray(true));
  t.false(DataType.isArray(false));
  t.false(DataType.isArray(TestClass));
  t.false(DataType.isArray(new TestClass()));
  t.false(DataType.isArray(new Date()));
  t.false(DataType.isArray(new Date('2020-01-01')));
  t.false(DataType.isArray(Symbol('test')));
});

test('boolean datatype matching', t => {
  t.true(DataType.isBoolean(true));
  t.true(DataType.isBoolean(false));

  t.false(DataType.isBoolean(undefined));
  t.false(DataType.isBoolean(null));
  t.false(DataType.isBoolean([]));
  t.false(DataType.isBoolean(''));
  t.false(DataType.isBoolean('foo'));
  t.false(DataType.isBoolean(/test/));
  t.false(DataType.isBoolean({}));
  t.false(DataType.isBoolean(1));
  t.false(DataType.isBoolean(TestClass));
  t.false(DataType.isBoolean(new TestClass()));
  t.false(DataType.isBoolean(new Date()));
  t.false(DataType.isBoolean(new Date('2020-01-01')));
  t.false(DataType.isBoolean(Symbol('test')));
});

test('date datatype matching', t => {
  t.true(DataType.isDate(new Date()));
  t.true(DataType.isDate(new Date('2020-01-01')));

  t.false(DataType.isDate(undefined));
  t.false(DataType.isDate(null));
  t.false(DataType.isDate([]));
  t.false(DataType.isDate(''));
  t.false(DataType.isDate('foo'));
  t.false(DataType.isDate(/test/));
  t.false(DataType.isDate({}));
  t.false(DataType.isDate(1));
  t.false(DataType.isArray(true));
  t.false(DataType.isArray(false));
  t.false(DataType.isDate(TestClass));
  t.false(DataType.isDate(new TestClass()));
  t.false(DataType.isDate(Symbol('test')));
});

test('function datatype matching', t => {
  t.true(DataType.isFunction(() => {}));
  t.true(DataType.isFunction(testFunction));
  t.true(DataType.isFunction(TestClass));

  t.false(DataType.isFunction(undefined));
  t.false(DataType.isFunction(null));
  t.false(DataType.isFunction([]));
  t.false(DataType.isFunction(''));
  t.false(DataType.isFunction('foo'));
  t.false(DataType.isFunction(/test/));
  t.false(DataType.isFunction({}));
  t.false(DataType.isFunction(1));
  t.false(DataType.isFunction(true));
  t.false(DataType.isFunction(false));
  t.false(DataType.isFunction(new TestClass()));
  t.false(DataType.isFunction(new Date()));
  t.false(DataType.isFunction(new Date('2020-01-01')));
  t.false(DataType.isFunction(Symbol('test')));
});

test('number datatype matching', t => {
  t.true(DataType.isNumber(0));
  t.true(DataType.isNumber(100));
  t.true(DataType.isNumber(-100));

  t.false(DataType.isNumber(undefined));
  t.false(DataType.isNumber(null));
  t.false(DataType.isNumber([]));
  t.false(DataType.isNumber(''));
  t.false(DataType.isNumber('foo'));
  t.false(DataType.isNumber(/test/));
  t.false(DataType.isNumber({}));
  t.false(DataType.isNumber(true));
  t.false(DataType.isNumber(false));
  t.false(DataType.isNumber(TestClass));
  t.false(DataType.isNumber(new TestClass()));
  t.false(DataType.isNumber(new Date()));
  t.false(DataType.isNumber(new Date('2020-01-01')));
  t.false(DataType.isNumber(Symbol('test')));
});

test('null datatype matching', t => {
  t.true(DataType.isNull(null));

  t.false(DataType.isNull(undefined));
  t.false(DataType.isNull([]));
  t.false(DataType.isNull(''));
  t.false(DataType.isNull('foo'));
  t.false(DataType.isNull(/test/));
  t.false(DataType.isNull({}));
  t.false(DataType.isNull(1));
  t.false(DataType.isNull(true));
  t.false(DataType.isNull(false));
  t.false(DataType.isNull(TestClass));
  t.false(DataType.isNull(new TestClass()));
  t.false(DataType.isNull(new Date()));
  t.false(DataType.isNull(new Date('2020-01-01')));
  t.false(DataType.isNull(Symbol('test')));
});

test('object datatype matching', t => {
  t.true(DataType.isObject({}));

  t.false(DataType.isObject(undefined));
  t.false(DataType.isObject(null));
  t.false(DataType.isObject([]));
  t.false(DataType.isObject(''));
  t.false(DataType.isObject('foo'));
  t.false(DataType.isObject(/test/));
  t.false(DataType.isObject(1));
  t.false(DataType.isObject(true));
  t.false(DataType.isObject(false));
  t.false(DataType.isObject(TestClass));
  t.false(DataType.isObject(new TestClass()));
  t.false(DataType.isObject(new Date()));
  t.false(DataType.isObject(new Date('2020-01-01')));
  t.false(DataType.isObject(Symbol('test')));
});

test('regexp datatype matching', t => {
  t.true(DataType.isRegExp(/test/));

  t.false(DataType.isRegExp(undefined));
  t.false(DataType.isRegExp(null));
  t.false(DataType.isRegExp([]));
  t.false(DataType.isRegExp(''));
  t.false(DataType.isRegExp('foo'));
  t.false(DataType.isRegExp({}));
  t.false(DataType.isRegExp(1));
  t.false(DataType.isRegExp(true));
  t.false(DataType.isRegExp(false));
  t.false(DataType.isRegExp(TestClass));
  t.false(DataType.isRegExp(new TestClass()));
  t.false(DataType.isRegExp(new Date()));
  t.false(DataType.isRegExp(new Date('2020-01-01')));
  t.false(DataType.isRegExp(Symbol('test')));
});

test('string datatype matching', t => {
  t.true(DataType.isString(''));
  t.true(DataType.isString('foo'));

  t.false(DataType.isString(undefined));
  t.false(DataType.isString(null));
  t.false(DataType.isString([]));
  t.false(DataType.isString(/test/));
  t.false(DataType.isString({}));
  t.false(DataType.isString(1));
  t.false(DataType.isString(true));
  t.false(DataType.isString(false));
  t.false(DataType.isString(TestClass));
  t.false(DataType.isString(new TestClass()));
  t.false(DataType.isString(new Date()));
  t.false(DataType.isString(new Date('2020-01-01')));
  t.false(DataType.isString(Symbol('test')));
});

test('symbol datatype matching', t => {
  t.true(DataType.isSymbol(Symbol('test')));

  t.false(DataType.isSymbol(undefined));
  t.false(DataType.isSymbol(null));
  t.false(DataType.isSymbol([]));
  t.false(DataType.isSymbol(''));
  t.false(DataType.isSymbol('foo'));
  t.false(DataType.isSymbol(/test/));
  t.false(DataType.isSymbol({}));
  t.false(DataType.isSymbol(1));
  t.false(DataType.isSymbol(true));
  t.false(DataType.isSymbol(false));
  t.false(DataType.isSymbol(TestClass));
  t.false(DataType.isSymbol(new TestClass()));
  t.false(DataType.isSymbol(new Date()));
  t.false(DataType.isSymbol(new Date('2020-01-01')));
});

test('undefined datatype matching', t => {
  t.true(DataType.isUndefined(undefined));

  t.false(DataType.isUndefined(null));
  t.false(DataType.isUndefined([]));
  t.false(DataType.isUndefined(''));
  t.false(DataType.isUndefined('foo'));
  t.false(DataType.isUndefined(/test/));
  t.false(DataType.isUndefined({}));
  t.false(DataType.isUndefined(1));
  t.false(DataType.isUndefined(true));
  t.false(DataType.isUndefined(false));
  t.false(DataType.isUndefined(TestClass));
  t.false(DataType.isUndefined(new TestClass()));
  t.false(DataType.isUndefined(new Date()));
  t.false(DataType.isUndefined(new Date('2020-01-01')));
  t.false(DataType.isUndefined(Symbol('test')));
});

// Test battery for new data type checking.
// t.false(DataType.isSomething(undefined));
// t.false(DataType.isSomething(null));
// t.false(DataType.isSomething([]));
// t.false(DataType.isSomething(''));
// t.false(DataType.isSomething('foo'));
// t.false(DataType.isSomething(/test/));
// t.false(DataType.isSomething({}));
// t.false(DataType.isSomething(1));
// t.false(DataType.isSomething(true));
// t.false(DataType.isSomething(false));
// t.false(DataType.isSomething(TestClass));
// t.false(DataType.isSomething(new TestClass()));
// t.false(DataType.isSomething(new Date()));
// t.false(DataType.isSomething(new Date('2020-01-01')));
// t.false(DataType.isSomething(Symbol('test')));

class TestClass {}

function testFunction() {}
