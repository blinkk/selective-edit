/**
 * Selective structure content editor.
 */

import * as extend from 'deep-extend'
import {
  html,
} from 'lit-html'
import {
  repeat,
} from 'lit-html/directives/repeat'
import {
  autoConfig
} from './utility/config'
import {
  autoDeepObject
} from './utility/deepObject'
import {
  defaultFieldTypes
} from './editor/fieldType'
import expandObject from './utility/expandObject'
import AutoFields from './editor/autoFields'
import Field from './editor/field'
import {
  PlaceholderField
} from './editor/field'
import FieldType from './editor/fieldType'


export default class Selective {
  constructor(fieldsEl, config) {
    this._fieldTypes = {}
    this.fields = []
    this.autoFields = null

    // Start with built-in field types.
    // Can be overwritten by adding fields of the same type.
    // Set before the config is loaded.
    for (const type of defaultFieldTypes) {
      this.addFieldType(type)
    }

    this.fieldsEl = fieldsEl
    this.config = config
  }

  get config() {
    return this._config
  }

  set config(value) {
    this._config = autoConfig(value)
    this.clearFields()

    for (const fieldConfig of this._config.get('fields', [])) {
      this.addField(fieldConfig)
    }
  }

  get data() {
    return this._data
  }

  set data(value) {
    this.autoFields = new AutoFields(value)
    this._data = autoDeepObject(value)
    this.render()
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

    return extend({}, this.data.obj, value.obj)
  }

  addField(fieldConfig) {
    fieldConfig = autoConfig(fieldConfig)
    const fieldEl = document.createElement('div')
    this.fieldsEl.appendChild(fieldEl)

    let field = null
    const fieldType = this.getFieldType(fieldConfig.type)
    if (!fieldType) {
      // Field type has not been defined yet. Add a placeholder until the field
      // is defined for the editor.
      field = new PlaceholderField(fieldEl, fieldConfig.type, fieldConfig)
    } else {
      field = new Field(fieldEl, fieldType, fieldConfig)
    }
    this.fields.push(field)

    if (this.data) {
      field.render(this.data)
    }
  }

  addFieldType(fieldType) {
    this._fieldTypes[fieldType.type] = fieldType

    // Check each field for placeholder and replace if found a matching field.
    for (let i = 0; i < this.fields.length; i++) {
      const field = this.fields[i]

      if (field.isPlaceholder && field.fieldType == fieldType.type) {
        this.fields[i] = new Field(field.fieldEl, fieldType, field.config)

        // Tell the placeholder it is being removed.
        field.remove()

        if (this.data) {
          this.fields[i].render(this.data)
        }
      }
    }
  }

  clearFields() {
    this.fields = []

    if (!this.fieldsEl.firstChild) {
      return
    }

    while (this.fieldsEl.firstChild) {
      this.fieldsEl.removeChild(this.fieldsEl.firstChild)
    }
  }

  getFieldType(type) {
    // Missing types are not an error since they can be defined by external
    // scripts.
    if (!this._fieldTypes || !(type in this._fieldTypes)) {
      return null
    }

    return this._fieldTypes[type]
  }

  guessFields() {
    return this.autoFields.config
  }

  render() {
    for (const field of this.fields) {
      field.render(this.data)
    }
  }

  /**
   * Reset the sective editor to remove all data.
   */
  reset() {
    this.data = {}
  }

  /**
   * Apply an update to the existing data without losing the unchanged values.
   */
  update(value) {
    value = extend({}, this.data.obj, value)
    this._data = autoDeepObject(value)

    for (const field of this.fields) {
      field.update(this.data)
    }
  }
}

export { Field,  FieldType, html, repeat }
