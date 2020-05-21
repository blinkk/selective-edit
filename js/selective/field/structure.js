/**
 * Structure fields for controlling the flow of fields.
 */

import * as extend from 'deep-extend'
import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import { autoConfig } from '../../utility/config'
import { findParentByClassname } from '../../utility/dom'
import AutoFields from '../autoFields'
import Fields from '../fields/fields'
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
    const FieldsCls = this.config.get('FieldsCls', Fields)
    const fields = new FieldsCls(selective.fieldTypes)

    fields.updateOriginal(selective, this.originalValue)

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
        <div class="selective__field__actions">
          <i class="material-icons">
            ${this.isExpanded ? 'expand_less' : 'expand_more'}
          </i>
          <label>${this.config.label || '(Group)'}</label>
        </div>
      </div>`
  }
}


export class VariantField extends Field {
  constructor(config, globalConfig) {
    super(config, globalConfig)
    this.fieldType = 'variant'
    this.ignoreLocalize = true
    this.variant = null
    this.fields = null
    this._useAutoFields = false
  }

  get isClean() {
    // Check for the clean data.
    if (!this.isDataClean) {
      return false
    }

    // Check for changes to the variant.
    if (this.originalValue && this.originalValue._variant != this.variant) {
      return false
    }

    return true
  }

  get isDataClean() {
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

    return extend({}, this.originalValue, this.fields.value, {
      '_variant': this.variant,
    })
  }

  set value(value) {
    // Ignore.
  }

  _createFields(selective, data, variant) {
    if (!variant) {
      return null
    }

    const FieldsCls = this.config.get('FieldsCls', Fields)
    const fields = new FieldsCls(selective.fieldTypes)

    fields.updateOriginal(selective, this.originalValue)

    const variantConfig = this.config.variants[variant] || {}
    let fieldConfigs = variantConfig.fields || []
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
    // Determine the type of variant if not initialized.
    // Need to wait until the original value is initialized from data.
    if (!this.variant && this.originalValue) {
      this.variant = this.originalValue._variant || this.config.default
      this.fields = null
    }

    if (!this.fields) {
      this.fields = this._createFields(selective, data, this.variant)
    }
  }

  handleVariantClick(evt) {
    const target = findParentByClassname(evt.target, 'selective__variant__variant')
    const variant = target.dataset.variant

    if (variant == this.variant) {
      return
    }

    this.variant = variant
    this.fields = null
    this.render()
  }

  renderInput(selective, data, locale) {
    this.ensureFields(selective, data)

    let fieldsOutput = ''
    if (this.fields) {
      fieldsOutput = this.fields.template(selective, this.originalValue)
    }

    return html`
      ${this.renderVariants(selective, data, locale)}
      ${fieldsOutput}`
  }

  renderVariants(selective, data, locale) {
    const variants = this.config.variants
    const variantKeys = Object.keys(variants).sort()

    return html`
      <div class="selective__variant__variants">
        <label>${this.config.variant_label || 'Variant'}:</label>
        ${repeat(
          variantKeys,
          (variantKey) => variantKey,
          (variantKey, index) => html`
            <button
                class="selective__variant__variant ${this.variant == variantKey ? 'selective__variant__variant--selected selective__button--primary' : ''}"
                data-variant="${variantKey}"
                ?disabled=${this.variant != variantKey && !this.isDataClean}
                @click=${this.handleVariantClick.bind(this)}>
              ${variants[variantKey].label || variantKey}
            </button>
          `)}
      </div>`
  }
}
