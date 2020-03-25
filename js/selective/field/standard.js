/**
 * Standard, vanilla fields.
 */

import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
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
        id="${this.uid}${locale || ''}"
        rows=${this.config.rows || 6}
        placeholder=${this.config.placeholder || ''}
        data-locale=${locale || ''}
        @input=${this.handleInput.bind(this)}>${value}</textarea>`
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
        type="text"
        id="${this.uid}${locale || ''}"
        placeholder=${this.config.placeholder || ''}
        data-locale=${locale || ''}
        @input=${this.handleInput.bind(this)}
        value=${value}>`
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
        id="${this.uid}${locale || ''}"
        rows=${this.config.rows || 6}
        placeholder=${this.config.placeholder || ''}
        data-locale=${locale || ''}
        @input=${this.handleInput.bind(this)}>${value}</textarea>`
  }
}

export const defaultFieldTypes = {
  'list': ListField,
  'markdown': MarkdownField,
  'text': TextField,
  'textarea': TextareaField,
}
