/**
 * Fields defined for editing.
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

export default class Fields extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(fieldTypes, config) {
    super()
    this.fieldTypes = fieldTypes
    this.fields = []
    this.setConfig(config)

    this.template = (editor, data) => html`<div class="selective__fields">
      ${repeat(editor.fields.fields, (field) => field.id, (field, index) => html`
        ${field.template(editor, field, data)}
      `)}
    </div>`
  }

  get value() {
    // TODO: Cycle through each field to get the value from the form.
  }

  addField(fieldConfig) {
    // TODO: Create the field based on the config.
    // this.fields.push(field)
    this.fields.push(new this.fieldTypes.fieldTypes['text'](fieldConfig))
  }

  postRender(containerEl) {
    // Pass it along to the fields.
    for( const field of this.fields ) {
      field.postRender(containerEl)
    }
  }

  reset() {
    this.fields = []
  }
}
