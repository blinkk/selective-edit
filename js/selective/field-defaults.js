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
import Field from './field'
import { SortableField } from './field'
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
export class ListField extends SortableField {
  constructor(config) {
    super(config)
    this.fieldType = 'list'
    this._listItems = []
    this._isExpanded = false
    this._expandedIndexes = []

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__${field.fieldType}" data-field-type="${field.fieldType}">
      ${field.updateFromData(data)}
      <div class="selective__header">
        <div class="selective__field__label">${field.label}</div>
        ${field.renderActions(editor, field, data)}
      </div>
      <div class="selective__list">
        <div class="selective__list__items" id="${field.getUid()}">
          ${field.renderItems(editor, data)}
        </div>
      </div>
      <div class="selective__footer">
        <button class="selective__action__toggle" @click=${field.handleToggleExpand.bind(field)}>
          Add
        </button>
      </div>
    </div>`
  }

  get isExpanded() {
    // If all of the items are in the expanded list then consider it expanded.
    if (this._listItems.length == this._expandedIndexes.length) {
      return true
    }

    return this._isExpanded
  }

  createItems(editor) {
    // No value yet.
    if (!this.value) {
      return []
    }
    let index = 0
    const items = []
    for (const itemData of this.value) {
      const itemFields = new Fields(editor.fieldTypes)
      itemFields.valueFromData(itemData)

      // TODO: Use the field config for the list items to create the correct field types.
      const fieldConfigs = this.getConfig().get('fields', [])

      for (const fieldConfig of fieldConfigs || []) {
        itemFields.addField(fieldConfig)
      }

      items.push({
        'id': `${this.getUid()}-${index}`,
        'index': index,
        'itemFields': itemFields,
        'isExpanded': false,
      })

      index += 1
    }
    return items
  }

  handleItemCollapse(evt) {
    this.isExpanded = false
    const index = parseInt(evt.target.dataset.index)
    const expandIndex = this._expandedIndexes.indexOf(index)
    if (expandIndex > -1) {
      this._expandedIndexes.splice(expandIndex, 1)
      document.dispatchEvent(new CustomEvent('selective.render'))
    }
  }

  handleItemExpand(evt) {
    const index = parseInt(evt.target.dataset.index)
    this._expandedIndexes.push(index)
    document.dispatchEvent(new CustomEvent('selective.render'))
  }

  handleToggleExpand(evt) {
    if (this.isExpanded) {
      // Clear out all expanded indexes when collapsing.
      this._expandedIndexes = []
      this._isExpanded = false
    } else {
      this._isExpanded = true
    }

    document.dispatchEvent(new CustomEvent('selective.render'))
  }

  renderActions(editor, field, data) {
    // No expand toggle action to render if there is only 1 sub field config.
    const fieldConfigs = this.getConfig().get('fields', [])

    if (fieldConfigs.length <= 1) {
      return ''
    }

    // Allow collapsing and expanding of sub fields.
    return html`<div class="selective__actions">
      <button class="selective__action__toggle" @click=${field.handleToggleExpand.bind(field)}>
        ${field.isExpanded ? 'Collapse' : 'Expand'}
      </button>
    </div>`
  }

  renderCollapsedItem(editor, listItem) {
    return html`
      <div class="selective__list__item__drag"><i class="material-icons">drag_indicator</i></div>
      <div class="selective__list__item__preview sortable__preview" data-index=${listItem['index']} @click=${this.handleItemExpand.bind(this)}>
        ${this.renderPreview(listItem)}
      </div>`
  }

  renderExpandedItem(editor, listItem) {
    return html`
      <div class="selective__list__fields">
        <div class="partial__fields__label"
            data-index=${listItem['index']}
            @click=${this.handleItemCollapse.bind(this)}>
          ${listItem['itemFields'].label}
        </div>
        ${listItem['itemFields'].template(editor, listItem['itemFields'], this.value[listItem['index']])}
      </div>`
  }

  renderItems(editor, data) {
    // If the sub fields have not been created create them now.
    if (!this._listItems.length) {
      this._listItems = this.createItems(editor)
    }

    // Update the expanded state each render.
    for (const listItem of this._listItems) {
      const inIndex = this._expandedIndexes.indexOf(listItem['index']) > -1
      const itemValue = this.value[listItem['index']]
      const isSimpleValue = typeof itemValue !== 'object'
      listItem['isExpanded'] = this.isExpanded || inIndex || isSimpleValue
    }

    return html`${repeat(this._listItems, (listItem) => listItem['id'], (listItem, index) => html`
      <div class="selective__list__item selective__list__item--${listItem['isExpanded'] ? 'expanded' : 'collapsed'}"
          draggable="true"
          data-index=${listItem['index']}
          @dragenter=${this.handleDragEnter.bind(this)}
          @dragleave=${this.handleDragLeave.bind(this)}
          @dragover=${this.handleDragOver.bind(this)}
          @dragstart=${this.handleDragStart.bind(this)}
          @drop=${this.handleDrop.bind(this)}>
        ${listItem['isExpanded']
          ? this.renderExpandedItem(editor, listItem)
          : this.renderCollapsedItem(editor, listItem)}
      </div>
    `)}`
  }

  renderPreview(listItem) {
    const preview_field = this.getConfig().get('preview_field')
    const itemValue = this.value[listItem['index']]

    if (preview_field) {
      return autoDeepObject(itemValue).get(preview_field)
    }

    // Default to just previewing the value. May not be pretty.
    return itemValue
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
      <div class="mdc-text-field">
        <input type="text" id="${field.getUid()}" class="mdc-text-field__input" value="${field.valueFromData(data)}" @input=${field.handleInput.bind(field)}>
        <label class="mdc-floating-label" for="${field.getUid()}">${field.label}</label>
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
  'list': ListField,
  'markdown': MarkdownField,
  'text': TextField,
  'textarea': TextareaField,
}
