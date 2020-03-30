/**
 * Base field.
 */

import * as extend from 'deep-extend'
import * as stringify from 'json-stable-stringify'
import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import {
  Base,
  compose,
} from '../../utility/compose'
import DataType from '../../utility/dataType'
import { autoDeepObject } from '../../utility/deepObject'
import ConfigMixin from '../../mixin/config'
import UidMixin from '../../mixin/uid'


export default class Field extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(config, globalConfig) {
    super()
    this.fieldType = 'Field'
    this.globalConfig = globalConfig || {}
    this.isLocalized = false
    this.ignoreLocalize = false
    this.defaultLocale = 'en'
    this.locales = ['en']

    this.setConfig(config)

    this._errors = {}
    this._isLocked = false
    this._useAutoFields = false

    this._originalValue = undefined
    this.value = undefined

    // Localization requires multiple values for one field.
    this._originalValues = {}
    this.values = {}
  }

  // TODO: Remove. Look into directives.
  static initialize(containerEl) {
    // Pass.
  }

  get config() {
    return this.getConfig()
  }

  get classesField() {
    const classes = [
      'selective__field',
      `selective__field__type__${this.fieldType}`,
    ]

    if (this._useAutoFields) {
      classes.push('selective__field--auto')
    }

    if (this.config.key && this.config.key.endsWith('@')) {
      classes.push('selective__field--translatable')
    }

    return classes.join(' ')
  }

  get isClean() {
    if (this._isLocked) {
      return false
    }

    if (this.isLocalized) {
      if (stringify(this.values) != stringify(this._originalValues)) {
        return false
      }
    }

    // Handle complex value.
    const isArray = DataType.isArray(this.originalValue) || DataType.isArray(this.value)
    const isObject = DataType.isObject(this.originalValue) || DataType.isObject(this.value)
    if (isArray || isObject) {
      return stringify(this.value) == stringify(this.originalValue)
    }

    return this.originalValue == this.value
  }

  get key() {
    return this.config.key
  }

  get localizedValues() {
    const localizedValues = {}

    for (const key of Object.keys(this.values)) {
      localizedValues[key] = this.values[key]
    }

    // Set after the localized values are updated.
    localizedValues[this.key] = this.value

    return extend({}, this._originalValues, localizedValues)
  }

  get originalValue() {
    return this._originalValue
  }

  get template() {
    return (selective, data) => html`
      ${this.updateOriginal(selective, data)}
      ${this.renderWrapper(selective, data)}`
  }

  get uid() {
    return this.getUid()
  }

  getOriginalValueForLocale(locale) {
    if (!locale || locale == this.defaultLocale) {
      return this.originalValue
    }
    return this._originalValues[this.keyForLocale(locale)]
  }

  getValueForLocale(locale) {
    if (!locale || locale == this.defaultLocale) {
      return this.value
    }
    return this.values[this.keyForLocale(locale)]
  }

  set originalValue(value) {
    this._originalValue = value
  }

  // Original values may come back in a bad format for the editor.
  _cleanOriginalValue(value) {
    return value
  }

  handleInput(evt) {
    const value = evt.target.value
    const locale = evt.target.dataset.locale
    this.setValueForLocale(locale, value)
  }

  keyForLocale(locale) {
    // Default locale does not get tagged.
    if (locale == this.defaultLocale || !locale || locale == undefined) {
      return this.key
    }
    return `${this.key}@${locale}`
  }

  lock() {
    this._isLocked = true
  }

  // TODO: Remove? Directives?
  postRender(containerEl) {}

  render() {
    // Trigger a render event.
    document.dispatchEvent(new CustomEvent('selective.render'))
  }

  renderField(selective, data) {
    return html`
      ${this.renderLabel(selective, data)}
      ${this.renderLocalization(selective, data)}
      ${this.renderError(selective, data)}
      ${this.renderHelp(selective, data)}`
  }

  renderError(selective, data) {
    const errorKeys = Object.keys(this._errors)

    if (!errorKeys.length) {
      return ''
    }

    return html`<div class="selective__field__errors">${errorKeys}</div>`
  }

  renderHelp(selective, data) {
    if (!this.config.help) {
      return ''
    }

    return html`<div class="selective__field__help">${this.config.help}</div>`
  }

  renderInput(selective, data, locale) {
    return 'Input not defined.'
  }

  renderLabel(selective, data) {
    if (!this.config.label) {
      return ''
    }

    return html`<div class="selective__field__label">
      <label for="${this.uid}">${this.config.label}</label>
    </div>`
  }

  renderLocalization(selective, data) {
    if (this.ignoreLocalize || !selective.localize) {
      return  html`
        <div class="selective__field__input">
          ${this.renderInput(selective, data)}
        </div>`
    }

    // Render the localization grid.
    return html`
      <div class="selective__field__localization">
        ${repeat(
          this.locales,
          (locale) => locale,
          (locale, index) => html`
            <div class="selective__field__locale">
              <label for="${this.uid}${locale}">${locale}</label>
            </div>
            <div class="selective__field__input">
              ${this.renderInput(selective, data, locale)}
            </div>
          `)}
      </div>`
  }

  renderWrapper(selective, data) {
    return html`
      <div
          class=${this.classesField}
          data-field-type="${this.fieldType}">
        ${this.renderField(selective, data)}
      </div>`
  }

  setValueForLocale(locale, value) {
    if (!locale || locale == undefined || locale == this.defaultLocale) {
      this.value = value
    } else {
      const localeKey = this.keyForLocale(locale)
      this.values[localeKey] = value
    }
    this.render()
  }

  unlock() {
    this._isLocked = false
  }

  // Use the data passed to render to update the original value.
  // Also update the clean value when applicable.
  updateOriginal(selective, data) {
    let newValue = data
    if (typeof data === 'object' && data !== null) {
      data = autoDeepObject(data)
      newValue = data.get(this.key)
    }

    const isClean = this.isClean
    this.isLocalized = selective.localize
    this.defaultLocale = selective.config.defaultLocale || 'en'
    this.locales = selective.config.locales || ['en']

    // Certain formats in the data may need to be cleaned up
    newValue = this._cleanOriginalValue(newValue)

    // Copy the array to prevent shared array.
    if (Array.isArray(newValue)) {
      newValue = [...newValue]
    }

    this.originalValue = newValue

    // Only if the field is clean, update the value.
    if (isClean) {
      // Copy the array to prevent shared array.
      if (Array.isArray(newValue)) {
        newValue = [...newValue]
      }

      this.value = newValue

      if (this.value == undefined) {
        this.value = this.config.default
      }
    }

    // Pull in localized values.
    if (this.isLocalized) {
      const newValues = {}

      if (typeof data === 'object' && data !== null) {
        data = autoDeepObject(data)
        for (const locale of this.locales) {
          if (locale == this.defaultLocale) {
            continue
          }
          const localeKey = this.keyForLocale(locale)
          newValues[localeKey] = this._cleanOriginalValue(data.get(localeKey))
        }
      }

      // Only if the field is clean, update the value.
      if (isClean) {
        // Copy the values to prevent shared pointer.
        this.values = extend({}, newValues)
      }
      this._originalValues = newValues
    }

    if (isClean != this.isClean) {
      // Clean state has changed. Rerender.
      this.render()
    }
  }

  valueForLocale(selective, locale) {
    // Default locale is the normal value.
    if (!locale || locale == this.defaultLocale) {
      return this.value
    }
    return this.values[this.keyForLocale(locale)]
  }
}
