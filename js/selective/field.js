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

export default class Field extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(config) {
    super()
    this.fieldType = 'Field'
    this.setConfig(config)

    this.template = (editor, field, data) => html`<div class="selective__field" data-field-type="${field.fieldType}">
      Missing template.
    </div>`
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
    // TODO: Use the last known value if the field is dirty.
    const key = this.getConfig().key
    this.value = data.get(key)
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
          onChange: () => {}
        })
      }

      fieldInstance.pellEditor.content.innerHTML = marked(this.value || '')
    }
  }

  valueFromData(data) {
    // TODO: Use the last known value if the field is dirty.
    const key = this.getConfig().key
    this.value = data.get(key)

    // Do not return anything for markdown editor.
    // The content is updated in the postRender.
  }
}

export class TextField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'text'

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__text" data-field-type="${field.fieldType}">
      <div class="mdc-text-field">
        <input type="text" id="${field.getUid()}" class="mdc-text-field__input" value="${field.valueFromData(data)}">
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
}

export class TextareaField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'textarea'

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__textarea">
      <div class="mdc-text-field mdc-text-field--textarea mdc-text-field--fullwidth">
        <textarea id="${field.getUid()}" class="mdc-text-field__input" rows="${field.options.rows || 6}">${field.valueFromData(data) || ' '}</textarea>
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
}

const defaultFields = {
  'markdown': MarkdownField,
  'text': TextField,
  'textarea': TextareaField,
}

export { defaultFields }
