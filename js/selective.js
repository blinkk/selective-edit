/**
 * Selective structure content editor.
 */

import { directive, html, render } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import Editor from './selective/editor'
import Field from './selective/field'
import FieldRewrite from './selective/field/field'
import { GroupField } from './selective/field/structure'
import FieldsRewrite from './selective/fields/fields'
import { SortableField, ListField } from './selective/field'
import Fields from './selective/fields'
import AutoFields from './selective/autoFields'
import { autoConfig } from './utility/config'
import { autoDeepObject } from './utility/deepObject'

const Selective = Editor

export default Selective
export {
  Field,
  FieldRewrite,
  GroupField,
  SortableField,
  ListField,
  Fields,
  FieldsRewrite,
  AutoFields,
  directive,
  html,
  repeat,
  render,
  autoConfig,
  autoDeepObject
}
