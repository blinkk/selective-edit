import {Base} from '.';
import {DataMixin} from './data';
import {DeepObject} from '../utility/deepObject';
import test from 'ava';

test('undefined data by default', t => {
  const testClass = new TestClass();
  t.is(testClass.data, undefined);
});

test('stores the data value', t => {
  const testClass = new TestClass();
  testClass.data = new DeepObject({
    foo: 'foo',
  });
  t.is(testClass.data?.get('foo'), 'foo');
});

class TestClass extends DataMixin(Base) {}
