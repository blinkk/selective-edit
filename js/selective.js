/**
 * Selective structure content editor.
 */

import { directive, html, render } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import Editor from './selective/editor'
import Field from './selective/field/field'
import UI from './selective/ui/ui'
import { ListField, ListItem } from './selective/field/list'
import { GroupField } from './selective/field/structure'
import Fields from './selective/fields/fields'
import AutoFields from './selective/autoFields'
import { autoConfig } from './utility/config'
import { autoDeepObject } from './utility/deepObject'

const Selective = Editor

export default Selective
export {
  Field,
  GroupField,
  ListField,
  ListItem,
  Fields,
  AutoFields,
  UI,
  directive,
  html,
  repeat,
  render,
  autoConfig,
  autoDeepObject
}
