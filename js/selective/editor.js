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
import ClassManager from '../utility/classes'
import AutoFields from './autoFields'
import Fields from './fields/fields'

export default class Editor extends compose(ConfigMixin,)(Base) {
  constructor(containerEl, config) {
    super()
    this.containerEl = containerEl
    this.fieldTypes = new ClassManager()
    this.ruleTypes = new ClassManager()
    this.localize = false
    this._fields = null
    this._data = autoDeepObject({})

    // Needs to be defined before the config is set.
    this.template = (editor, data) => html`<div class="selective">
      ${editor.fields.template(editor, data)}
    </div>`

    this.setConfig(config)
    this.bindEvents()
    this.render()
  }

  get config() {
    return this.getConfig()
  }

  get data() {
    return this._data
  }

  get fields() {
    if (!this._fields) {
      const FieldsCls = this.getConfig().get('FieldsCls', Fields)
      this._fields = new FieldsCls(this.fieldTypes, this.ruleTypes)
    }
    return this._fields
  }

  get isClean() {
    return this.fields.isClean
  }

  get isValid() {
    return this.fields.isValid
  }

  get selfRender() {
    // Determine if we are self rendering or being externally rendered.
    return this.containerEl !== null
  }

  get value() {
    return this.fields.value
  }

  set data(value) {
    this._data = autoDeepObject(value)
    this.render()
    return this._data
  }

  addField(...args) {
    this.fields.addField(...args)
  }

  addFieldType(key, FieldCls) {
    this.fieldTypes.setClass(key, FieldCls)
    this.render()
  }

  addFieldTypes(fieldTypes) {
    this.fieldTypes.setClasses(fieldTypes)
    this.render()
  }

  addRuleType(key, RuleCls) {
    this.ruleTypes.setClass(key, RuleCls)
    this.render()
  }

  addRuleTypes(ruleTypes) {
    this.ruleTypes.setClasses(ruleTypes)
    this.render()
  }

  bindEvents() {
    // Skip binding if externally rendering.
    if (!this.selfRender) {
      return
    }

    // Allow triggering a re-render.
    document.addEventListener('selective.render', () => {
      this.render()
    })
  }

  guessFields() {
    const AutoFieldsCls = this.config.get('AutoFieldsCls', AutoFields)
    const autoFields = new AutoFieldsCls(this.data.obj)
    return autoFields.config
  }

  postRender(containerEl) {
    // Allow for using without explicitly calling the render
    // This supports external rendering using the template.
    containerEl = containerEl || this.containerEl

    // Initialize any new fields.
    this.fieldTypes.forEachFunc('initialize', containerEl)

    // Trigger any field specific actions.
    this.fields.postRender(containerEl)
  }

  render() {
    // Do nothing when not self rendering.
    if (!this.selfRender) {
      return
    }

    render(this.template(this, this.data), this.containerEl)
    this.postRender()

    document.dispatchEvent(new CustomEvent('selective.render.complete'))
  }

  setConfig(value) {
    super.setConfig(value)

    if (value) {
      // Reset the fields and add new field configs.
      this.fields.reset()

      for (const fieldConfig of this.getConfig().get('fields', [])) {
        this.addField(fieldConfig)
      }

      this.render()
    }
  }

  update(value) {
    this.data = extend({}, this.data.obj, value)
    return this.data
  }
}
