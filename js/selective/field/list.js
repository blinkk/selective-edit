/**
 * List fields for controlling the lists of fields.
 */

import * as extend from 'deep-extend'
import { html } from 'lit-html'
import { repeat } from 'lit-html/directives/repeat'
import {
  Base,
  compose,
} from '../../utility/compose'
import ConfigMixin from '../../mixin/config'
import UidMixin from '../../mixin/uid'
import { autoConfig } from '../../utility/config'
import { findParentByClassname } from '../../utility/dom'
import { autoDeepObject } from '../../utility/deepObject'
import AutoFields from '../autoFields'
import Fields from '../fields/fields'
import { SortableUI } from '../ui/sortable'
import Field from './field'


const COMMON_PREVIEW_KEYS = [
  // First match wins.
  'title', 'label', 'subtitle', 'type', 'text', 'key', 'id', 'url', 'value',
  'doc', 'partial',
]
const VIDEO_EXT = [
  // Video extensions.
  'mp4', 'webm',
]


export class ListField extends Field {
  constructor(ruleTypes, config, globalConfig) {
    super(ruleTypes, config, globalConfig)
    this.fieldType = 'list'
    this.isLocalized = true

    this._listItems = {}
    this._useAutoFields = false

    this._sortableUi = new SortableUI()
    this._sortableUi.listeners.add('sort', this.handleSort.bind(this))
  }

  _createFields(fieldTypes, ruleTypes, config) {
    const FieldsCls = this.config.get('FieldsCls', Fields)
    return new FieldsCls(fieldTypes, ruleTypes, config)
  }

  _createItems(selective, data, locale) {
    const value = this.getValueForLocale(locale) || []
    let listItems = this._getListItemsForLocale(locale)

    // Null is used to make sure that the list is not just empty.
    // Empty list --> deleted all items.
    if (listItems != null || !value.length) {
      return
    }

    listItems = []

    // Use the config to find the field configs.
    let fieldConfigs = this.config.get('fields', [])
    this._useAutoFields = !fieldConfigs.length

    for (const itemData of value) {
      const fields = this._createFields(
        selective.fieldTypes, selective.ruleTypes)
      fields.updateOriginal(selective, itemData)

      // Auto guess the fields if they are not defined.
      if (this._useAutoFields) {
        const AutoFieldsCls = this.config.get('AutoFieldsCls', AutoFields)
        fieldConfigs = new AutoFieldsCls(itemData).config['fields']
      }

      // Create the fields based on the config.
      for (let fieldConfig of fieldConfigs || []) {
        fieldConfig = autoConfig(fieldConfig, this.globalConfig)
        fieldConfig.set('parentKey', this.fullKey)

        // Mark the auto fields.
        if (this._useAutoFields) {
          fieldConfig.set('isGuessed', true)
        }

        fields.addField(fieldConfig, this.globalConfig)
      }

      // When an is not expanded it does not get the value
      // updated correctly so we need to manually call the data update.
      for (const field of fields.fields) {
        field.updateOriginal(selective, itemData || fields.defaultValue)
      }

      listItems.push(new ListItem({
        'fields': fieldConfigs,
      }, fields))
    }

    this._setListItemsForLocale(locale, listItems)

    // Trigger a new render to make sure the expand/collapse buttons show.
    if (listItems.length > 1 || !this.useSimpleField) {
      this.render()
    }
  }

  _createPreviewTemplate(url) {
    if (url.startsWith('http') || url.startsWith('//')) {
      for (const videoExt of VIDEO_EXT) {
        if (url.endsWith(`.${videoExt}`)) {
          return html`<video playsinline disableremoteplayback muted autoplay loop>
            <source src="${url}" />
          </video>`
        }
      }
      return html`<img src="${url}" class="selective__image__fingernail">`
    } else if (url.startsWith('/')) {
      return html`<img src="${url}" class="selective__image__fingernail">`
    }
    return url
  }

  _getListItemsForLocale(locale) {
    const localeKey = this.keyForLocale(locale)

    if (!this._listItems[localeKey]) {
      // Need to be able to tell when the current value is an empty array.
      // This would happen when you delete all items in a list.
      return null
    }

    return [...this._listItems[localeKey]]
  }

  _guessPreviewForObject(obj) {
    const deepObj = autoDeepObject(obj)
    let previewValue = obj
    for (const key of COMMON_PREVIEW_KEYS) {
      previewValue = deepObj.get(key)
      if (!previewValue) {
        // Also check for translation marked keys.
        previewValue = deepObj.get(`${key}@`)
      }

      if (previewValue) {
        break
      }
    }

    // If the matched preview is also an object try again.
    if (typeof previewValue == 'object') {
      return this._guessPreviewForObject(previewValue)
    }

    return previewValue
  }

  _setListItemsForLocale(locale, listItems) {
    const localeKey = this.keyForLocale(locale)
    this._listItems[localeKey] = listItems
  }

  get isClean() {
    // When locked, the field is automatically considered dirty.
    if (this._isLocked) {
      return false
    }

    for (const locale of this.locales) {
      const originalValue = this.getOriginalValueForLocale(locale)
      const listItems = this._getListItemsForLocale(locale)

      // Check for a change in length.
      if (Array.isArray(listItems) && originalValue && originalValue.length != listItems.length) {
        return false
      }

      for (const item of listItems || []) {
        if (!item.fields.isClean) {
          return false
        }
      }
    }

    return true
  }

  // Use the simple field only when there is not a preview field.
  get useSimpleField() {
    return !Boolean(this.config.get('preview_field'))
  }

  get localizedValues() {
    const localizedValues = {}

    for (const key of Object.keys(this._listItems)) {
      const value = []
      for (const item of this._listItems[key]) {
        value.push(item.fields.value)
      }
      localizedValues[key] = value
    }

    // Set after the localized values are updated.
    localizedValues[this.key] = this.value

    return extend({}, this._originalValues, localizedValues)
  }

  get value() {
    const listItems = this._getListItemsForLocale()
    if (listItems == null) {
      return this.originalValue || []
    }

    const value = []
    for (const item of listItems) {
      value.push(item.fields.value)
    }

    return value
  }

  set value(value) {
    // no-op
  }

  guessPreview(item, index, defaultPreview) {
    const defaultPreviewField = this.config.get('preview_field')
    const previewType = this.config.get('preview_type', 'text')
    const previewField = item.config.preview_field
    let previewValue = item.fields.value
    const dataDeepObject = autoDeepObject(previewValue)

    if (previewField || defaultPreviewField) {
      previewValue = dataDeepObject.get(previewField || defaultPreviewField)
    }

    // Do not try to show preview for complex values.
    if (typeof previewValue == 'object') {
      previewValue = null
    }

    if (previewType == 'image' && previewValue) {
      return this._createPreviewTemplate(previewValue)
    }

    if (previewValue || defaultPreview) {
      return previewValue || defaultPreview
    }

    previewValue = this._guessPreviewForObject(dataDeepObject)
    if (previewValue) {
      return previewValue
    }

    return `{ Item ${index + 1} }`
  }

  handleAddItem(evt, selective) {
    const locale = evt.target.dataset.locale
    const listItems = this._getListItemsForLocale(locale) || []
    const fields = this._createFields(
      selective.fieldTypes, selective.ruleTypes)

    // Use the field config for the list items to create the correct field types.
    let fieldConfigs = this.config.get('fields', [])

    // If no field configs, use the last item config if availble.
    if (!fieldConfigs.length && listItems.length > 0) {
      fieldConfigs = listItems[listItems.length-1].config.fields
    }

    // Create the fields based on the config.
    for (let fieldConfig of fieldConfigs || []) {
      fieldConfig = autoConfig(fieldConfig, this.globalConfig)
      fieldConfig.set('parentKey', this.fullKey)

      // Mark the auto fields.
      if (this._useAutoFields) {
        fieldConfig.set('isGuessed', true)
      }

      fields.addField(fieldConfig, this.globalConfig)
    }

    fields.updateOriginal(selective, fields.defaultValue)

    const listItem = new ListItem({
      'fields': fieldConfigs,
    }, fields)
    listItem.isExpanded = true
    listItems.push(listItem)

    this._setListItemsForLocale(locale, listItems)

    // TODO: Focus on the input after rendering.

    this.render()
  }

  handleCollapseAll(evt) {
    const locale = evt.target.dataset.locale
    const listItems = this._getListItemsForLocale(locale) || []

    for (const item of listItems) {
      item.isExpanded = false
    }

    this.render()
  }

  handleCollapseItem(evt) {
    const uid = evt.target.dataset.itemUid
    const locale = evt.target.dataset.locale
    const listItems = this._getListItemsForLocale(locale) || []

    for (const item of listItems) {
      if (item.uid == uid) {
        item.isExpanded = false
        break
      }
    }

    this.render()
  }

  handleDeleteItem(evt) {
    const target = findParentByClassname(evt.target, 'selective__list__item__delete')
    const uid = target.dataset.itemUid
    const locale = target.dataset.locale
    const listItems = this._getListItemsForLocale(locale) || []

    let deleteIndex = -1
    for (const index in listItems) {
      if (listItems[index].uid == uid) {
        deleteIndex = index
        break
      }
    }

    if (deleteIndex > -1) {
      listItems.splice(deleteIndex, 1)

      // Lock the fields to prevent the values from being updated at the same
      // time as the original value.
      const downstreamItems = listItems.slice(deleteIndex)
      for (const listItem of downstreamItems) {
        listItem.fields.lock()
      }
      this.lock()

      this._setListItemsForLocale(locale, listItems)

      // Unlock fields after rendering is complete to let the values be updated when clean.
      document.addEventListener('selective.unlock', () => {
        for (const listItem of downstreamItems) {
          listItem.fields.unlock()
        }
        this.unlock()
        this.render()
      }, {
        once: true,
      })

      // Prevent the delete from bubbling.
      evt.stopPropagation()

      this.render()
    }
  }

  handleExpandAll(evt) {
    const locale = evt.target.dataset.locale
    const listItems = this._getListItemsForLocale(locale) || []

    for (const item of listItems) {
      item.isExpanded = true
    }

    this.render()
  }

  handleExpandItem(evt) {
    let target = findParentByClassname(evt.target, 'selective__list__item__preview')
    // Alternative label.
    if (!target) {
      target = findParentByClassname(evt.target, 'selective__list__item__label')
    }
    const uid = target.dataset.itemUid
    const locale = target.dataset.locale
    const listItems = this._getListItemsForLocale(locale) || []

    for (const item of listItems) {
      if (item.uid == uid) {
        item.isExpanded = true
        break
      }
    }

    this.render()
  }

  handleSort(startIndex, endIndex, dropTarget) {
    // Find the locale from the drop target.
    const target = findParentByClassname(dropTarget, 'selective__list__item')
    const locale = target.dataset.locale

    // Rework the arrays to have the items in the correct position.
    const newListItems = []
    const oldListItems = this._getListItemsForLocale(locale) || []
    const maxIndex = Math.max(endIndex, startIndex)
    const minIndex = Math.min(endIndex, startIndex)

    // Determine which direction to shift misplaced items.
    let modifier = 1
    if (startIndex > endIndex) {
      modifier = -1
    }

    for (let i = 0; i < oldListItems.length; i++) {
      if (i < minIndex || i > maxIndex) {
        // Leave in the same order.
        newListItems[i] = oldListItems[i]

        newListItems[i].fields.lock()
      } else if (i == endIndex) {
        // This element is being moved to, place the moved value here.
        newListItems[i] = oldListItems[startIndex]

        // Lock the fields to prevent the values from being updated at the same
        // time as the original value.
        newListItems[i].fields.lock()
      } else {
        // Shift the old index using the modifier to determine direction.
        newListItems[i] = oldListItems[i+modifier]

        // Lock the fields to prevent the values from being updated at the same
        // time as the original value.
        newListItems[i].fields.lock()
      }
    }

    this._setListItemsForLocale(locale, newListItems)
    this.lock()

    // Unlock fields after saving is complete to let the values be updated when clean.
    document.addEventListener('selective.unlock', () => {
      for (const item of newListItems) {
        item.fields.unlock()
      }
      this.unlock()
      this.render()
    }, {
      once: true,
    })

    this.render()
  }

  // TODO: Remove? Directives?
  postRender(containerEl) {
    for (const localeKey of Object.keys(this._listItems)) {
      const listItems = this._listItems[localeKey]

      for (const listItem of listItems) {
        listItem.fields.postRender(containerEl)
      }
    }
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

    // Check list items for specific conditions.
    const listItems = this._getListItemsForLocale(locale) || []
    let areSimpleFields = true
    let areAllExpanded = true
    let areAllCollapsed = true
    for (const item of listItems) {
      if (!item.fields.isSimpleField || !this.useSimpleField) {
        areSimpleFields = false
      }
      if (!item.isExpanded) {
        areAllExpanded = false
      }
      if (item.isExpanded) {
        areAllCollapsed = false
      }
    }

    if (areSimpleFields) {
      return ''
    }

    actions.push(html`
      <div
          ?disabled=${areAllExpanded}
          class="selective__action selective__action__expand"
          data-locale=${locale || ''}
          @click=${this.handleExpandAll.bind(this)}>
        <i class="material-icons">unfold_more</i>
      </div>`)

    actions.push(html`
      <div
          ?disabled=${areAllCollapsed}
          class="selective__action selective__action__collapse"
          data-locale=${locale || ''}
          @click=${this.handleCollapseAll.bind(this)}>
        <i class="material-icons">unfold_less</i>
      </div>`)

    return html`<div class="selective__actions">
      ${actions}
    </div>`
  }

  renderInput(selective, data, locale) {
    this._createItems(selective, data, locale)
    const items = this._getListItemsForLocale(locale) || []
    const origValue = this.getOriginalValueForLocale(locale) || []
    const origValueLen = origValue.length

    return html`
      <div class="selective__list">
        ${repeat(
          items,
          (item) => item.uid,
          (item, index) => this.renderItem(
            selective, index < origValueLen ? origValue[index] : item.fields.defaultValue, item, index, locale)
        )}
        ${items.length < 1 ? this.renderItemEmpty(selective, data, 0, locale) : ''}
      </div>
      ${this.renderActionsFooter(selective, data, locale)}
      ${this.renderErrors(selective, data, locale)}`
  }

  renderItem(selective, data, item, index, locale) {
    if (item.fields.isSimpleField && this.useSimpleField) {
      return this.renderItemSimple(selective, data, item, index, locale)
    } else if (item.isExpanded) {
      return this.renderItemExpanded(selective, data, item, index, locale)
    }
    return this.renderItemCollapsed(selective, data, item, index, locale)
  }

  renderItemCollapsed(selective, data, item, index, locale) {
    item.fields.updateOriginal(selective, data, true)

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
        ${this.renderPreview(selective, data, item, index, locale)}
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

  renderItemEmpty(selective, data, index, locale) {
    return html`
      <div class="selective__list__item selective__list__item--empty"
          data-index=${index}
          data-locale=${locale || ''}>
        ${this.config.get('emptyLabel', '{ Empty }')}
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
      <div class="selective__field__actions__wrapper">
        <div class="${this.getClassesForLabel()}">
          ${this.renderIconError(selective, data)}
          <label>${this.config.label}</label>
        </div>
        ${this.renderActionsHeader(selective, data)}
      </div>`
  }

  renderPreview(selective, data, item, index, locale) {
    return html`<div
        class="selective__list__item__preview"
        data-item-uid=${item.uid}
        data-locale=${locale || ''}
        @click=${this.handleExpandItem.bind(this)}>
      ${this.guessPreview(item, index)}
    </div>`
  }
}

export class ListItem extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(config, fields) {
    super()

    this.setConfig(config)

    this.fields = fields
    this.isExpanded = this.isDefaultExpanded
  }

  get config() {
    return this.getConfig()
  }

  get isDefaultExpanded() {
    // Check the fields in the list item to see if they match the linked fields.
    for (const field of this.fields.fields) {
      const fullKey = field.fullKey
      const linkedFields = field.config.get('linkedFieldsFunc', () => [])()
      for (const linkedField of linkedFields) {
        if (linkedField.startsWith(fullKey)) {
          return true
        }
      }
    }
    return false
  }

  get uid() {
    return this.getUid()
  }
}
