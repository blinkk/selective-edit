/**
 * Field defined for editing.
 */

import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
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
  constructor(config) {
    super(config)
    this.fieldType = 'sortable'
    this._dragOriginElement = null
    this._dragHoverElement = null
    this._dataValue = []
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
      && evt.dataTransfer.types.includes('selective/index'))
  }

  handleDragStart(evt) {
    const target = this._findDraggable(evt.target)
    this._dragOriginElement = target
    evt.dataTransfer.setData('text/plain', evt.target.dataset.index)
    evt.dataTransfer.setData('selective/index', evt.target.dataset.index)
    evt.dataTransfer.effectAllowed = 'move'

    // Allow for custom preview for dragging.
    const previewEl = target.querySelector('.sortable__preview')
    if (previewEl) {
      evt.dataTransfer.setDragImage(previewEl, 0, 0)
    }
  }

  handleDragEnter(evt) {
    if (this._shouldHandleDrag(evt)) {
      const target = this._findDraggable(evt.target)
      if (!target) {
        return
      }

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
      const target = this._findDraggable(evt.target)
      if (!target) {
        return
      }

      //  Make sure that the event target comes from the main element.
      if (target !== evt.target) {
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
