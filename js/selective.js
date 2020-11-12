/**
 * Selective structure content editor.
 */

import { directive, html, render } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import { unsafeHTML } from 'lit-html/directives/unsafe-html'
import Editor from './selective/editor'
import Field from './selective/field/field'
import UI from './selective/ui/ui'
import { ListField, ListItem } from './selective/field/list'
import { GroupField, VariantField } from './selective/field/structure'
import Fields from './selective/fields/fields'
import ValidationRules from './selective/validation/rules'
import {
  ValidationRule,
  LengthValidationRule,
  MatchValidationRule,
  PatternValidationRule,
  RangeValidationRule,
  RequiredValidationRule,
} from './selective/validation/rules'
import AutoFields from './selective/autoFields'
import { autoConfig } from './utility/config'
import { autoDeepObject } from './utility/deepObject'

const Selective = Editor

export default Selective
export {
  AutoFields,
  Field,
  Fields,
  GroupField,
  LengthValidationRule,
  ListField,
  ListItem,
  MatchValidationRule,
  PatternValidationRule,
  RangeValidationRule,
  RequiredValidationRule,
  UI,
  VariantField,
  ValidationRule,
  ValidationRules,
  autoConfig,
  autoDeepObject,
  directive,
  html,
  repeat,
  render,
  unsafeHTML,
}
