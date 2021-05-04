import {Listeners} from './listeners';
import test from 'ava';

test('able to trigger a listener.', t => {
  t.plan(1);

  const listeners = new Listeners();
  listeners.add('test', (value: string) => {
    t.is(value, 'foo');
  });
  listeners.trigger('test', 'foo');
});
