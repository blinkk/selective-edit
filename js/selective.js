/**
 * Selective structure content editor.
 */

import {
  html,
} from 'lit-html'
import {
  repeat,
} from 'lit-html/directives/repeat'
import Editor from './selective/editor'
import Field from './editor/field'
import FieldType from './editor/fieldType'

const Selective = Editor

export default Selective
export { Field,  FieldType, html, repeat }
