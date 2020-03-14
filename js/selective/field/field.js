/**
 * Base field.
 */

import * as extend from 'deep-extend'
import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import {
  Base,
  compose,
} from '../../utility/compose'
import { autoDeepObject } from '../../utility/deepObject'
import ConfigMixin from '../../mixin/config'
import UidMixin from '../../mixin/uid'


export default class FieldRewrite extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(config, globalConfig) {
    super()
    this.fieldType = 'Field'
    this.globalConfig = globalConfig || {}
    this.isLocalized = false
    this.defaultLocale = 'en'

    this.setConfig(config)

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
      `selective__field__${this.fieldType}`,
    ]

    return classes.join(' ')
  }

  get isClean() {
    if (this.isLocalized) {
      if (JSON.stringify(this.values) != JSON.stringify(this._originalValues)) {
        return false
      }
    }

    // Handle complex value.
    if (Array.isArray(this.originalValue) || Array.isArray(this.value)) {
      return JSON.stringify(this.value) == JSON.stringify(this.originalValue)
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
      <div
          class=${this.classesField}
          data-field-type="${this.fieldType}">
        ${this.renderField(selective, data)}
      </div>`
  }

  get uid() {
    return this.getUid()
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

  // TODO: Remove? Directives?
  postRender(containerEl) {}

  renderField(selective, data) {
    return html`
      ${this.renderLabel(selective, data)}
      ${this.renderLocalization(selective, data)}
      ${this.renderHelp(selective, data)}`
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
    if (!selective.localize) {
      // TODO: render just a single input.
      return this.renderInput(selective, data)
    }

    // Render the localization grid.
    return html`
      <div class="selective__field__localization">
        ${repeat(
          selective.config.locales || ['en', 'es'],
          (locale) => locale,
          (locale, index) => html`
            <div class="selective__field__localization__locale">
              <label for="${this.uid}${locale}">${locale}</label>
            </div>
            <div class="selective__field__localization__input">
              ${this.renderInput(selective, data, locale)}
            </div>
          `)}
      </div>`
  }

  setValueForLocale(locale, value) {
    if (!locale || locale == undefined || locale == this.defaultLocale) {
      this.value = value
    } else {
      const localeKey = this.keyForLocale(locale)
      this.values[localeKey] = value
    }
    document.dispatchEvent(new CustomEvent('selective.render'))
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

    // Certain formats in the data may need to be cleaned up
    newValue = this._cleanOriginalValue(newValue)

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

    // Copy the array to prevent shared array.
    if (Array.isArray(newValue)) {
      newValue = [...newValue]
    }

    this.originalValue = newValue

    // Pull in localized values.
    if (this.isLocalized) {
      const newValues = {}

      if (typeof data === 'object' && data !== null) {
        data = autoDeepObject(data)
        for (const locale of selective.config.locales || ['en', 'es']) {
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
      document.dispatchEvent(new CustomEvent('selective.render'))
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
