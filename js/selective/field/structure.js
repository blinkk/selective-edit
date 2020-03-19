/**
 * Structure fields for controlling the flow of fields.
 */

import * as extend from 'deep-extend'
import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import { autoConfig } from '../../utility/config'
import AutoFields from '../autoFields'
import FieldsRewrite from '../fields/fields'
import Field from './field'


export class GroupField extends Field {
  constructor(config, globalConfig) {
    super(config, globalConfig)
    this.fieldType = 'group'
    this.ignoreLocalize = true
    this.fields = null
    this.isExpanded = false
    this._useAutoFields = false
  }

  get isClean() {
    // If there are no fields, nothing has changed.
    if (!this.fields) {
      return true
    }

    for (const field of this.fields.fields) {
      if (!field.isClean) {
        return false
      }
    }

    return true
  }

  get value() {
    if (!this.fields) {
      return this.originalValue
    }

    return extend({}, this.originalValue, this.fields.value)
  }

  set value(value) {
    // Ignore.
  }

  _createFields(selective, data) {
    const FieldsCls = this.config.get('FieldsCls', FieldsRewrite)
    const fields = new FieldsCls(selective.fieldTypes)

    fields.updateOriginal(this.originalValue)

    let fieldConfigs = this.config.fields || []
    this._useAutoFields = fieldConfigs.length == 0

    if (this._useAutoFields) {
      // Auto guess the fields if they are not defined.
      const AutoFieldsCls = this.config.get('AutoFieldsCls', AutoFields)
      fieldConfigs = new AutoFieldsCls(this.originalValue).config['fields']
    }

    for (let fieldConfig of fieldConfigs || []) {
      fieldConfig = autoConfig(fieldConfig, this.globalConfig)
      fields.addField(fieldConfig, this.globalConfig)
    }

    for (const field of fields.fields) {
      field.updateOriginal(selective, this.originalValue)
    }

    return fields
  }

  ensureFields(selective, data) {
    if (!this.fields) {
      this.fields = this._createFields(selective, data)
    }
  }

  handleExpandToggle(evt) {
    this.isExpanded = !this.isExpanded
    this.render()
  }

  renderInput(selective, data, locale) {
    if (!this.isExpanded) {
      return ''
    }

    this.ensureFields(selective, data)

    return this.fields.template(selective, this.originalValue)
  }

  renderLabel(selective, data) {
    return html`
      <div
          class="selective__field__label selective__field__label--action selective__field__label--strong"
          @click=${this.handleExpandToggle.bind(this)}>
        <div class="selective__field__label__actions">
          <i class="material-icons">
            ${this.isExpanded ? 'expand_less' : 'expand_more'}
          </i>
          <label>${this.config.label || '(Group)'}</label>
        </div>
      </div>`
  }
}
