import {DeepObject} from './deepObject';
import test from 'ava';

test('ability to get top keys', t => {
  const obj = new DeepObject({
    foo: 'foo',
  });

  t.is(obj.get('foo'), 'foo');
});

test('ability to get second layer keys', t => {
  const obj = new DeepObject({
    foo: {
      bar: 'bar',
    },
  });

  t.is(obj.get('foo.bar'), 'bar');
});

test('ability to get deep level keys', t => {
  const obj = new DeepObject({
    foo: {
      bar: {
        baz: 'baz',
      },
    },
  });

  t.is(obj.get('foo.bar.baz'), 'baz');
});

test('ability to get missing key', t => {
  const obj = new DeepObject();

  t.is(obj.get('foo'), undefined);
});

test('keys', t => {
  const obj = new DeepObject({
    foo: {
      foofoo: {
        foobar: true,
        baz: true,
      },
      boo: true,
    },
    bar: 'test',
    eel: [
      {
        ipo: true,
      },
    ],
  });

  t.deepEqual(obj.keys().sort(), [
    'bar',
    'eel',
    'foo.boo',
    'foo.foofoo.baz',
    'foo.foofoo.foobar',
  ]);
});

test('set new values on top keys', t => {
  const obj = new DeepObject();
  obj.set('foo', 'foo');

  t.is(obj.get('foo'), 'foo');
});

test('set new values on second level keys', t => {
  const obj = new DeepObject();
  obj.set('foo.bar', 'bar');

  t.is(obj.get('foo.bar'), 'bar');
});

test('set new values on deep level keys', t => {
  const obj = new DeepObject();
  obj.set('foo.bar.baz', 'baz');

  t.is(obj.get('foo.bar.baz'), 'baz');
});
