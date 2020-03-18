/**
 * Field defined for editing.
 */

import * as stringify from 'json-stable-stringify'
import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import ConfigMixin from '../mixin/config'
import UidMixin from '../mixin/uid'
import Fields from './fields'
import AutoFields from './autoFields'
import { Base, compose } from '../utility/compose'
import { autoConfig } from '../utility/config'
import { autoDeepObject } from '../utility/deepObject'
import { findParentByClassname, findParentDraggable } from '../utility/dom'

const WHITESPACE_RE = /^[\s]+|[\s]+$/g

// ========================================
// === Base Field
// ========================================
export default class Field extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(config, extendedConfig) {
    super()
    this.fieldType = 'Field'
    this.extendedConfig = extendedConfig || {}
    this.setConfig(config)
    this._dataValue = undefined
    this.value = undefined

    this.template = (editor, field, data) => html`<div class="selective__field" data-field-type="${field.fieldType}">
      Missing template.
    </div>`
  }

  get default() {
    return this.getConfig().default
  }

  get help() {
    return this.getConfig().help
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

  get placeholder() {
    return this.getConfig().placeholder || ''
  }

  handleInput(evt) {
    // Update the value to what is being typed.
    // Helps mark the field as dirty.
    // Strip the whitespace as well.
    this.value = evt.target.value.replace(WHITESPACE_RE, '')

    document.dispatchEvent(new CustomEvent('selective.render'))
  }

  static initialize(containerEl) {
    // Pass.
  }

  renderHelp(editor, field, data) {
    if (!field.help) {
      return ''
    }

    return html`<div class="selective__field__help">${field.help}</div>`
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

    // Allow for using the config default value.
    if (newDataValue == undefined) {
      const defaultValue = this.default
      if (defaultValue != undefined) {
        newDataValue = defaultValue
      }
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
// - Optionally add 'sortable__preview' class to a child elmeent to use as the dragging preview.
//
export class SortableField extends Field {
  constructor(config, extendedConfig) {
    super(config, extendedConfig)
    this.fieldType = 'sortable'
    this._dragOriginElement = null
    this._dragHoverElement = null
    this._dataValue = []
    this.template = (editor, field, data) => html`<div>
      Sortable Field sub class needs a custom template.
    </div>`
  }

  _reorderValues(currentIndex, startIndex) {
    // Dropped on self, ignore.
    if (currentIndex == startIndex) {
      return false
    }

    // Rework the array to have the items in the correct position.
    const newValue = []
    const oldValue = this.value
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

    this.value = newValue

    return true
  }

  _shouldHandleDrag(evt) {
    return (this._dragOriginElement
      && evt.dataTransfer.types.includes(`selective/${this.getUid()}`))
  }

  handleDragStart(evt) {
    evt.stopPropagation()
    const target = findParentDraggable(evt.target)
    this._dragOriginElement = target
    evt.dataTransfer.setData('text/plain', evt.target.dataset.index)
    evt.dataTransfer.setData(`selective/${this.getUid()}`, evt.target.dataset.index)
    evt.dataTransfer.effectAllowed = 'move'

    // Allow for custom preview for dragging.
    const previewEl = target.querySelector('.sortable__preview')
    if (previewEl) {
      evt.dataTransfer.setDragImage(previewEl, 0, 0)
    }
  }

  handleDragEnter(evt) {
    if (this._shouldHandleDrag(evt)) {
      const target = findParentDraggable(evt.target)
      if (!target) {
        return
      }

      evt.stopPropagation()

      // Show that the element is hovering.
      // Also prevent sub elements from triggering more drag events.
      target.classList.add('sortable--hover')

      const currentIndex = parseInt(evt.target.dataset.index)
      const startIndex = parseInt(this._dragOriginElement.dataset.index)

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
      const target = findParentDraggable(evt.target)
      if (!target) {
        return
      }

      //  Make sure that the event target comes from the main element.
      if (target !== evt.target) {
        return
      }

      evt.stopPropagation()

      // No longer hovering.
      target.classList.remove(
        'sortable--hover', 'sortable--above', 'sortable--below')
    }
  }

  handleDragOver(evt) {
    if (this._shouldHandleDrag(evt)) {
      // Flag to the browser that this is a valid drop target.
      evt.preventDefault()
      evt.stopPropagation()
    }
  }

  handleDrop(evt) {
    // Trying to drag from outside the list.
    if (!this._dragOriginElement) {
      return
    }

    evt.stopPropagation()

    const target = findParentDraggable(evt.target)
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
// === List Field
// ========================================
export class ListField extends SortableField {
  constructor(config, extendedConfig) {
    super(config, extendedConfig)
    this.fieldType = 'list'
    this._listItems = []
    this._listIds = []
    this._isExpanded = false
    this._useAutoFields = false
    this._expandedIndexes = []

    this.template = (editor, field, data) => html`
      <div
          class="selective__field selective__field__${field.fieldType}"
          data-field-type="${field.fieldType}">
        ${field.ensureItems(editor, data)}
        ${field.updateFromData(data)}
        <div class="selective__header">
          <div class="selective__field__label">${field.label}</div>
          ${field.renderActionsHeader(editor, field, data)}
        </div>
        <div class="selective__list">
          <div class="selective__list__items" id="${field.getUid()}">
            ${field.renderItems(editor, data)}
          </div>
        </div>
        <div class="selective__footer">
          ${field.renderActionsFooter(editor, field, data)}
        </div>
      </div>`
  }

  _idsFromList(itemList) {
    const ids = []

    for (const item of itemList) {
      ids.push(item.id)
    }

    return ids
  }

  _reorderValues(currentIndex, startIndex) {
    // Rework the expanded array to have the items in the correct position.
    const newExpanded = []
    const oldExpanded = this._expandedIndexes
    const newItems = []
    const oldItems = this._listItems
    const valueLen = this.value.length
    const maxIndex = Math.max(currentIndex, startIndex)
    const minIndex = Math.min(currentIndex, startIndex)

    // Determine which direction to shift misplaced items.
    let modifier = 1
    if (startIndex > currentIndex) {
      modifier = -1
    }

    for (let i = 0; i < valueLen; i++) {
      if (i < minIndex || i > maxIndex) {
        // Leave in the same order.
        newItems[i] = oldItems[i]

        if (oldExpanded.includes(i)) {
          newExpanded.push(i)
        }
      } else if (i == currentIndex) {
        // This element is being moved to, place the moved value here.
        newItems[i] = oldItems[startIndex]
        newItems[i]['index'] = i

        if (oldExpanded.includes(startIndex)) {
          newExpanded.push(i)
        }
      } else {
        // Shift the old index using the modifier to determine direction.
        newItems[i] = oldItems[i+modifier]
        newItems[i]['index'] = i

        if (oldExpanded.includes(i+modifier)) {
          newExpanded.push(i)
        }
      }
    }

    this._expandedIndexes = newExpanded
    this._listItems = newItems
    return true
  }

  get isClean() {
    // If there are no list items, it has not been changed.
    if (!this._listItems || this._listItems.length < 1) {
      return true
    }

    // Check each item to see if it is clean.
    for (const item of this._listItems) {
      if (!item['itemFields'].isClean) {
        return false
      }
    }

    // Check if the ids on the item list have changed.
    const originalIds = stringify(this._listIds)
    const currentIds = stringify(this._idsFromList(this._listItems))
    if (originalIds != currentIds) {
      return false
    }

    return true
  }

  get isExpanded() {
    // If all of the items are in the expanded list then consider it expanded.
    if (this._listItems.length == this._expandedIndexes.length) {
      return true
    }

    return this._isExpanded
  }

  get value() {
    if (!this._listItems || !this._listItems.length) {
      return this._dataValue
    }

    // Loop through each fields and get the values.
    const values = []
    for (const item of this._listItems) {
      values.push(item['itemFields'].value)
    }

    return values
  }

  set isExpanded(value) {
    this._isExpanded = value

    // TODO: Save to local storage
  }

  set value(value) {
    // no-op
  }

  _createItems(editor, data) {
    // No value yet.
    if (!this.value) {
      return []
    }

    // Use the field config for the list items to create the correct field types.
    let fieldConfigs = this.getConfig().get('fields', [])
    this._useAutoFields = fieldConfigs.length == 0

    let index = 0
    const items = []
    for (const itemData of this.value) {
      const itemFields = new Fields(editor.fieldTypes)
      itemFields.valueFromData(itemData || {})

      if (this._useAutoFields) {
        // Auto guess the fields if they are not defined.
        fieldConfigs = new AutoFields(itemData).config['fields']
      }

      for (let fieldConfig of fieldConfigs || []) {
        fieldConfig = autoConfig(fieldConfig, this.extendedConfig)
        itemFields.addField(fieldConfig, this.extendedConfig)
      }

      // When a partial is not expanded it does not get the value
      // updated correctly so we need to manually call the data update.
      for (const itemField of itemFields.fields) {
        itemField.updateFromData(itemData || {})
      }

      items.push({
        'id': `${this.getUid()}-${index}`,
        'index': index,
        'itemFields': itemFields,
        'fieldConfigs': fieldConfigs,
        'isExpanded': false,
      })

      index += 1
    }

    return items
  }

  _determineItemPreview(listItem) {
    const defaultPreviewField = this.getConfig().get('preview_field')
    const previewField = (listItem['partialConfig'] || {})['preview_field']
    const itemValue = this.value[listItem['index']]
    let previewValue = itemValue

    if (previewField || defaultPreviewField) {
      previewValue = autoDeepObject(itemValue).get(previewField || defaultPreviewField)
    }

    // Do not try to show preview for complex values.
    if (typeof previewValue == 'object') {
      previewValue = null
    }
    return previewValue
  }

  ensureItems(editor, data) {
    // If the sub fields have not been created create them now.
    if (!this._listItems.length) {
      this._listItems = this._createItems(editor, data)

      // Expand by default if there is only one item.
      if (this._listItems.length == 1) {
        this._expandedIndexes = [0]
      }

      this._listIds = this._idsFromList(this._listItems)
    }
  }

  handleAddItem(evt, editor) {
    const index = this.value ? this.value.length : 0
    const itemFields = new Fields(editor.fieldTypes)

    // Use the field config for the list items to create the correct field types.
    let fieldConfigs = this.getConfig().get('fields', [])

    // If no field configs, use the last item config if availble.
    if (!fieldConfigs.length && index > 0) {
      fieldConfigs = this._listItems[index-1].fieldConfigs
    }

    for (let fieldConfig of fieldConfigs || []) {
      fieldConfig = autoConfig(fieldConfig, this.extendedConfig)
      itemFields.addField(fieldConfig, this.extendedConfig)
    }

    if (fieldConfigs.length > 1) {
      itemFields.valueFromData({})
    } else {
      itemFields.valueFromData('')
    }

    this._listItems.push({
      'id': `${this.getUid()}-${index}`,
      'index': index,
      'itemFields': itemFields,
      'fieldConfigs': fieldConfigs,
      'isExpanded': false,
    })

    // Expanded by default.
    this._expandedIndexes.push(index)

    document.dispatchEvent(new CustomEvent('selective.render'))
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

  handleItemDelete(evt) {
    evt.stopPropagation()

    const target = findParentByClassname(
      evt.target, 'selective__list__item__delete')
    const index = parseInt(target.dataset.index)

    // Clean up an expanded indexes.
    const newExpanded = []
    for (const oldIndex of this._expandedIndexes) {
      if (oldIndex == index) {
        continue
      } else if (oldIndex > index) {
        newExpanded.push(oldIndex - 1)
      } else {
        newExpanded.push(oldIndex)
      }
    }
    this._expandedIndexes = newExpanded

    // Clean up the items.
    const newListItems = []
    for (const oldItem of this._listItems) {
      if (oldItem['index'] == index) {
        continue
      } else if (oldItem['index'] > index) {
        oldItem['index'] = oldItem['index'] - 1
        newListItems.push(oldItem)
      } else {
        newListItems.push(oldItem)
      }
    }
    this._listItems = newListItems

    // Remove the value.
    this.value.splice(index, 1)

    document.dispatchEvent(new CustomEvent('selective.render'))
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

  renderActionsFooter(editor, field, data) {
    return html`<div class="selective__actions">
      <button @click=${(evt) => {field.handleAddItem(evt, editor)}}>
        Add
      </button>
    </div>`
  }

  renderActionsHeader(editor, field, data) {
    // No expand toggle action to render if there is only 1 sub field config.
    const fieldConfigs = this.getConfig().get('fields', [])

    // No need to expand/collapse when there is only one field config.
    if (fieldConfigs.length == 1) {
      return ''
    }

    // No need to expand/collapse when there is only one list item.
    if (this._listItems && this._listItems.length <= 1) {
      return ''
    }

    // Hide when there are no values to expand/collapse.
    if ((this.value || []).length == 0) {
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
      </div>
      <div
          class="selective__list__item__delete"
          data-index=${listItem['index']}
          @click=${this.handleItemDelete.bind(this)}
          title="Delete item">
        <i class="material-icons">delete</i>
      </div>`
  }

  renderExpandedItem(editor, listItem) {
    return html`
      <div class="selective__list__fields">
        <div class="selective__list__fields__label ${!listItem['itemFields'].label ? 'selective__list__fields__label--empty' : ''}"
            data-index=${listItem['index']}
            @click=${this.handleItemCollapse.bind(this)}>
          ${listItem['itemFields'].label}
        </div>
        ${listItem['itemFields'].template(editor, listItem['itemFields'], this.value[listItem['index']])}
      </div>`
  }

  renderItems(editor, data) {
    this.ensureItems(editor, data)

    // Update the expanded state each render.
    for (const listItem of this._listItems) {
      const inIndex = this._expandedIndexes.indexOf(listItem['index']) > -1
      const itemValue = this.value[listItem['index']]
      const isSimpleValue = typeof itemValue !== 'object'
      listItem['isExpanded'] = this.isExpanded || inIndex || isSimpleValue
    }

    return html`${repeat(this._listItems, (listItem) => listItem['id'], (listItem, index) => html`
      <div class="selective__list__item selective__list__item--${listItem['isExpanded'] ? 'expanded' : 'collapsed'} ${this._useAutoFields ? 'selective__list__item--auto' : ''}"
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
    const previewValue = this._determineItemPreview(listItem)
    return previewValue || `Item ${listItem.index + 1}`
  }
}
