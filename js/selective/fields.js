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
import { autoDeepObject } from '../utility/deepObject'

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

  get isClean() {
    for (const field of this.fields) {
      if (!field.isClean) {
        return false
      }
    }

    return true
  }

  get value() {
    const value = autoDeepObject({})

    for (const field of this.fields) {
      value.set(field.key, field.value)
    }

    return value.obj
  }

  addField(fieldConfig) {
    const newField = this.fieldTypes.newField(fieldConfig.type, fieldConfig)
    if (newField) {
      this.fields.push(newField)
    }
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
