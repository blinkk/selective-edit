import {AutoFields} from './autoFields';
import {FieldConfig} from './field';
import {ListFieldConfig} from './field/list';
import test from 'ava';

test('auto fields guess null', t => {
  const autoFields = new AutoFields({});

  const expected = {
    key: 'test',
    label: 'Test',
    type: 'text',
  } as FieldConfig;

  t.deepEqual(autoFields.guessField('test', null), expected);
});

test('auto fields guess undefined', t => {
  const autoFields = new AutoFields();

  const expected = {
    key: 'test',
    label: 'Test',
    type: 'text',
  } as FieldConfig;

  t.deepEqual(autoFields.guessField('test', undefined), expected);
});

test('auto fields guess string', t => {
  const autoFields = new AutoFields();

  const expected = {
    key: 'test',
    label: 'Test',
    type: 'text',
  } as FieldConfig;

  t.deepEqual(autoFields.guessField('test', 'foobar'), expected);
});

test('auto fields guess list', t => {
  const autoFields = new AutoFields();

  const expected = {
    key: 'test',
    label: 'Test',
    type: 'list',
    fields: [
      {
        key: '',
        type: 'text',
      } as FieldConfig,
    ],
  } as ListFieldConfig;

  t.deepEqual(autoFields.guessField('test', ['foobar']), expected);
});

test('auto fields guess textarea', t => {
  const autoFields = new AutoFields();

  const expected = {
    key: 'test',
    label: 'Test',
    type: 'textarea',
  } as FieldConfig;

  t.deepEqual(
    autoFields.guessField('test', `${'fobar'.repeat(15)}a`),
    expected
  );
});

test('auto fields guess full object', t => {
  const autoFields = new AutoFields();
  const data: Record<string, any> = {
    test: 'testing',
    foo: `${'fobar'.repeat(15)}a`,
    bar: ['test'],
  };
  // Sort the expected since there is no guarantee of the key order.
  const expected = [
    {
      key: 'bar',
      label: 'Bar',
      type: 'list',
      fields: [
        {
          key: '',
          type: 'text',
        },
      ],
    } as ListFieldConfig,
    {
      key: 'foo',
      label: 'Foo',
      type: 'textarea',
    } as FieldConfig,
    {
      key: 'test',
      label: 'Test',
      type: 'text',
    } as FieldConfig,
  ];
  // Sort the results since there is no guarantee of the key order.
  const actual = autoFields
    .guessFields(data)
    .sort((a: FieldConfig, b: FieldConfig) => (a.key < b.key ? -1 : 1));
  t.deepEqual(actual, expected);
});

test('auto fields guess multi-part label', t => {
  const autoFields = new AutoFields();

  const expected = {
    key: 'foo.bar',
    label: 'Foo Bar',
    type: 'text',
  } as FieldConfig;

  t.deepEqual(autoFields.guessField('foo.bar', 'foobar'), expected);
});
