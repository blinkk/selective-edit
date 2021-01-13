import {Base, compose} from './compose';
import test from 'ava';

test('composes class with single mixin', t => {
  const TestClass = compose(fooMixin)(Base);
  const testClass = new TestClass();
  t.is(testClass.getFoo(), 'foo');
});

test('composes class with multiple mixins', t => {
  t.plan(2);
  const TestClass = compose(fooMixin, barMixin)(Base);
  const testClass = new TestClass();
  t.is(testClass.getFoo(), 'foo');
  t.is(testClass.getBar(), 'bar');
});

const barMixin = (SuperClass: any) =>
  class extends SuperClass {
    getBar() {
      return 'bar';
    }
  };

const fooMixin = (SuperClass: any) =>
  class extends SuperClass {
    getFoo() {
      return 'foo';
    }
  };
