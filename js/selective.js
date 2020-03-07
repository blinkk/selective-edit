/**
 * Selective structure content editor.
 */

import { html, render } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import Editor from './selective/editor'
import Field from './selective/field'
import { SortableField, ListField } from './selective/field'
import Fields from './selective/fields'
import AutoFields from './selective/autoFields'
import { autoDeepObject } from './utility/deepObject'

const Selective = Editor

export default Selective
export {
  Field,
  SortableField,
  ListField,
  Fields,
  AutoFields,
  html,
  repeat,
  render,
  autoDeepObject
}
