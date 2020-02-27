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
import Fields from './fields'
import { Base, compose } from '../utility/compose'
import { autoDeepObject } from '../utility/deepObject'

// ========================================
// === Base Field
// ========================================
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

  handleInput(evt) {
    // Update the value to what is being typed.
    // Helps mark the field as dirty.
    this.value = evt.target.value
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

  updateFromData(data) {
    // Update the data, but do not return the value.
    this.valueFromData(data)
  }

  valueFromData(data) {
    let newDataValue = data
    if (typeof data === 'object' && data !== null) {
      data = autoDeepObject(data)
      newDataValue = data.get(this.key)
    }

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

// ========================================
// === Markdown Field
// ========================================
export class MarkdownField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'markdown'
    this.turndownService = new TurndownService({ headingStyle: 'atx' })
    this._value = ''

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
// === Sortable Field
// ========================================
//
// The following are required as part of the template to make the sorting work:
//
// - Add 'draggable="true"' attribute to the sortable containers.
// - Add 'data-index="X"' attribute to any sortable container with the current index.
// - Add '@dragenter=${this.handleDragEnter.bind(this)}' event binding to the sortable container.
// - Add '@dragleave=${this.handleDragLeave.bind(this)}' event binding to the sortable container.
// - Add '@dragstart=${this.handleDragStart.bind(this)}' event binding to the sortable container.
// - Add '@dragover=${this.handleDragOver.bind(this)}' event binding to the sortable container.
// - Add '@drop=${this.handleDrop.bind(this)}' event binding to the sortable container.
// - Use 'sortable--hover' class to style the currently hovering drop target.
// - Use 'sortable--above' class to style the hovering element that is above the dragged element.
// - Use 'sortable--below' class to style the hovering element that is below the dragged element.
//
export class SortableField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'sortable'
    this._dragOriginElement = null
    this._dragHoverElement = null
    this._dataValue = []
    this._value = []
    this.template = (editor, field, data) => html`<div>
      Sortable Field sub class needs a custom template.
    </div>`
  }

  _findDraggable(target) {
    // Use the event target to traverse until the draggable element is found.
    let isDraggable = false
    while (target && !isDraggable) {
      isDraggable = target.getAttribute('draggable') == 'true'
      if (!isDraggable) {
        target = target.parentElement
      }
    }
    return target
  }

  _reorderValues(currentIndex, startIndex) {
    // Dropped on self, ignore.
    if (currentIndex == startIndex) {
      return false
    }

    // Rework the array to have the items in the correct position.
    const newValue = []
    const oldValue = this._value
    const maxIndex = Math.max(currentIndex, startIndex)
    const minIndex = Math.min(currentIndex, startIndex)

    // Determine which direction to shift misplaced items.
    let modifier = 1
    if (startIndex > currentIndex) {
      modifier = -1
    }

    for (let i = 0; i < oldValue.length; i++) {
      if (i < minIndex || i > maxIndex) {
        // Leave in the same order.
        newValue[i] = oldValue[i]
      } else if (i == currentIndex) {
        // This element is being moved to, place the moved value here.
        newValue[i] = oldValue[startIndex]
      } else {
        // Shift the old index using the modifier to determine direction.
        newValue[i] = oldValue[i+modifier]
      }
    }

    this._value = newValue

    return true
  }

  _shouldHandleDrag(evt) {
    return (this._dragOriginElement
      && evt.dataTransfer.types.includes('selective/index'))
  }

  handleDragStart(evt) {
    this._dragOriginElement = evt.target
    evt.dataTransfer.setData('text/plain', evt.target.dataset.index)
    evt.dataTransfer.setData('selective/index', evt.target.dataset.index)
    evt.dataTransfer.effectAllowed = 'move'
  }

  handleDragEnter(evt) {
    if (this._shouldHandleDrag(evt)) {
      const target = this._findDraggable(evt.target)
      if (!target) {
        return
      }

      const currentIndex = parseInt(evt.target.dataset.index)
      const startIndex = parseInt(this._dragOriginElement.dataset.index)

      // Show that the element is hovering.
      // Also prevent sub elements from triggering more drag events.
      target.classList.add('sortable--hover')

      // Hovering over self, ignore.
      if (currentIndex == startIndex) {
        return
      }

      if (currentIndex < startIndex) {
        target.classList.add('sortable--above')
      } else {
        target.classList.add('sortable--below')
      }
    }
  }

  handleDragLeave(evt) {
    if (this._shouldHandleDrag(evt)) {
      const target = this._findDraggable(evt.target)
      if (!target) {
        return
      }

      // No longer hovering.
      target.classList.remove(
        'sortable--hover', 'sortable--above', 'sortable--below')
    }
  }

  handleDragOver(evt) {
    if (this._shouldHandleDrag(evt)) {
      // Flag to the browser that this is a valid drop target.
      evt.preventDefault()
    }
  }

  handleDrop(evt) {
    // Trying to drag from outside the list.
    if (!this._dragOriginElement) {
      return
    }

    const target = this._findDraggable(evt.target)
    const currentIndex = parseInt(evt.target.dataset.index)
    const startIndex = parseInt(evt.dataTransfer.getData("text/plain"))

    // No longer hovering.
    target.classList.remove(
      'sortable--hover', 'sortable--above', 'sortable--below')

    // Reset the drag element.
    this._dragOriginElement = null

    if (!this._reorderValues(currentIndex, startIndex)) {
      // If false nothing changed, so don't re-render.
      return
    }

    // Trigger a re-render after moving.
    document.dispatchEvent(new CustomEvent('selective.render'))
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
    this.intializeMaterialComponents(
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
    this.intializeMaterialComponents(
      fieldInstances, '.mdc-text-field', MDCTextField)
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
        <div>TODO: Allow adding more items.</div>
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
    // TODO: No actions to render if there is only 1 sub field.
    return ''

    // Allow collapsing and expanding of sub fields.

    // return html`<div class="selective__actions">
    //   <button class="selective__action__toggle" @click=${field.handleToggleExpand.bind(field)}>
    //     ${field.isExpanded ? 'Collapse' : 'Expand'}
    //   </button>
    // </div>`
  }

  renderCollapsedItem(editor, listItem) {
    return html`
      <div class="selective__list__item__drag"><i class="material-icons">drag_indicator</i></div>
      <div class="selective__list__item__preview" data-index=${listItem['index']} @click=${this.handleItemExpand.bind(this)}>
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
          @dragstart=${this.handleDragStart.bind(this)}
          @dragover=${this.handleDragOver.bind(this)}
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

export const defaultFields = {
  'list': ListField,
  'markdown': MarkdownField,
  'text': TextField,
  'textarea': TextareaField,
}
