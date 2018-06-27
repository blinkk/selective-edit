/**
 * Fields for the editor.
 */

import Config from '../utility/config'

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
    if (!(value instanceof Config)) {
      value = new Config(value || {})
    }
    this._config = value
  }

  get id() {
    return this.config.get('id')
  }

  get isClean() {
    return this._cleanValue == this.value
  }

  render(data) {
    const value = data.get(this.config.get('key'))
    this.fieldType.render(this.fieldEl, this.config, value)
  }
}
