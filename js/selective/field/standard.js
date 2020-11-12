/**
 * Standard, vanilla fields.
 */

import { html } from 'lit-html'
import { ListField } from './list'
import Field from './field'

export class MarkdownField extends Field {
  constructor(config, extendedConfig) {
    super(config, extendedConfig)
    this.fieldType = 'markdown'
  }

  renderInput(selective, data, locale) {
    const value = this.getValueForLocale(locale) || ''

    return html`
      <textarea
        class="${this.getClassesForInput(locale)}"
        id="${this.uid}${locale || ''}"
        rows=${this.config.rows || 6}
        placeholder=${this.config.placeholder || ''}
        data-locale=${locale || ''}
        @input=${this.handleInput.bind(this)}>${value}</textarea>
      ${this.renderErrors(selective, data)}`
  }
}

export class TextField extends Field {
  constructor(config, extendedConfig) {
    super(config, extendedConfig)
    this.fieldType = 'text'
  }

  renderInput(selective, data, locale) {
    const value = this.getValueForLocale(locale) || ''

    return html`
      <input
        class="${this.getClassesForInput(locale)}"
        type="text"
        id="${this.uid}${locale || ''}"
        placeholder=${this.config.placeholder || ''}
        data-locale=${locale || ''}
        @input=${this.handleInput.bind(this)}
        value=${value}>
      ${this.renderErrors(selective, data)}`
  }
}

export class TextareaField extends Field {
  constructor(config, extendedConfig) {
    super(config, extendedConfig)
    this.fieldType = 'textarea'
  }

  renderInput(selective, data, locale) {
    const value = this.getValueForLocale(locale) || ''

    return html`
      <textarea
        class="${this.getClassesForInput(locale)}"
        id="${this.uid}${locale || ''}"
        rows=${this.config.rows || 6}
        placeholder=${this.config.placeholder || ''}
        data-locale=${locale || ''}
        @input=${this.handleInput.bind(this)}>${value}</textarea>
      ${this.renderErrors(selective, data)}`
  }
}

export const defaultFieldTypes = {
  'list': ListField,
  'markdown': MarkdownField,
  'text': TextField,
  'textarea': TextareaField,
}
