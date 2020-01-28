/**
 * Selective content editor.
 *
 * Editor for taking structured data and creating a UI for editing portions of
 * the data.
 */

import {
 html,
 render,
} from 'lit-html'
import ConfigMixin from '../mixin/config'
import { autoDeepObject } from '../utility/deepObject'
import { Base, compose } from '../utility/compose'
import { defaultFields } from './field'
import Fields from './fields'
import FieldTypes from './fieldTypes'

export default class Editor extends compose(ConfigMixin,)(Base) {
  constructor(containerEl, config) {
    super()
    this._fieldTypes = new FieldTypes()
    this._fields = null
    this._data = autoDeepObject({})

    // Start with built-in field types.
    // Can be overwritten by adding fields with the same `fieldType`.
    for (const key of Object.keys(defaultFields)) {
      this._fieldTypes.addFieldType(key, defaultFields[key])
    }

    this.containerEl = containerEl
    this.setConfig(config)

    this.template = (editor, data) => html`<div class="selective">
      ${editor.fields.template(editor, data)}
    </div>`

    // Allow triggering a re-render.
    this.containerEl.addEventListener('selective.render', () => {
      this.render()
    })

    this.render()
  }

  get data() {
    return this._data
  }

  get fields() {
    if (!this._fields) {
      const FieldsCls = this.getConfig().get('FieldsCls', Fields)
      this._fields = new FieldsCls(this._fieldTypes)
    }
    return this._fields
  }

  addField(...args) {
    this.fields.addField(...args)
  }

  render() {
    render(this.template(this, this.data), this.containerEl)

    // Initialize any new fields.
    this._fieldTypes.initialize(this.containerEl)

    // Trigger any field specific actions.
    this.fields.postRender(this.containerEl)
  }

  setConfig(value) {
    super.setConfig(value)

    if (value) {
      // Reset the fields and add new field configs.
      this.fields.reset()

      for (const fieldConfig of this.getConfig().get('fields', [])) {
        this.addField(fieldConfig)
      }
    }
  }

  set data(value) {
    this._data = autoDeepObject(value)
    this.render()
    return this._data
  }
}
