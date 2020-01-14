/**
 * Field defined for editing.
 */

import {
 html,
} from 'lit-html'
import {
 repeat,
} from 'lit-html/directives/repeat'
import ConfigMixin from '../mixin/config'
import UidMixin from '../mixin/uid'
import { Base, compose } from '../utility/compose'

export default class Field extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(config) {
    super()
    this.fieldType = 'Field'
    this.setConfig(config)

    this.template = (editor, field, data) => html`<div class="selective__field" data-field-type="${field.fieldType}">
      Missing template.
    </div>`
  }

  valueFromData(data) {
    // TODO: Get the value from the data using the correct accessor key.
    this.value = 'testing'
    return this.value
  }
}

export class TextField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'text'

    this.template = (editor, field, data) => html`<div class="selective__field__text" data-field-type="${field.fieldType}">
      <input id="${field.getUid()}" type="text" value="${field.valueFromData(data)}">
    </div>`
  }
}

const defaultFields = {
  'text': TextField,
}

export { defaultFields }
