import {DeepObject, autoDeepObject} from '../../utility/deepObject';
import {Field, FieldComponent, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {SortableFieldComponent, SortableMixin} from '../../mixins/sortable';
import {TemplateResult, html} from 'lit-html';

import {Actions} from '../../utility/actions';
import {Base} from '../../mixins';
import {DataType} from '../../utility/dataType';
import {EVENT_UNLOCK} from '../events';
import {FieldsComponent} from '../fields';
import {PreviewTypes} from '../../utility/preview';
import {Types} from '../types';
import {UuidMixin} from '../../mixins/uuid';
import {classMap} from 'lit-html/directives/class-map.js';
import cloneDeep from 'lodash.clonedeep';
import {repeat} from 'lit-html/directives/repeat.js';
import stringify from 'json-stable-stringify';

export interface ListFieldConfig extends FieldConfig {
  /**
   * Label for adding more list items.
   */
  addLabel?: string;
  /**
   * Label for when the list is empty.
   */
  emptyLabel?: string;
  /**
   * Are the fields complex?
   *
   * When set to true, the list will not use the 'Simple' mode
   * for showing list items when there is only one field configured
   * in the fields config.
   */
  isComplex?: boolean;
  /**
   * Field definitions for each item in the list.
   */
  fields?: Array<FieldConfig>;
  /**
   * Preview field key.
   *
   * When showing a preview of the list items, use this key to determine
   * the value to show for the preview.
   */
  previewField?: string;
  /**
   * Preview field keys.
   *
   * When showing a preview of the list items, use these keys to determine
   * the value to show for the preview.
   */
  previewFields?: Array<string>;
  /**
   * Control how the editor displays the preview for the list items.
   */
  previewType?: PreviewTypes;
}

export interface ListFieldComponent extends FieldComponent {
  /**
   * Allow simple display for fields in the list.
   *
   * For complex fields it is better to not allow the simple view
   * since it makes the list crowded and hard to read. (ex: media field)
   */
  allowSimple: boolean;
  /**
   * Can the list add more items?
   */
  allowAdd?: boolean;
  /**
   * Can the list remove items?
   */
  allowRemove?: boolean;
  /**
   * Handle adding a new item to the list.
   * @param evt Event triggering the add.
   * @param editor Editor instance.
   * @param data Data object.
   */
  handleAddItem(evt: Event, editor: SelectiveEditor, data: DeepObject): void;
  /**
   * Event handler for deleting items.
   *
   * @param evt Click event from delete action.
   * @param index Item index being deleted.
   */
  handleDeleteItem(evt: Event, index: number): void;
  /**
   * Number of items in the list.
   */
  length: number;
}

export interface ListItemComponent {
  listField: ListFieldComponent & SortableFieldComponent;
  fields: FieldsComponent;
  /**
   * Event handler for hovering off an item.
   *
   * @param evt Event from mouse action.
   * @param index Item index.
   */
  handleHoverOffItem(evt: MouseEvent, index: number): void;
  /**
   * Event handler for hovering over an item.
   *
   * @param evt Event from mouse action.
   * @param index Item index.
   */
  handleHoverOnItem(evt: MouseEvent, index: number): void;
  isExpanded: boolean;
  template: (
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ) => TemplateResult;
  uid: string;
}

export interface ListItemConstructor {
  new (
    listField: ListFieldComponent & SortableFieldComponent,
    fields: FieldsComponent
  ): ListItemComponent;
}

export class ListField
  extends SortableMixin(Field)
  implements ListFieldComponent
{
  config: ListFieldConfig;
  protected items: Array<ListItemComponent> | null;
  protected ListItemCls: ListItemConstructor;
  usingAutoFields: boolean;

  constructor(
    types: Types,
    config: ListFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'list'
  ) {
    super(types, config, globalConfig, fieldType);
    this.config = config;
    this.items = null;
    this.usingAutoFields = false;
    this.ListItemCls = ListFieldItem;
    this.sortableUi.listeners.add('sort', this.handleSort.bind(this));
  }

  get allowAdd(): boolean {
    // Check if validation rules allow for adding more items.
    const value = this.value;
    for (const rule of this.rules.getRulesForZone()) {
      if (!rule.allowAdd(value)) {
        return false;
      }
    }
    return true;
  }

  get allowRemove(): boolean {
    // Check if validation rules allow for removing items.
    const value = this.value;
    for (const rule of this.rules.getRulesForZone()) {
      if (!rule.allowRemove(value)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Does the list allow for showing simple fields?
   */
  get allowSimple(): boolean {
    return !this.config.isComplex;
  }

  protected createFields(fieldConfigs: Array<any>): FieldsComponent {
    return new this.types.globals.FieldsCls(
      this.types,
      {
        // Field configs should not be 'shared'. Duplicate the field configs
        // before creating the fields.
        fields: cloneDeep(fieldConfigs),
        isGuessed: this.usingAutoFields,
        parentKey: this.fullKey,
        previewField: this.config.previewField,
        previewFields: this.config.previewFields,
        previewType: this.config.previewType,
      },
      this.globalConfig
    );
  }

  protected ensureItems(editor: SelectiveEditor): Array<ListItemComponent> {
    // Cannot initialize items without valid data format.
    if (!this.isDataFormatValid) {
      return [];
    }

    if (this.items === null) {
      this.items = [];

      let fieldConfigs = this.config.fields || [];

      // Add list items for each of the values in the list already.
      for (const value of this.originalValue || []) {
        // If no field configs, auto guess based on first row with a value.
        if (fieldConfigs.length === 0) {
          this.usingAutoFields = true;

          // Auto-guess fields based on the first item in the list.
          const autoFields = new this.types.globals.AutoFieldsCls({});
          fieldConfigs = autoFields.guessFields(value);

          // Store the the auto-guessed configs for new list items.
          this.config.fields = fieldConfigs;
        }

        const fields = this.createFields(fieldConfigs);

        // When an item is not expanded it does not get the value
        // updated correctly so we need to manually call the data update.
        fields.updateOriginal(editor, value);
        for (const field of fields.fields) {
          field.updateOriginal(
            editor,
            autoDeepObject(value || fields.guessDefaultValue())
          );
        }

        this.items.push(new this.ListItemCls(this, fields));
      }
    }

    return this.items;
  }

  handleAddItem(evt: Event, editor: SelectiveEditor, data: DeepObject) {
    const items = this.ensureItems(editor);
    const fieldConfigs = this.config.fields || [];
    const fields = this.createFields(fieldConfigs);

    // When an item is not expanded it does not get the value
    // updated correctly so we need to manually call the data update.
    fields.updateOriginal(editor, data);
    for (const field of fields.fields) {
      field.updateOriginal(editor, autoDeepObject(fields.guessDefaultValue()));
    }
    const newItem = new this.ListItemCls(this, fields);
    newItem.isExpanded = true;
    items.push(newItem);
    this.render();
  }

  handleDeleteItem(evt: Event, index: number) {
    const items = this.items || [];
    // Prevent the delete from bubbling.
    evt.stopPropagation();

    // Remove the value at the index.
    items.splice(index, 1);

    // Lock the fields to prevent the values from being updated at the same
    // time as the original value.
    const downstreamItems = items.slice(index);
    for (const item of downstreamItems) {
      item.fields.lock();
    }
    this.lock();

    // Unlock fields after saving is complete to let the values be updated
    // when clean.
    // TODO: Automate this unlock without having to be done manually.
    document.addEventListener(
      EVENT_UNLOCK,
      () => {
        for (const item of downstreamItems) {
          item.fields.unlock();
        }
        this.unlock();
        this.render();
      },
      {once: true}
    );

    this.render();
  }

  handleSort(startIndex: number, endIndex: number) {
    // Rework the arrays to have the items in the correct position.
    const newListItems: Array<ListItemComponent> = [];
    const oldListItems: Array<ListItemComponent> = this.items || [];
    const maxIndex = Math.max(endIndex, startIndex);
    const minIndex = Math.min(endIndex, startIndex);

    // Did not move, don't need to sort.
    if (startIndex === endIndex) {
      return;
    }

    // Determine which direction to shift misplaced items.
    let modifier = 1;
    if (startIndex > endIndex) {
      modifier = -1;
    }

    for (let i = 0; i < oldListItems.length; i++) {
      if (i < minIndex || i > maxIndex) {
        // Leave in the same order.
        newListItems[i] = oldListItems[i];

        // Lock the fields to prevent the values from being updated at the same
        // time as the original value.
        newListItems[i].fields.lock();
      } else if (i === endIndex) {
        // This element is being moved to, place the moved value here.
        newListItems[i] = oldListItems[startIndex];

        // Lock the fields to prevent the values from being updated at the same
        // time as the original value.
        newListItems[i].fields.lock();
      } else {
        // Shift the old index using the modifier to determine direction.
        newListItems[i] = oldListItems[i + modifier];

        // Lock the fields to prevent the values from being updated at the same
        // time as the original value.
        newListItems[i].fields.lock();
      }
    }

    this.items = newListItems;
    this.lock();

    // Unlock fields after saving is complete to let the values be updated when clean.
    document.addEventListener(
      EVENT_UNLOCK,
      () => {
        for (const item of newListItems) {
          item.fields.unlock();
        }
        this.unlock();
        this.render();
      },
      {once: true}
    );

    // Check if sorted back to original value.
    if (this.items.length === this.originalValue.length) {
      let isSame = true;
      for (let i = 0; i < this.items.length; i++) {
        if (
          stringify(this.items[i].fields.value) !==
          stringify(this.originalValue[i])
        ) {
          isSame = false;
          break;
        }
      }

      // If the list items are the same across new values and original then it
      // has been sorted back to original and needs to be unlocked.
      if (isSame) {
        this.unlock();

        for (const item of newListItems) {
          item.fields.unlock();
        }
      }
    }

    this.render();
  }

  get isClean(): boolean {
    // If there are no items, nothing has changed.
    if (this.items === null) {
      return true;
    }

    // When locked, the field is automatically considered dirty.
    if (this.isLocked) {
      return false;
    }

    // Check for a change in length.
    if (
      this.items !== null &&
      this.originalValue &&
      this.originalValue.length !== this.items.length
    ) {
      return false;
    }

    // Check if all of the items are clean.
    for (const item of this.items || []) {
      if (!item.fields.isClean) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if the data format is invalid for what the field expects to edit.
   */
  get isDataFormatValid(): boolean {
    if (this.originalValue === undefined || this.originalValue === null) {
      return true;
    }

    return DataType.isArray(this.originalValue);
  }

  get isValid(): boolean {
    // If there are no items, nothing has changed.
    if (this.items === null) {
      return true;
    }

    for (const item of this.items) {
      if (!item.fields.isValid) {
        return false;
      }
    }
    return true;
  }

  /**
   * Length of the list.
   */
  get length(): number {
    return this.items?.length || 0;
  }

  templateEmpty(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): TemplateResult {
    return html` <div
      class="selective__list__item selective__list__item--empty"
      data-index=${index}
    >
      ${this.config.emptyLabel || 'No items in list'}
    </div>`;
  }

  templateFooter(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    if (!this.allowAdd) {
      return html``;
    }

    return html`<div class="selective__field__actions">
      <button
        class="selective__action selective__action--add"
        @click=${(evt: Event) => {
          this.handleAddItem(evt, editor, data);
        }}
      >
        <span>${this.config.addLabel || 'Add'}</span>
      </button>
    </div>`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateHeader(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const items = this.ensureItems(editor);
    if (!items.length) {
      return html``;
    }

    const actions = [];

    // Determine the ability to show simple fields.
    let areSimpleFields = this.allowSimple;

    // Determine the expanded/collapsed state for the item.
    let areAllExpanded = true;
    let areAllCollapsed = true;

    for (const item of items) {
      if (!item.fields.isSimple || !item.fields.allowSimple) {
        areSimpleFields = false;
      }
      if (!item.isExpanded) {
        areAllExpanded = false;
      }
      if (item.isExpanded) {
        areAllCollapsed = false;
      }
    }

    // Do not show the expand/collapse for simplet fields.
    if (areSimpleFields) {
      return html``;
    }

    const handleExpandAll = () => {
      for (const item of items) {
        item.isExpanded = true;
      }
      this.render();
    };

    actions.push(html`<div
      ?disabled=${areAllExpanded}
      class="selective__action selective__action--expand selective__tooltip--bottom-left"
      data-tip="Expand all"
      @click=${handleExpandAll}
    >
      <i class="material-icons">unfold_more</i>
    </div>`);

    const handleCollapseAll = () => {
      for (const item of items) {
        item.isExpanded = false;
      }
      this.render();
    };

    actions.push(html`<div
      ?disabled=${areAllCollapsed}
      class="selective__action selective__action--collapse selective__tooltip--bottom-left"
      data-tip="Collapse all"
      @click=${handleCollapseAll}
    >
      <i class="material-icons">unfold_less</i>
    </div>`);

    return html`<div class="selective__field__actions">${actions}</div>`;
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`${this.templateHelp(editor, data)}
      <div class="selective__list">
        ${repeat(
          this.items || [],
          item => item.uid,
          (item, index) => {
            const itemValue = new DeepObject(
              index < this.originalValue?.length || 0
                ? this.originalValue[index]
                : item.fields.guessDefaultValue()
            );
            return item.template(editor, itemValue, index);
          }
        )}
        ${this.items?.length ? '' : this.templateEmpty(editor, data, 0)}
      </div>
      ${this.templateErrors(editor, data)}`;
  }

  get value() {
    // Return the original value if the items have never been initialized.
    if (this.items === null) {
      return this.originalValue || [];
    }

    const value = [];
    for (const item of this.items) {
      value.push(item.fields.value);
    }
    return value;
  }
}

export class ListFieldItem
  extends UuidMixin(Base)
  implements ListItemComponent
{
  listField: ListFieldComponent & SortableFieldComponent;
  fields: FieldsComponent;
  isExpanded: boolean;

  constructor(
    listField: ListFieldComponent & SortableFieldComponent,
    fields: FieldsComponent
  ) {
    super();
    this.listField = listField;
    this.fields = fields;
    this.isExpanded = false;
  }

  actionsCollapsedPre(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): Actions {
    const canDrag = this.listField.length > 1;
    const actions = new Actions({
      modifier: 'pre',
    });

    if (canDrag) {
      actions.add(html`<div class="selective__list__item__drag">
        <i class="material-icons">drag_indicator</i>
      </div>`);
    }

    if (index !== undefined) {
      actions.add(html`<div class="selective__list__item__index">
        ${index + 1}
      </div>`);
    }

    return actions;
  }

  actionsCollapsedPost(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): Actions {
    const actions = new Actions({
      modifier: 'post',
    });

    actions.add(this.templateRemove(editor, data, index));

    return actions;
  }

  actionsExpandedPre(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): Actions {
    const actions = new Actions({
      modifier: 'pre',
    });

    if (index !== undefined) {
      actions.add(html`<div class="selective__list__item__index">
        ${index + 1}
      </div>`);
    }

    return actions;
  }

  actionsExpandedPost(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editor: SelectiveEditor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: DeepObject,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index: number
  ): Actions {
    const actions = new Actions({
      modifier: 'post',
    });

    actions.add(html`<span class="material-icons">keyboard_arrow_down</span>`);

    return actions;
  }

  actionsSimplePre(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): Actions {
    const canDrag = this.listField.length > 1;
    const actions = new Actions({
      modifier: 'pre',
    });

    if (canDrag) {
      actions.add(html`<div class="selective__list__item__drag">
        <i class="material-icons">drag_indicator</i>
      </div>`);
    }

    if (index !== undefined) {
      actions.add(html`<div class="selective__list__item__index">
        ${index + 1}
      </div>`);
    }

    return actions;
  }

  actionsSimplePost(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): Actions {
    const actions = new Actions({
      modifier: 'post',
    });

    actions.add(this.templateRemove(editor, data, index));

    return actions;
  }

  classesCollpased(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editor: SelectiveEditor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: DeepObject,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index: number
  ): Record<string, boolean> {
    return {
      selective__list__item: true,
      'selective__list__item--collapsed': true,
      'selective__list__item--no-drag': this.listField.length <= 1,
      selective__sortable: true,
    };
  }

  classesExpanded(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editor: SelectiveEditor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: DeepObject,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index: number
  ): Record<string, boolean> {
    return {
      selective__list__item: true,
      'selective__list__item--expanded': true,
      selective__sortable: true,
    };
  }

  classesSimple(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editor: SelectiveEditor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: DeepObject,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    index: number
  ): Record<string, boolean> {
    return {
      selective__list__item: true,
      'selective__list__item--simple': true,
      selective__sortable: true,
    };
  }

  handleCollapseItem() {
    this.isExpanded = false;
    this.listField.render();
  }

  handleExpandItem() {
    this.isExpanded = true;
    this.listField.render();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleHoverOffItem(evt: MouseEvent, index: number) {
    // Do nothing.
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleHoverOnItem(evt: MouseEvent, index: number) {
    // Do nothing.
  }

  template(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): TemplateResult {
    if (
      this.listField.allowSimple && // The list field allows for simple fields.
      this.fields.allowSimple && // The fields allows for simple fields.
      this.fields.isSimple // The fields are simple.
    ) {
      return this.templateSimple(editor, data, index);
    } else if (this.isExpanded) {
      return this.templateExpanded(editor, data, index);
    }
    return this.templateCollapsed(editor, data, index);
  }

  templateCollapsed(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): TemplateResult {
    // Need to update the original value on the collapsed items.
    this.fields.updateOriginal(editor, data, true);
    const canDrag = this.listField.length > 1;
    const sortable = this.listField.sortableUi;

    return html` <div
      class=${classMap(this.classesCollpased(editor, data, index))}
      draggable=${canDrag && sortable.canDrag ? 'true' : 'false'}
      data-index=${index}
      data-item-uid=${this.uid}
      @dragenter=${sortable.handleDragEnter.bind(sortable)}
      @dragleave=${sortable.handleDragLeave.bind(sortable)}
      @dragover=${sortable.handleDragOver.bind(sortable)}
      @dragstart=${sortable.handleDragStart.bind(sortable)}
      @drop=${sortable.handleDrop.bind(sortable)}
      @focusin=${(evt: FocusEvent) => {
        sortable.handleFocusIn(evt);
        this.listField.render();
      }}
      @focusout=${(evt: FocusEvent) => {
        sortable.handleFocusOut(evt);
        this.listField.render();
      }}
      @mouseenter=${(evt: MouseEvent) => {
        this.handleHoverOnItem(evt, index);
      }}
      @mouseleave=${(evt: MouseEvent) => {
        this.handleHoverOffItem(evt, index);
      }}
    >
      ${this.actionsCollapsedPre(editor, data, index).template()}
      <div
        class="selective__list__item__preview"
        data-item-uid=${this.uid}
        @click=${this.handleExpandItem.bind(this)}
      >
        ${this.templatePreviewValue(editor, data, index)}
      </div>
      ${this.actionsCollapsedPost(editor, data, index).template()}
    </div>`;
  }

  templateExpanded(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): TemplateResult {
    const canDrag = this.listField.length > 1;
    const sortable = this.listField.sortableUi;

    return html` <div
      class=${classMap(this.classesExpanded(editor, data, index))}
      draggable=${canDrag && sortable.canDrag ? 'true' : 'false'}
      data-index=${index}
      data-item-uid=${this.uid}
      @dragenter=${sortable.handleDragEnter.bind(sortable)}
      @dragleave=${sortable.handleDragLeave.bind(sortable)}
      @dragover=${sortable.handleDragOver.bind(sortable)}
      @dragstart=${sortable.handleDragStart.bind(sortable)}
      @drop=${sortable.handleDrop.bind(sortable)}
      @focusin=${(evt: FocusEvent) => {
        sortable.handleFocusIn(evt);
        this.listField.render();
      }}
      @focusout=${(evt: FocusEvent) => {
        sortable.handleFocusOut(evt);
        this.listField.render();
      }}
      @mouseenter=${(evt: MouseEvent) => {
        this.handleHoverOnItem(evt, index);
      }}
      @mouseleave=${(evt: MouseEvent) => {
        this.handleHoverOffItem(evt, index);
      }}
    >
      <div
        class="selective__list__fields__header"
        @click=${this.handleCollapseItem.bind(this)}
      >
        ${this.actionsExpandedPre(editor, data, index).template()}
        <div class="selective__list__item__preview">
          ${this.templatePreviewValue(editor, data, index)}
        </div>
        ${this.actionsExpandedPost(editor, data, index).template()}
      </div>
      <div class="selective__list__fields">
        ${this.fields.template(editor, data)}
      </div>
    </div>`;
  }

  /**
   * Template for how to render a preview.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templatePreviewValue(
    editor: SelectiveEditor,
    data: DeepObject,
    index?: number
  ): TemplateResult {
    return this.fields.templatePreviewValue(editor, data, index);
  }

  templateRemove(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): TemplateResult {
    if (!this.listField.allowRemove) {
      return html``;
    }

    return html`<div
      class="selective__action selective__action--delete selective__tooltip--left"
      data-item-uid=${this.uid}
      @click=${(evt: Event) => {
        this.listField.handleDeleteItem(evt, index);
      }}
      aria-label="Delete item"
      data-tip="Delete item"
    >
      <i class="material-icons icon icon--delete">remove_circle</i>
    </div>`;
  }

  templateSimple(
    editor: SelectiveEditor,
    data: DeepObject,
    index: number
  ): TemplateResult {
    const canDrag = this.listField.length > 1;
    const sortable = this.listField.sortableUi;

    return html` <div
      class=${classMap(this.classesSimple(editor, data, index))}
      draggable=${canDrag && sortable.canDrag ? 'true' : 'false'}
      data-index=${index}
      data-item-uid=${this.uid}
      @dragenter=${sortable.handleDragEnter.bind(sortable)}
      @dragleave=${sortable.handleDragLeave.bind(sortable)}
      @dragover=${sortable.handleDragOver.bind(sortable)}
      @dragstart=${sortable.handleDragStart.bind(sortable)}
      @drop=${sortable.handleDrop.bind(sortable)}
      @focusin=${(evt: FocusEvent) => {
        sortable.handleFocusIn(evt);
        this.listField.render();
      }}
      @focusout=${(evt: FocusEvent) => {
        sortable.handleFocusOut(evt);
        this.listField.render();
      }}
      @mouseenter=${(evt: MouseEvent) => {
        this.handleHoverOnItem(evt, index);
      }}
      @mouseleave=${(evt: MouseEvent) => {
        this.handleHoverOffItem(evt, index);
      }}
    >
      ${this.actionsSimplePre(editor, data, index).template()}
      ${this.fields.template(editor, data)}
      ${this.actionsSimplePost(editor, data, index).template()}
    </div>`;
  }
}
