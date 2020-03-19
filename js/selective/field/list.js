/**
 * List fields for controlling the lists of fields.
 */

import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import {
  Base,
  compose,
} from '../../utility/compose'
import ConfigMixin from '../../mixin/config'
import UidMixin from '../../mixin/uid'
import { autoConfig } from '../../utility/config'
import { autoDeepObject } from '../../utility/deepObject'
import AutoFields from '../autoFields'
import FieldsRewrite from '../fields/fields'
import { SortableUI } from '../ui/sortable'
import Field from './field'


export class ListField extends Field {
  constructor(config, globalConfig) {
    super(config, globalConfig)
    this.fieldType = 'list'

    this._listItems = {}
    this._useAutoFields = false

    this._sortableUi = new SortableUI()
    this._sortableUi.listeners.add('sort', this.handleSort.bind(this))
  }

  _createFields(fieldTypes, config) {
    const FieldsCls = this.config.get('FieldsCls', FieldsRewrite)
    return new FieldsCls(fieldTypes, config)
  }

  _createItems(selective, data, locale) {
    const value = this.getValueForLocale(locale) || []
    const localeKey = this.keyForLocale(locale)

    if (this._listItems[localeKey] != null || !value.length) {
      return
    }

    // Use the config to find the field configs.
    let fieldConfigs = this.config.get('fields', [])
    this._useAutoFields = !fieldConfigs.length

    const items = []

    for (const itemData of value) {
      const fields = this._createFields(selective.fieldTypes)
      fields.updateOriginal(selective, itemData)

      // Auto guess the fields if they are not defined.
      if (this._useAutoFields) {
        const AutoFieldsCls = this.config.get('AutoFieldsCls', AutoFields)
        fieldConfigs = new AutoFieldsCls(this.originalValue).config['fields']
      }

      // Create the fields based on the config.
      for (let fieldConfig of fieldConfigs || []) {
        fieldConfig = autoConfig(fieldConfig, this.extendedConfig)
        fields.addField(fieldConfig, this.extendedConfig)
      }

      // When an is not expanded it does not get the value
      // updated correctly so we need to manually call the data update.
      for (const field of fields.fields) {
        field.updateOriginal(selective, itemData || {})
      }

      items.push(new ListItem({
        'fields': fieldConfigs,
      }, fields))
    }

    this._listItems[localeKey] = items
  }

  _getListItemsForLocale(locale) {
    const localeKey = this.keyForLocale(locale)
    return this._listItems[localeKey]
  }

  handleAddItem(evt, selective) {
    const locale = evt.target.dataset.locale
    const listItems = this._getListItemsForLocale(locale)
    const fields = this._createFields(selective.fieldTypes)

    // Use the field config for the list items to create the correct field types.
    let fieldConfigs = this.config.get('fields', [])

    // If no field configs, use the last item config if availble.
    if (!fieldConfigs.length && listItems.length > 0) {
      fieldConfigs = listItems[listItems.length-1].config.fields
    }

    // Create the fields based on the config.
    for (let fieldConfig of fieldConfigs || []) {
      fieldConfig = autoConfig(fieldConfig, this.extendedConfig)
      fields.addField(fieldConfig, this.extendedConfig)
    }

    // If there is multiple fields it should be an object.
    if (fieldConfigs.length > 1) {
      fields.updateOriginal({})
    } else {
      fields.updateOriginal('')
    }

    const listItem = new ListItem({
      'fields': fieldConfigs,
    }, fields)
    listItem.isExpanded = true
    listItems.push(listItem)

    // TODO: Focus on the input after rendering.

    this.render()
  }

  handleCollapseAll(evt) {
    const locale = evt.target.dataset.locale
    const listItems = this._getListItemsForLocale(locale)

    for (const item of listItems) {
      item.isExpanded = false
    }

    this.render()
  }

  handleCollapseItem(evt) {
    const uid = evt.target.dataset.itemUid
    const locale = evt.target.dataset.locale
    const listItems = this._getListItemsForLocale(locale)

    for (const item of listItems) {
      if (item.uid == uid) {
        item.isExpanded = false
        break
      }
    }

    this.render()
  }

  handleExpandAll(evt) {
    const locale = evt.target.dataset.locale
    const listItems = this._getListItemsForLocale(locale)

    for (const item of listItems) {
      item.isExpanded = true
    }

    this.render()
  }

  handleExpandItem(evt) {
    const uid = evt.target.dataset.itemUid
    const locale = evt.target.dataset.locale
    const listItems = this._getListItemsForLocale(locale)

    for (const item of listItems) {
      if (item.uid == uid) {
        item.isExpanded = true
        break
      }
    }

    this.render()
  }

  handleDeleteItem(evt) {
    console.log('TODO: delete item');
  }

  handleSort(startIndex, endIndex) {
    console.log('TODO: sort', startIndex, endIndex);
  }

  renderActionsFooter(selective, data, locale) {
    return html`<div class="selective__actions">
      <button
          data-locale=${locale || ''}
          @click=${(evt) => {this.handleAddItem(evt, selective)}}>
        Add
      </button>
    </div>`
  }

  renderActionsHeader(selective, data, locale) {
    const isCollapsed = false
    const isExpanded = false
    const actions = []

    // Determine if no actions should be shown.
    const value = this.getValueForLocale(locale) || []
    if (!value.length) {
      return ''
    }

    actions.push(html`
      <button
          ?disabled=${isExpanded}
          class="selective__action__expand"
          data-locale=${locale || ''}
          @click=${this.handleExpandAll.bind(this)}>
        Expand All
      </button>`)

    actions.push(html`
      <button
          ?disabled=${isCollapsed}
          class="selective__action__collapse"
          data-locale=${locale || ''}
          @click=${this.handleCollapseAll.bind(this)}>
        Collapse All
      </button>`)

    return html`<div class="selective__actions">
      ${actions}
    </div>`
  }

  renderInput(selective, data, locale) {
    this._createItems(selective, data, locale)
    const localeKey = this.keyForLocale(locale)
    const items = this._listItems[localeKey]
    const value = this.getValueForLocale(locale) || []

    return html`
      <div class="selective__list">
        ${repeat(
          items,
          (item) => item.uid,
          (item, index) => this.renderItem(
            selective, value[index], item, index, locale)
        )}
      </div>
      ${this.renderActionsFooter(selective, data, locale)}`
  }

  renderItem(selective, data, item, index, locale) {
    if (item.fields.isSimpleField) {
      return this.renderItemSimple(selective, data, item, index, locale)
    } else if (item.isExpanded) {
      return this.renderItemExpanded(selective, data, item, index, locale)
    }
    return this.renderItemCollapsed(selective, data, item, index, locale)
  }

  renderItemCollapsed(selective, data, item, index, locale) {
    return html`
      <div class="selective__list__item selective__list__item--collapsed selective__sortable"
          draggable="true"
          data-index=${index}
          data-locale=${locale || ''}
          @dragenter=${this._sortableUi.handleDragEnter.bind(this._sortableUi)}
          @dragleave=${this._sortableUi.handleDragLeave.bind(this._sortableUi)}
          @dragover=${this._sortableUi.handleDragOver.bind(this._sortableUi)}
          @dragstart=${this._sortableUi.handleDragStart.bind(this._sortableUi)}
          @drop=${this._sortableUi.handleDrop.bind(this._sortableUi)}>
        <div class="selective__list__item__drag"><i class="material-icons">drag_indicator</i></div>
        <div
            class="selective__list__item__preview"
            data-item-uid=${item.uid}
            data-locale=${locale || ''}
            @click=${this.handleExpandItem.bind(this)}>
          ${this.renderPreview(item, index)}
        </div>
        <div
            class="selective__list__item__delete"
            data-item-uid=${item.uid}
            data-locale=${locale || ''}
            @click=${this.handleDeleteItem.bind(this)}
            title="Delete item">
          <i class="material-icons">delete</i>
        </div>
      </div>`
  }

  renderItemExpanded(selective, data, item, index, locale) {
    return html`
      <div class="selective__list__item selective__sortable"
          draggable="true"
          data-index=${index}
          data-locale=${locale || ''}
          @dragenter=${this._sortableUi.handleDragEnter.bind(this._sortableUi)}
          @dragleave=${this._sortableUi.handleDragLeave.bind(this._sortableUi)}
          @dragover=${this._sortableUi.handleDragOver.bind(this._sortableUi)}
          @dragstart=${this._sortableUi.handleDragStart.bind(this._sortableUi)}
          @drop=${this._sortableUi.handleDrop.bind(this._sortableUi)}>
        <div class="selective__list__fields__label ${!item.fields.label ? 'selective__list__fields__label--empty' : ''}"
            data-item-uid=${item.uid}
            data-locale=${locale || ''}
            @click=${this.handleCollapseItem.bind(this)}>
          ${item.fields.label}
        </div>
        ${item.fields.template(selective, data)}
      </div>`
  }

  renderItemSimple(selective, data, item, index, locale) {
    return html`
      <div class="selective__list__item selective__list__item--simple selective__sortable"
          draggable="true"
          data-index=${index}
          data-locale=${locale || ''}
          @dragenter=${this._sortableUi.handleDragEnter.bind(this._sortableUi)}
          @dragleave=${this._sortableUi.handleDragLeave.bind(this._sortableUi)}
          @dragover=${this._sortableUi.handleDragOver.bind(this._sortableUi)}
          @dragstart=${this._sortableUi.handleDragStart.bind(this._sortableUi)}
          @drop=${this._sortableUi.handleDrop.bind(this._sortableUi)}>
        <div class="selective__list__item__drag">
          <i class="material-icons">drag_indicator</i>
        </div>
        ${item.fields.template(selective, data)}
        <div
            class="selective__list__item__delete"
            data-item-uid=${item.uid}
            data-locale=${locale || ''}
            @click=${this.handleDeleteItem.bind(this)}
            title="Delete item">
          <i class="material-icons">delete</i>
        </div>
      </div>`
  }

  renderLabel(selective, data) {
    return html`
      <div class="selective__actions__wrapper">
        <div class="selective__field__label">
          <label>${this.config.label}</label>
        </div>
        ${this.renderActionsHeader(selective, data)}
      </div>`
  }

  renderPreview(item, index) {
    const defaultPreviewField = this.config.get('preview_field')
    const previewField = item.config.preview_field
    let previewValue = item.fields.value

    if (previewField || defaultPreviewField) {
      previewValue = autoDeepObject(previewValue).get(previewField || defaultPreviewField)
    }

    // Do not try to show preview for complex values.
    if (typeof previewValue == 'object') {
      previewValue = null
    }

    return previewValue || `Item ${index + 1}`
  }
}

export default class ListItem extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(config, fields) {
    super()

    this.setConfig(config)

    this.fields = fields
    this.expanded = false
  }

  get config() {
    return this.getConfig()
  }

  get uid() {
    return this.getUid()
  }
}
