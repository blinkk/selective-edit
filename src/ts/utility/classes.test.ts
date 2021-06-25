import {ClassManager} from './classes';
import test from 'ava';

test('default class is returned used when not known', t => {
  const classManager = new ClassManager(TestClassDefault);

  t.truthy(classManager.newFromKey('random') instanceof TestClassDefault);
});

test('null is returned used when no default class', t => {
  const classManager = new ClassManager();

  t.is(classManager.newFromKey('random'), null);
});

test('instance is returned used when matching key', t => {
  t.plan(2);
  const classManager = new ClassManager();
  classManager.registerClass('foo', TestClassA);
  t.truthy(classManager.newFromKey('foo') instanceof TestClassA);
  t.is(classManager.newFromKey('random'), null);
});

class TestClassA {}
class TestClassDefault {}
