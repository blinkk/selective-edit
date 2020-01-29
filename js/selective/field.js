/**
 * Field defined for editing.
 */

import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import marked from 'marked'
import { MDCTextField } from '@material/textfield/index'
import pell from 'pell'
import TurndownService from 'turndown'
import ConfigMixin from '../mixin/config'
import UidMixin from '../mixin/uid'
import { Base, compose } from '../utility/compose'
import { autoDeepObject } from '../utility/deepObject'

export default class Field extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(config) {
    super()
    this.fieldType = 'Field'
    this.setConfig(config)
    this._dataValue = undefined
    this.value = undefined

    this.template = (editor, field, data) => html`<div class="selective__field" data-field-type="${field.fieldType}">
      Missing template.
    </div>`
  }

  get isClean() {
    return this._dataValue == this.value
  }

  get key() {
    return this.getConfig().key
  }

  get label() {
    return this.getConfig().label
  }

  get options() {
    return this.getConfig().options || {}
  }

  static initialize(containerEl) {
    // Pass.
  }

  static intializeMaterialComponents(fieldInstances, selector, materialClass) {
    for (const fieldInstance of fieldInstances) {
      let fieldComponents = fieldInstance.mdcFields

      if (!fieldComponents) {
        fieldComponents = fieldInstance.mdcFields = {}
      }

      // Check if field is already initialized.
      if (selector in fieldComponents) {
        continue
      }

      const mdcElements = fieldInstance.querySelectorAll('.mdc-text-field')
      const mdcObjects = []
      for (const mdcElement of mdcElements) {
        mdcObjects.push(new MDCTextField(mdcElement))
      }
      fieldComponents[selector] = mdcObjects
    }
  }

  postRender(containerEl) {
    // Pass.
  }

  valueFromData(data) {
    data = autoDeepObject(data)
    const newDataValue = data.get(this.key)

    if (!this.isClean) {
      // The value has changed since the last update.
      // Update the stored data value, but don't change the actual value.
      // isClean uses the _dataValue, so don't change until after the compare
      // is complete.
      this._dataValue = newDataValue
      return this.value
    }
    this._dataValue = newDataValue
    this.value = newDataValue
    return this.value
  }
}

export class MarkdownField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'markdown'
    this.turndownService = new TurndownService({ headingStyle: 'atx' })
    this._value = ''

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__markdown">
      <div class="selective__field__markdown__label">${field.label}</div>
      <div id="${field.getUid()}" class="pell">${field.valueFromData(data)}</div>
    </div>`
  }

  postRender(containerEl) {
    const actions = this.getConfig().get('pellActions', [
      'bold', 'italic', 'heading1', 'heading2', 'olist', 'ulist', 'link'])
    const fieldInstances = containerEl.querySelectorAll('.selective__field__markdown')
    for (const fieldInstance of fieldInstances) {
      if (!fieldInstance.pellEditor) {
        const pellEl = fieldInstance.querySelector('.pell')

        fieldInstance.pellEditor = pell.init({
          element: pellEl,
          actions: actions,
          onChange: (html) => {
            this.value = this.turndownService.turndown(html)
          }
        })
      }

      fieldInstance.pellEditor.content.innerHTML = marked(this.value || '')
    }
  }

  valueFromData(data) {
    super.valueFromData(data)

    // Do not return anything for markdown editor.
    // The content is updated in the postRender and should not be displayed.
  }
}

export class TextField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'text'

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__text" data-field-type="${field.fieldType}">
      <div class="mdc-text-field">
        <input type="text" id="${field.getUid()}" class="mdc-text-field__input" value="${field.valueFromData(data)}" @input=${field.handleInput.bind(field)}>
        <label class="mdc-floating-label" for="${field.getUid()}">${field.label}</label>
        <div class="mdc-line-ripple"></div>
      </div>
    </div>`
  }

  static initialize(containerEl) {
    const fieldInstances = containerEl.querySelectorAll('.selective__field__text')
    this.intializeMaterialComponents(
      fieldInstances, '.mdc-text-field', MDCTextField)
  }

  handleInput(evt) {
    // Update the value to what is being typed.
    // Helps mark the field as dirty.
    this.value = evt.target.value
  }
}

export class TextareaField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'textarea'

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__textarea">
      <div class="mdc-text-field mdc-text-field--textarea mdc-text-field--fullwidth">
        <textarea id="${field.getUid()}" class="mdc-text-field__input" rows="${field.options.rows || 6}" @input=${field.handleInput.bind(field)}>${field.valueFromData(data) || ' '}</textarea>
        <div class="mdc-notched-outline">
          <div class="mdc-notched-outline__leading"></div>
          <div class="mdc-notched-outline__notch">
            <label for="${field.getUid()}" class="mdc-floating-label">${field.label}</label>
          </div>
          <div class="mdc-notched-outline__trailing"></div>
        </div>
      </div>
    </div>`
  }

  static initialize(containerEl) {
    const fieldInstances = containerEl.querySelectorAll('.selective__field__textarea')
    this.intializeMaterialComponents(
      fieldInstances, '.mdc-text-field', MDCTextField)
  }

  handleInput(evt) {
    // Update the value to what is being typed.
    // Helps mark the field as dirty.
    this.value = evt.target.value
  }
}

export const defaultFields = {
  'markdown': MarkdownField,
  'text': TextField,
  'textarea': TextareaField,
}
