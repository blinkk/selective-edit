import {Base} from '.';
import {Config} from '../utility/config';
import {ConfigMixin} from './config';
import test from 'ava';

test('undefined config by default', t => {
  const testClass = new TestClass();
  t.is(testClass.config, undefined);
});

test('stores the config value', t => {
  const testClass = new TestClass();
  testClass.config = new Config({
    foo: 'foo',
  });
  t.is(testClass.config?.get('foo'), 'foo');
});

class TestClass extends ConfigMixin(Base) {}
