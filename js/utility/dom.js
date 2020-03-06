/**
 *  DOM helper functions.
 */

const findParentByClassname = (element, classname) => {
  while(element && !element.classList.contains(classname)) {
    element = element.parentElement
  }
  return element
}

const findParentDraggable = (target) => {
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

export { findParentByClassname, findParentDraggable }
