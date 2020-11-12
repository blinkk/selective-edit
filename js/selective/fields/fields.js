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


export default class Fields extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(fieldTypes, ruleTypes, config) {
    super()

    this._originalValue = undefined
    this._value = undefined
    this._isLocked = false

    this.fieldTypes = fieldTypes
    this.fields = []

    this.ruleTypes = ruleTypes

    this.setConfig(config)
  }

  get config() {
    return this.getConfig()
  }

  // Guess default value when there is not value defined for fields.
  get defaultValue() {
    let defaultValue = ''
    // If there is multiple fields it should be an object.
    if (this.fields.length > 1) {
      defaultValue = {}
    }
    return defaultValue
  }

  get isClean() {
    for (const field of this.fields) {
      if (!field.isClean) {
        return false
      }
    }

    return true
  }

  get isValid() {
    let currentlyValid = true

    for (const field of this.fields) {
      if (!field.isValid) {
        // Does not return since we want to be able to mark all invalid fields.
        currentlyValid = false
      }
    }

    return currentlyValid
  }

  get isSimpleField() {
    return this.fields.length == 1
  }

  get template() {
    if (this.isSimpleField) {
      return (selective, data) => html`
        ${this.updateOriginal(selective, data)}
        ${this.fields[0].template(selective, data)}`
    }

    return (selective, data) => html`<div class="selective__fields">
      ${this.updateOriginal(selective, data)}
      ${repeat(this.fields, (field) => field.uid, (field, index) => html`
        ${field.template(selective, data)}
      `)}
    </div>`
  }

  get value() {
    if (this.isSimpleField && !this.fields[0].key) {
      return this.fields[0].value
    }

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

    return extend({}, this._originalValue, value.obj)
  }

  set value(value) {
    // Setting value doesn't actually do anything.
    console.warn('Set a value on the fields, that is a no-op.')
  }

  addField(fieldConfig, globalConfig) {
    fieldConfig = autoConfig(fieldConfig, globalConfig)
    const newField = this.fieldTypes.newFromKey(
      fieldConfig.type, this.ruleTypes, fieldConfig, globalConfig)

    // TODO: Handle placeholders.
    if (newField) {
      this.fields.push(newField)
    }
  }

  lock() {
    this._isLocked = true

    // Lock all the fields to prevent them from being updated.
    for (const field of this.fields) {
      field.lock()
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

  unlock() {
    this._isLocked = false

    // Unlock all the fields to allow them to be updated.
    for (const field of this.fields) {
      field.unlock()
    }
  }

  updateOriginal(selective, data, deep) {
    // Manual locking prevents the original value overwriting the value
    // in special cases when it should not.
    if (this._isLocked) {
      return
    }

    this._originalValue = (data ? data.obj ? data.obj : data : undefined)

    if (deep) {
      // Update all the fields since they may not get rendered.
      // Ex: a collapsed list would not get the update.
      for( const field of this.fields ) {
        field.updateOriginal(selective, data)
      }
    }
  }
}
