/**
 * Field Type for the editor.
 */

import {
  autoConfig
} from '../utility/config'
import {
  html,
  render
} from 'lit-html'
import marked from 'marked'
import pell from 'pell'
import TurndownService from 'turndown'
import {
  MDCTextField
} from '@material/textfield/index'

export default class FieldType {
  constructor(type, config, template) {
    this.config = config
    this.template = template
    this.type = type
  }

  get config() {
    return this._config
  }

  set config(value) {
    this._config = autoConfig(value)
  }

  /**
   * Bind the field for any events or modification.
   */
  bindField(field, element, inputEls) {
    inputEls = inputEls || this.inputEls
    if (inputEls && inputEls.length) {
      for (const inputEl of inputEls) {
        // Bind the blur and focus to keep track of when it is being edited.
        inputEl.addEventListener('blur', () => {
          field.isFocused = false
        })
        inputEl.addEventListener('focus', () => {
          field.isFocused = true
        })
      }
    }
  }

  getInputEls(element) {
    const inputEls = []

    const selectors = this.config.get('inputSelectors')
    if (selectors) {
      for (const selector of selectors) {
        const inputEl = element.querySelector(selector)
        if (inputEl) {
          inputEls.push(inputEl)
        }
      }
    }

    return inputEls
  }

  getValue(field, element) {
    const valueSelector = this.config.get('valueSelector')
    if (valueSelector) {
      return element.querySelector(valueSelector).value
    }
    return null
  }

  postRender(field, element, config, value) {
    if (this.config.uiClass && this.config.uiClassSelector && !field.fieldUi) {
      field.fieldUi = new this.config.uiClass(
        element.querySelector(this.config.uiClassSelector))
    }
  }

  render(field, element, config, value) {
    render(this.template(config.id, config.label, value, config.options || {}), element)
  }

  setValue(field, element, config, value) {
    this.render(field, element, config, value)
  }
}


export class MarkdownFieldType extends FieldType {
  constructor(type, config, template) {
    super(type, config, template)
    this.turndownService = new TurndownService({ headingStyle: 'atx' })
  }

  bindField(field, element) {
    const actions = this.config.get('pellActions', [
      'bold', 'italic', 'heading1', 'heading2', 'olist', 'ulist', 'link'])

    if (!field.editor) {
      field.editor = pell.init({
        element: field.inputEls[0],
        actions: actions,
        onChange: () => {}
      })
    }

    super.bindField(field, element, [field.editor.content])
  }

  getValue(field, element) {
    return this.turndownService.turndown(field.editor.content.innerHTML)
  }

  postRender(field, element, config, value) {
    this.setValue(field, element, config, value)
  }

  setValue(field, element, config, value) {
    field.editor.content.innerHTML = marked(value || '')
  }
}


export const listFieldType = new FieldType('list', {}, (id, label, value, options) => html`<div class="field field__list">
  <div class="list">
    <div class="list__label"></div>
    <div class="list__items">
      <div class="list__list" id="${id}"></div>
      <div class="list__add">
        <div class="mdc-select">
          <select class="mdc-select__native-control"></select>
          <div class="mdc-select__label mdc-select__label--float-above">${label}</div>
          <div class="mdc-select__bottom-line"></div>
        </div>
        <button class="mdc-button mdc-button--raised">
          <i class="material-icons mdc-button__icon">add</i>
          Add
        </button>
      </div>
    </div>
  </div>
</div>`)


export const markdownFieldType = new MarkdownFieldType('markdown', {
  inputSelectors: [
    '.pell',
  ],
}, (id, label, value, options) => html`<div class="field field__markdown">
  <div class="field__markdown__label">${label}</div>
  <div id="${id}" class="pell"></div>
</div>`)


export const textFieldType = new FieldType('text', {
  uiClass: MDCTextField,
  uiClassSelector: '.mdc-text-field',
  inputSelectors: [
    'input',
  ],
  valueSelector: 'input',
}, (id, label, value, options) => html`<div class="field field__text">
  <div class="mdc-text-field">
    <input type="text" id="${id}" class="mdc-text-field__input" value="${value}">
    <label class="mdc-floating-label" for="${id}">${label}</label>
    <div class="mdc-line-ripple"></div>
  </div>
</div>`)


export const textareaFieldType = new FieldType('textarea', {
  uiClass: MDCTextField,
  uiClassSelector: '.mdc-text-field',
  inputSelectors: [
    'textarea',
  ],
  valueSelector: 'textarea',
}, (id, label, value, options) => html`<div class="field field__textarea">
  <div class="mdc-text-field mdc-text-field--textarea mdc-text-field--fullwidth">
    <textarea id="${id}" class="mdc-text-field__input" rows="${options.rows || 6}">${value}</textarea>
    <div class="mdc-notched-outline">
      <div class="mdc-notched-outline__leading"></div>
      <div class="mdc-notched-outline__notch">
        <label for="${id}" class="mdc-floating-label">${label}</label>
      </div>
      <div class="mdc-notched-outline__trailing"></div>
    </div>
  </div>
</div>`)


export const defaultFieldTypes = [
  textFieldType,
  textareaFieldType,
  markdownFieldType,
  listFieldType,
]
