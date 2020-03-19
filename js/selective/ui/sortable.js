/**
 * UI elements for the working with sortables.
 */

import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import {
  findParentDraggable,
} from '../../utility/dom'
import UI from './ui'


export class SortableUI extends UI {
  constructor(config) {
    super(config)

    this._dragOriginElement = null
  }

  get transferType() {
    return `selective/${this.getUid()}`
  }

  _dragTarget(evt) {
    const target = findParentDraggable(evt.target)

    if (!this._dragOriginElement || !target) {
      return false
    }

    if (evt.dataTransfer.types.includes(this.transferType)) {
      evt.preventDefault()
      evt.stopPropagation()
      return target
    }
  }

  handleDragStart(evt) {
    evt.stopPropagation()

    const target = findParentDraggable(evt.target)
    this._dragOriginElement = target

    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('text/plain', evt.target.dataset.index)

    // Use a custom transfer type to contain drags just to this list.
    evt.dataTransfer.setData(this.transferType, evt.target.dataset.index)

    // Allow for custom preview for dragging.
    const previewEl = target.querySelector('.selective__sortable__preview')
    if (previewEl) {
      evt.dataTransfer.setDragImage(previewEl, 0, 0)
    }
  }

  handleDragEnter(evt) {
    const target = this._dragTarget(evt)

    if (!target) {
      return
    }

    // Show that the element is hovering.
    target.classList.add('selective__sortable--hover')

    const currentIndex = parseInt(target.dataset.index)
    const startIndex = parseInt(this._dragOriginElement.dataset.index)

    // Hovering over self, ignore.
    if (currentIndex == startIndex) {
      return
    }

    if (currentIndex < startIndex) {
      target.classList.add('selective__sortable--above')
    } else {
      target.classList.add('selective__sortable--below')
    }
  }

  handleDragLeave(evt) {
    const target = this._dragTarget(evt)
    if (!target) {
      return
    }

    //  Make sure that the event target comes from the main element.
    if (target !== evt.target) {
      return
    }

    // No longer hovering.
    target.classList.remove(
      'selective__sortable--hover', 'selective__sortable--above',
      'selective__sortable--below')
  }

  handleDragOver(evt) {
    // Find the target and prevent the defaults.
    this._dragTarget(evt)
  }

  handleDrop(evt) {
    const target = this._dragTarget(evt)
    if (!target) {
      return
    }

    const currentIndex = parseInt(target.dataset.index)
    const startIndex = parseInt(evt.dataTransfer.getData("text/plain"))

    // No longer hovering.
    target.classList.remove(
      'sortable--hover', 'sortable--above', 'sortable--below')

    // Reset the drag element.
    this._dragOriginElement = null

    // No longer hovering.
    target.classList.remove(
      'selective__sortable--hover', 'selective__sortable--above',
      'selective__sortable--below')

    this.listeners.trigger('sort', startIndex, currentIndex)
  }
}
