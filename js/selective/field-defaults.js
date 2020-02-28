/**
 * Field defined for editing.
 */

import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import marked from 'marked'
import { MDCRipple } from '@material/ripple/index'
import { MDCTextField } from '@material/textfield/index'
import pell from 'pell'
import TurndownService from 'turndown'
import ConfigMixin from '../mixin/config'
import UidMixin from '../mixin/uid'
import Field from './field'
import { ListField } from './field'
import Fields from './fields'
import { autoDeepObject } from '../utility/deepObject'

function intializeMaterialComponents(fieldInstances, selector, materialClass) {
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

// ========================================
// === List Field
// ========================================
export class ListFieldMDC extends ListField {
  static initialize(containerEl) {
    const fieldInstances = containerEl.querySelectorAll('.selective__field__list')
    intializeMaterialComponents(fieldInstances, '.mdc-button', MDCRipple)
  }

  renderActionsFooter(editor, field, data) {
    return html`<div class="selective__actions">
      <button class="mdc-button" @click=${(evt) => {field.handleAddItem(evt, editor)}}>
        <div class="mdc-button__ripple"></div>
        <i class="material-icons mdc-button__icon" aria-hidden="true">add</i>
        <span class="mdc-button__label">Add</span>
      </button>
    </div>`
  }

  renderActionsHeader(editor, field, data) {
    // No expand toggle action to render if there is only 1 sub field config.
    const fieldConfigs = this.getConfig().get('fields', [])

    if (fieldConfigs.length <= 1) {
      return ''
    }

    // Allow collapsing and expanding of sub fields.
    return html`<div class="selective__actions">
      <button class="mdc-button selective__action__toggle" @click=${field.handleToggleExpand.bind(field)}>
        <div class="mdc-button__ripple"></div>
        <span class="mdc-button__label">${field.isExpanded ? 'Collapse' : 'Expand'}</span>
      </button>
    </div>`
  }
}

// ========================================
// === Markdown Field
// ========================================
export class MarkdownField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'markdown'
    this.turndownService = new TurndownService({ headingStyle: 'atx' })

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__${field.fieldType}" data-field-type="${field.fieldType}">
      <div class="selective__field__label selective__field__label--markdown">${field.label}</div>
      <div id="${field.getUid()}" class="pell">${field.updateFromData(data)}</div>
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
}

// ========================================
// === Text Field
// ========================================
export class TextField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'text'

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__${field.fieldType}" data-field-type="${field.fieldType}">
      <div class="mdc-text-field ${field.label ? '' : 'mdc-text-field--no-label'}">
        <input type="text" id="${field.getUid()}" class="mdc-text-field__input" value="${field.valueFromData(data) || ''}" @input=${field.handleInput.bind(field)}>
        ${field.label
          ? html`<label class="mdc-floating-label" for="${field.getUid()}">${field.label}</label>`
          : ''}
        <div class="mdc-line-ripple"></div>
      </div>
    </div>`
  }

  static initialize(containerEl) {
    const fieldInstances = containerEl.querySelectorAll('.selective__field__text')
    intializeMaterialComponents(
      fieldInstances, '.mdc-text-field', MDCTextField)
  }
}

// ========================================
// === Textarea Field
// ========================================
export class TextareaField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'textarea'

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__${field.fieldType}">
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
    intializeMaterialComponents(
      fieldInstances, '.mdc-text-field', MDCTextField)
  }
}

export const defaultFieldTypes = {
  'list': ListFieldMDC,
  'markdown': MarkdownField,
  'text': TextField,
  'textarea': TextareaField,
}
