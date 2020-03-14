/**
 * Base fields.
 */

import * as extend from 'deep-extend'
import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import {
  Base,
  compose,
} from '../../utility/compose'
import ConfigMixin from '../../mixin/config'
import UidMixin from '../../mixin/uid'
import { autoConfig } from '../../utility/config'
import { autoDeepObject } from '../../utility/deepObject'


export default class FieldsRewrite extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(fieldTypes, config) {
    super()

    this._originalValue = undefined
    this._value = undefined

    this.fieldTypes = fieldTypes
    this.fields = []

    this.setConfig(config)
  }

  get config() {
    return this.getConfig()
  }

  get isClean() {
    for (const field of this.fields) {
      if (!field.isClean) {
        return false
      }
    }

    return true
  }

  get template() {
    return (selective, data) => html`<div class="selective__fields">
      ${this.updateOriginal(selective, data)}
      ${repeat(this.fields, (field) => field.uid, (field, index) => html`
        ${field.template(selective, data)}
      `)}
    </div>`
  }

  get value() {
    const value = autoDeepObject({})

    const keySet = []
    for (const field of this.fields) {
      if (!field.key) {
        // When using field without a key it returns a subset of the data.
        value.update(field.value)
      } else {
        if (field.isLocalized) {
          // Mark that the field key was set.
          keySet.push(field.key)

          // Localized fields return an object of keys and values.
          value.update(field.localizedValues)
        } else {
          // If a field is reusing a key combine the existing values
          // and the new values. New values will overwrite conflicting keys.
          if (keySet.includes(field.key)) {
            value.set(
              field.key,
              extend({}, value.get(field.key), field.value))
            continue
          }

          // Mark that the field key was set.
          keySet.push(field.key)

          value.set(field.key, field.value)
        }
      }
    }

    return extend({}, this._originalValue.obj, value.obj)
  }

  set value(value) {
    // Setting value doesn't actually do anything.
    console.warn('Set a value on the fields, that is a no-op.')
  }

  addField(fieldConfig, globalConfig) {
    fieldConfig = autoConfig(fieldConfig, globalConfig)
    const newField = this.fieldTypes.newField(
      fieldConfig.type, fieldConfig, globalConfig)

    // TODO: Handle placeholders.
    if (newField) {
      this.fields.push(newField)
    }
  }

  // TODO: look into directives.
  postRender(containerEl) {
    // Pass it along to the fields.
    for( const field of this.fields ) {
      field.postRender(containerEl)
    }
  }

  reset() {
    this.fields = []
  }

  updateOriginal(selective, data) {
    this._originalValue = data
  }
}
