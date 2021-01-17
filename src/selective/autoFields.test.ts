import {AutoFields} from './autoFields';
import {Config} from '../utility/config';
import test from 'ava';

test('auto fields guess null', t => {
  const autoFields = new AutoFields(new Config());

  const expected = new Config({
    key: 'test',
    label: 'Test',
    type: 'text',
  });

  t.deepEqual(autoFields.guessField('test', null), expected);
});

test('auto fields guess undefined', t => {
  const autoFields = new AutoFields(new Config());

  const expected = new Config({
    key: 'test',
    label: 'Test',
    type: 'text',
  });

  t.deepEqual(autoFields.guessField('test', undefined), expected);
});

test('auto fields guess string', t => {
  const autoFields = new AutoFields(new Config());

  const expected = new Config({
    key: 'test',
    label: 'Test',
    type: 'text',
  });

  t.deepEqual(autoFields.guessField('test', 'foobar'), expected);
});

test('auto fields guess list', t => {
  const autoFields = new AutoFields(new Config());

  const expected = new Config({
    key: 'test',
    label: 'Test',
    type: 'list',
    fields: [
      new Config({
        type: 'text',
      }),
    ],
  });

  t.deepEqual(autoFields.guessField('test', ['foobar']), expected);
});

test('auto fields guess textarea', t => {
  const autoFields = new AutoFields(new Config());

  const expected = new Config({
    key: 'test',
    label: 'Test',
    type: 'textarea',
  });

  t.deepEqual(
    autoFields.guessField('test', `${'fobar'.repeat(15)}a`),
    expected
  );
});

test('auto fields guess full object', t => {
  const autoFields = new AutoFields(new Config());
  const data: Record<string, any> = {
    test: 'testing',
    foo: `${'fobar'.repeat(15)}a`,
    bar: ['test'],
  };
  // Sort the expected since there is no guarantee of the key order.
  const expected = [
    new Config({
      key: 'bar',
      label: 'Bar',
      type: 'list',
      fields: [
        new Config({
          type: 'text',
        }),
      ],
    }),
    new Config({
      key: 'foo',
      label: 'Foo',
      type: 'textarea',
    }),
    new Config({
      key: 'test',
      label: 'Test',
      type: 'text',
    }),
  ];
  // Sort the results since there is no guarantee of the key order.
  const actual = autoFields
    .guessFields(data)
    .sort((a: Config, b: Config) => (a.get('key') < b.get('key') ? -1 : 1));
  t.deepEqual(actual, expected);
});

test('auto fields guess multi-part label', t => {
  const autoFields = new AutoFields(new Config());

  const expected = new Config({
    key: 'foo.bar',
    label: 'Foo Bar',
    type: 'text',
  });

  t.deepEqual(autoFields.guessField('foo.bar', 'foobar'), expected);
});
