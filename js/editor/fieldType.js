/**
 * Field Type for the editor.
 */

import Config from '../utility/config'
import {html, render} from 'lit-html'

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
    if (!(value instanceof Config)) {
      value = new Config(value || {})
    }
    this._config = value
  }

  render(element, config, value) {
    render(this.template(config.id, config.label, value), element)
  }
}


export const listFieldType = new FieldType('list', {}, (id, label, value) => html`<div class="field field__list">
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


export const markdownFieldType = new FieldType('markdown', {}, (id, label, value) => html`<div class="field field__markdown">
  <div class="field__markdown__label">${label}</div>
  <div id="${id}" class="pell">${value}</div>
</div>`)


export const textFieldType = new FieldType('text', {}, (id, label, value) => html`<div class="field field__text">
 <div class="mdc-text-field mdc-text-field--upgraded">
   <input type="text" id="${id}" class="mdc-text-field__input" value="${value}">
   <label class="mdc-floating-label" for="${id}">${label}</label>
   <div class="mdc-line-ripple"></div>
 </div>
</div>`)


export const textareaFieldType = new FieldType('textarea', {}, (id, label, value) => html`<div class="field field__textarea">
 <div class="mdc-text-field mdc-text-field--textarea mdc-text-field--fullwidth mdc-text-field--dense">
   <textarea id="${id}" class="mdc-text-field__input" rows="4">${value}</textarea>
   <label for="${id}" class="mdc-floating-label">${label}</label>
 </div>
</div>`)


export const defaultFieldTypes = [
  textFieldType,
  textareaFieldType,
  markdownFieldType,
  listFieldType,
]
