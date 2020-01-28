/**
 * Field defined for editing.
 */

import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import { MDCTextField } from '@material/textfield/index'
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

  get label() {
    return this.getConfig().label
  }

  static initialize(containerEl) {
    // Pass.
  }

  postRender(containerEl) {
    // Pass.
  }

  valueFromData(data) {
    // TODO: Use the last known value if the field is dirty.
    const key = this.getConfig().key
    this.value = data.get(key)
    return this.value
  }
}

export class TextField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'text'

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__text" data-field-type="${field.fieldType}">
      <div class="mdc-text-field">
        <input type="text" id="${field.getUid()}" class="mdc-text-field__input" value="${field.valueFromData(data)}">
        <label class="mdc-floating-label" for="${field.getUid()}">${field.label}</label>
        <div class="mdc-line-ripple"></div>
      </div>
    </div>`
  }

  static initialize(containerEl) {
    const fieldInstances = containerEl.querySelectorAll('.selective__field__text')
    for (const fieldInstance of fieldInstances) {
      // Check if field is already initialized.
      if (fieldInstance.dataset.mdcField) {
        continue
      }

      const mdcElement = fieldInstance.querySelector('.mdc-text-field')
      fieldInstance.dataset.mdcField = new MDCTextField(mdcElement)
    }
  }
}

const defaultFields = {
  'text': TextField,
}

export { defaultFields }
