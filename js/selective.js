/**
 * Selective structure content editor.
 */

import Config from './utility/config'
import DeepObject from './utility/deepObject'
import {defaultFieldTypes} from './editor/fieldType'
import expandObject from './utility/expandObject'
import Field from './editor/field'


export default class Selective {
  constructor(fieldsEl, config) {
    this._fieldTypes = {}
    this.fields = []

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
    if (!(value instanceof Config)) {
      value = new Config(value || {})
    }
    this._config = value

    this.clearFields()

    for (const fieldConfig of this._config.get('fields', [])) {
      this.addField(fieldConfig)
    }
  }

  get data() {
    return this._data
  }

  set data(value) {
    if (!(value instanceof DeepObject)) {
      value = new DeepObject(value || {})
    }
    this._data = value
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

  addField(fieldConfig) {
    if (!(fieldConfig instanceof Config)) {
      fieldConfig = new Config(fieldConfig || {})
    }

    const fieldEl = document.createElement('div')
    this.fieldsEl.appendChild(fieldEl)
    const fieldType = this.getFieldType(fieldConfig.type)
    const field = new Field(fieldEl, fieldType, fieldConfig)
    this.fields.push(field)

    if (this.data) {
      field.render(this.data)
    }
  }

  addFieldType(fieldType) {
    this._fieldTypes[fieldType.type] = fieldType
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
    if (!this._fieldTypes || !type in this._fieldTypes) {
      throw(`Unknown field type: ${type}`)
    }

    return this._fieldTypes[type]
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
}
