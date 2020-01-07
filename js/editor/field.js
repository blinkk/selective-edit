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

  get isPlaceholder() {
    return false
  }

  get key() {
    return this.config.get('key')
  }

  get value() {
    return this.fieldType.getValue(this, this.fieldEl)
  }

  render(data) {
    const value = data.get(this.key)
    this._cleanValue = value
    this.fieldType.render(this, this.fieldEl, this.config, value)

    if (!this._hasBound) {
      this.fieldType.bindField(this, this.fieldEl)
      this._hasBound = true
    }

    // Trigger post render behavior after it has rendered and bound events.
    this.fieldType.postRender(this, this.fieldEl, this.config, value)
  }

  update(data) {
    const value = data.get(this.key)
    this._cleanValue = value
    // Don't update the template when the field is being actively edited.
    // TODO: Notify when the value has changed but the field is being edited.
    if (!this.isFocused) {
      this.fieldType.setValue(this, this.fieldEl, this.config, value)
    }
  }
}


/**
 * Placeholder Field to save the spot for a field type that has not been
 * registered with the editor.
 */
export class PlaceholderField extends Field {
  render(data) {
    console.log(`Skipping rendering for placeholder field: ${this.fieldType}`)
  }

  get isPlaceholder() {
    return true
  }
}
