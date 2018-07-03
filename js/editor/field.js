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
    this._hasBound = false
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

  get inputEls() {
    return this.fieldType.getInputEls(this.fieldEl)
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

  /**
   * Bind the field for any events or modification.
   */
  bindField() {
    const inputEls = this.inputEls
    if (inputEls && inputEls.length) {
      for (const inputEl of inputEls) {
        // Bind the blur and focus to keep track of when it is being edited.
        inputEl.addEventListener('blur', () => {
          this.isFocused = false
        })
        inputEl.addEventListener('focus', () => {
          this.isFocused = true
        })
      }
    }
  }

  render(data) {
    const value = data.get(this.key)
    this._cleanValue = value
    this.fieldType.render(this.fieldEl, this.config, value)

    if (!this._hasBound) {
      this.bindField()
      this._hasBound = true
    }
  }

  update(data) {
    const value = data.get(this.key)
    this._cleanValue = value
    // Don't update the template when the field is being actively edited.
    if (!this.isFocused) {
      // TODO: Notify when the value has changed but the field is being edited.
      this.fieldType.render(this.fieldEl, this.config, value)
    }
  }
}
