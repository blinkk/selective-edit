import {Defer} from './defer';
import test from 'ava';

test('able to resolve a deferred promise', async t => {
  const deferred = new Defer();
  deferred.resolve('bar');
  t.is(await deferred.promise, 'bar');
});
