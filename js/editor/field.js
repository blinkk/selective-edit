/**
 * Fields for the editor.
 */

import {
  autoConfig
} from '../utility/config'

export default class Field {
  constructor(fieldEl, fieldType, config) {
    this.fieldEl = fieldEl
    this.fieldType = fieldType
    this.config = config
    this.isFocused = false
    this._cleanValue = null
  }

  get config() {
    return this._config
  }

  set config(value) {
    this._config = autoConfig(value)
  }

  get id() {
    return this.config.get('id')
  }

  get isClean() {
    return this._cleanValue == this.value
  }

  get key() {
    return this.config.get('key')
  }

  get value() {
    return this.fieldType.getValue(this.fieldEl)
  }

  render(data) {
    const value = data.get(this.key)
    this._cleanValue = value
    this.fieldType.render(this.fieldEl, this.config, value)
  }
}
