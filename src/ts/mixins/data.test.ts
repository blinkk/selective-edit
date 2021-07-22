import {Base} from '.';
import {DataMixin} from './data';
import test from 'ava';

test('undefined data by default', t => {
  const testClass = new TestClass();
  t.is(testClass.data, undefined);
});

test('stores the data value', t => {
  const testClass = new TestClass();
  testClass.data = {
    foo: 'foo',
  };
  t.is(testClass.data?.get('foo'), 'foo');
});

test('stores the data value undefined', t => {
  const testClass = new TestClass();
  testClass.data = undefined;
  t.is(testClass.data, undefined);
});

class TestClass extends DataMixin(Base) {}
