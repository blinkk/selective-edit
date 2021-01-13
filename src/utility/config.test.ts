import {Config, autoConfig} from './config';
import test from 'ava';

test('empty config functions', t => {
  const config = new Config();
  t.is(config.get('random'), undefined);
});

test('initial config values are retrievable', t => {
  const config = new Config({foo: 'foo'});
  t.is(config.get('foo'), 'foo');
});

test('default config values are retrievable', t => {
  const config = new Config(
    {},
    {
      bar: 'bar',
    }
  );
  t.is(config.get('bar'), 'bar');
});

test('set values are retrievable', t => {
  const config = new Config();
  config.set('foo', 'foobar');
  t.is(config.get('foo'), 'foobar');
});

test('autoConfig works with config instance', t => {
  const config = new Config({foo: 'foo'});
  t.truthy(autoConfig(config) === config);
});

test('autoConfig works with config data', t => {
  t.plan(2);
  const config = autoConfig({foo: 'foobar'});
  t.is(config.get('foo'), 'foobar');
  t.truthy(config instanceof Config);
});
