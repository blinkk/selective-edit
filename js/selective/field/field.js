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
import Listeners from '../../utility/listeners'
import { autoDeepObject } from '../../utility/deepObject'
import ConfigMixin from '../../mixin/config'
import UidMixin from '../../mixin/uid'
import ValidationErrors from '../validation/errors'
import ValidationRules from '../validation/rules'


export default class Field extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(ruleTypes, config, globalConfig) {
    super()
    this.fieldType = 'Field'
    this.ruleTypes = ruleTypes
    this.globalConfig = globalConfig || {}
    this.isLocalized = false
    this.ignoreLocalize = false
    this.defaultLocale = 'en'
    this.locales = ['en']
    this.listeners = new Listeners()

    this.setConfig(config)

    this._isLocked = false
    this._useAutoFields = false

    this._originalValue = undefined
    this.value = undefined

    // Localization requires multiple values for one field.
    this._originalValues = {}
    this.errors = {}
    this.values = {}
    this.zonesToValue = null

    // Store the validation rules.
    this._validationRules = new ValidationRules({
      ruleTypes: this.ruleTypes,
    })
    this._validationRules.addRules(this.config.get('validation', []))
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

    if (this.config.classes) {
      for (const className of this.config.classes) {
        classes.push(className)
      }
    }

    if (this._useAutoFields) {
      classes.push('selective__field--auto')
    }

    if (this.config.key && this.config.key.endsWith('@')) {
      classes.push('selective__field--translatable')
    }

    if (this.config.isGuessed) {
      classes.push('selective__field--guess')
    }

    if (!this.isClean) {
      classes.push('selective__field--dirty')
    }

    if (!this.isValid) {
      classes.push('selective__field--invalid')
    }

    if (this.isLinkedField) {
      classes.push('selective__field--linked')
    }

    return classes.join(' ')
  }

  get fullKey() {
    const parentKey = this.config.get('parentKey')
    if (parentKey) {
      return `${parentKey}.${this.key}`
    }
    return this.key
  }

  get isClean() {
    // When locked, the field is automatically considered dirty.
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

  get isLinkedField() {
    // Is the field a linked field in the config.
    const fullKey = this.fullKey
    const linkedFields = this.config.get('linkedFieldsFunc', () => [])()
    for (const linkedField of linkedFields) {
      if (linkedField == fullKey) {
        return true
      }
    }
    return false
  }

  get isValid() {
    // TODO: Only want to revalidate once per render.
    let hasErrors = false
    let locales = []

    if (this.ignoreLocalize || this.locales.length < 1) {
      locales.push(null)
    } else {
      locales = locales.concat(this.locales)
    }

    // Validate each locale separately.
    for (const locale of locales) {
      const errors = new ValidationErrors()
      const isDefaultLocale = !locale || locale == this.defaultLocale
      const value = this.getValueForLocale(locale)

      if (!this.zonesToValue) {
        // Simple field, only one value/input to validate.
        errors.validateRules(
          this._validationRules, value, locale, isDefaultLocale)
      } else {
        // Complex field type. There are multiple inputs, so we need to map the
        // validation zone to the key of the value.
        for (const zoneKey of Object.keys(this.zonesToValue)) {
          const valueKey = this.zonesToValue[zoneKey]
          const valueSub = value ? value[valueKey] : undefined
          errors.validateRules(
            this._validationRules, valueSub, locale, isDefaultLocale,
            zoneKey)
        }
      }

      this.setErrorsForLocale(locale, errors)

      if (errors.hasAnyErrors()) {
        hasErrors = true
      }
    }

    return !hasErrors
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

  getClassesForInput(locale, zoneKey) {
    const classes = []

    const errors = this.getErrorsForLocale(locale)
    if (errors) {
      const zoneErrors = errors.getErrorsForZone(zoneKey)
      const errorTypes = Object.keys(zoneErrors).sort()
      const errorLevels = new Set()

      if (errorTypes.length) {
        classes.push('selective__field__input--error')
      }

      for (const key of errorTypes) {
        classes.push(`selective__field__input--error__${key}`)
        const errors = zoneErrors[key]
        for (const error of errors) {
          errorLevels.add(error.level)
        }
      }

      for (const key of errorLevels) {
        classes.push(`selective__field__input--error__level__${key}`)
      }
    }


    return classes.join(' ')
  }

  getClassesForLabel(locale, zoneKey) {
    const classes = ['selective__field__label']

    if (locale || zoneKey || !this.isLocalized) {
      const errors = this.getErrorsForLocale(locale)
      if (errors) {
        const zoneErrors = errors.getErrorsForZone(zoneKey)
        const errorTypes = Object.keys(zoneErrors).sort()
        const errorLevels = new Set()

        if (errorTypes.length) {
          classes.push('selective__field__label--error')
        }

        for (const key of errorTypes) {
          classes.push(`selective__field__label--error__${key}`)
          const errors = zoneErrors[key]
          for (const error of errors) {
            errorLevels.add(error.level)
          }
        }

        for (const key of errorLevels) {
          classes.push(`selective__field__label--error__level__${key}`)
        }
      }
    }

    return classes.join(' ')
  }

  getErrorsForLocale(locale) {
    return this.errors[this.keyForLocale(locale)]
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

  handleDeepLink(evt) {
    // Trigger a deep link event.
    document.dispatchEvent(new CustomEvent('selective.field.deep_link', {
      detail: {
        field: this.fullKey,
        operation: evt.shiftKey ? 'toggle' : 'replace',
      },
    }))
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
      ${this.renderHeader(selective, data)}
      ${this.renderLabel(selective, data)}
      ${this.renderLocalization(selective, data)}
      ${this.renderHelp(selective, data)}
      ${this.renderFooter(selective, data)}`
  }

  renderErrors(selective, data, locale, zoneKey) {
    const errors = this.getErrorsForLocale(locale)

    if (!errors) {
      return ''
    }

    const zoneErrors = errors.getErrorsForZone(zoneKey)
    const errorTypes = Object.keys(zoneErrors).sort()

    if (!errorTypes.length) {
      return ''
    }

    return html`<div class="selective__field__errors">
        ${repeat(
          errorTypes,
          (type) => type,
          (type, index) => html`
            ${repeat(
              zoneErrors[type],
              (errorMsg) => errorMsg.id,
              (errorMsg, index) => html`
                <div
                    class="selective__field__error selective__field__error--level__${errorMsg.level}"
                    data-error-level="${errorMsg.level}"
                    data-error-type="${errorMsg.type}">
                  ${errorMsg.message}
                </div>
              `)}
          `)}
      </div>`
  }

  renderFooter(selective, data) {
    return ''
  }

  renderHeader(selective, data) {
    return ''
  }

  renderHelp(selective, data) {
    if (!this.config.help) {
      return ''
    }

    return html`<div class="selective__field__help">${this.config.help}</div>`
  }

  renderIconError(selective, data, locale) {
    if (this.isValid) {
      return ''
    }

    return html`
      <span
          class="selective__field__invalid">
        <i class="material-icons">error</i>
      </span>`
  }

  renderIconLink(selective, data, locale) {
    return html`
      <span
          class="selective__field__deep_link"
          @click=${this.handleDeepLink.bind(this)}>
        <i class="material-icons">link</i>
      </span>`
  }

  renderInput(selective, data, locale) {
    return 'Input not defined.'
  }

  renderLabel(selective, data) {
    if (!this.config.label) {
      return ''
    }

    return html`<div class="${this.getClassesForLabel()}">
      ${this.renderIconLink(selective, data)}
      ${this.renderIconError(selective, data)}
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
              <label for="${this.uid}${locale}">${locale} ${locale == this.defaultLocale ? html`<span>(default)</span>` : ''}</label>
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
          data-field-type="${this.fieldType}"
          data-field-full-key="${this.fullKey}">
        ${this.renderField(selective, data)}
      </div>`
  }

  setErrorsForLocale(locale, value) {
    const localeKey = this.keyForLocale(locale)
    this.errors[localeKey] = value
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
    // Manual locking prevents the original value overwriting the value
    // in special cases when it should not.
    if (this._isLocked) {
      return
    }

    let newValue = data
    if (typeof data === 'object' && data !== null) {
      data = autoDeepObject(data)
      newValue = data.get(this.key)
    }

    const isClean = this.isClean
    this.isLocalized = selective.localize
    this.defaultLocale = selective.config.defaultLocale || 'en'

    // Order the locales so that the first locale is always the default locale.
    const sortedLocales = (selective.config.locales || [this.defaultLocale]).sort()
    const newLocales = [this.defaultLocale]
    for (const locale of sortedLocales) {
      if (locale != this.defaultLocale) {
        newLocales.push(locale)
      }
    }
    this.locales = newLocales

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
