import {Config, autoConfig} from '../../utility/config';
import {Field, FieldComponent} from '../field';
import {TemplateResult, html} from 'lit-html';
import {Base} from '../../mixins';
import {DeepObject} from '../../utility/deepObject';
import {EVENT_UNLOCK} from '../events';
import {FieldsComponent} from '../fields';
import {SelectiveEditor} from '../..';
import {SortableMixin} from '../../mixins/sortable';
import {Types} from '../types';
import {UuidMixin} from '../../mixins/uuid';
import {repeat} from 'lit-html/directives/repeat';

export interface ListItemComponent {
  field: FieldComponent;
  fields: FieldsComponent;
  isExpanded: boolean;
  template: (
    editor: SelectiveEditor,
    data: DeepObject,
    item: ListItemComponent,
    index: number
  ) => TemplateResult;
  uid: string;
}

export interface ListItemConstructor {
  new (field: FieldComponent, fields: FieldsComponent): ListItemComponent;
}

export class ListField extends SortableMixin(Field) {
  protected items: Array<ListItemComponent> | null;
  protected ListItemCls: ListItemConstructor;

  constructor(types: Types, config: Config, fieldType = 'list') {
    super(types, config, fieldType);
    this.items = null;
    this.ListItemCls = ListFieldItem;
    this.sortableUi.listeners.add('sort', this.handleSort.bind(this));
  }

  private createFields(fieldConfigs: Array<any>): FieldsComponent {
    const fields = new this.types.globals.FieldsCls(
      this.types,
      new Config({
        fields: fieldConfigs,
      })
    );

    // Create the fields based on the config.
    for (const fieldConfigRaw of fieldConfigs) {
      const fieldConfig = new Config(fieldConfigRaw);
      fieldConfig.set('parentKey', this.fullKey);

      // Mark the auto fields.
      if (this.usingAutoFields) {
        fieldConfig.set('isGuessed', true);
      }

      fields.addField(fieldConfig);
    }

    return fields;
  }

  private itemsOrCreateItems(
    editor: SelectiveEditor
  ): Array<ListItemComponent> {
    if (this.items === null) {
      // TODO: create all the items based on the config.
      this.items = [];

      const fieldConfigs = this.config?.get('fields') || [];

      // Add list items for each of the values in the list already.
      for (const value of this.originalValue || []) {
        // If no field configs, auto guess based on first row with a value.
        if (fieldConfigs.length === 0) {
          this.usingAutoFields = true;
          // TODO: Auto-guess fields based on the first item in the list.
          // TODO: Store the the auto-guess configs into the `this.config`.
        }

        const fields = this.createFields(fieldConfigs);

        // When an item is not expanded it does not get the value
        // updated correctly so we need to manually call the data update.
        fields.updateOriginal(editor, value);
        for (const field of fields.fields) {
          field.updateOriginal(
            editor,
            autoConfig(value || fields.defaultValue)
          );
        }

        this.items.push(new ListFieldItem(this, fields));
      }
    }

    return this.items;
  }

  handleAddItem(evt: Event, editor: SelectiveEditor, data: DeepObject) {
    const items = this.itemsOrCreateItems(editor);
    const fieldConfigs = this.config?.get('fields') || [];
    const fields = this.createFields(fieldConfigs);

    // When an item is not expanded it does not get the value
    // updated correctly so we need to manually call the data update.
    fields.updateOriginal(editor, data);
    for (const field of fields.fields) {
      field.updateOriginal(editor, autoConfig(fields.defaultValue));
    }

    items.push(new ListFieldItem(this, fields));
    this.render();
  }

  handleDeleteItem(evt: Event, editor: SelectiveEditor, index: number) {
    const items = this.itemsOrCreateItems(editor);
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

    // Determine which direction to shift misplaced items.
    let modifier = 1;
    if (startIndex > endIndex) {
      modifier = -1;
    }

    for (let i = 0; i < oldListItems.length; i++) {
      if (i < minIndex || i > maxIndex) {
        // Leave in the same order.
        newListItems[i] = oldListItems[i];

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

    this.render();
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
      ${this.config?.get('empty_label') || '{ Empty }'}
    </div>`;
  }

  templateFooter(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    // Check if validation rules allow for adding more items.
    const value = this.value;
    const rules = this.rules.getRulesForZone();

    let allowMore = true;
    for (const rule of rules) {
      if (!rule.allowMore(value)) {
        allowMore = false;
        break;
      }
    }

    if (!allowMore) {
      return html``;
    }

    return html`<div class="selective__field__actions">
      <button
        class="selective__button--add"
        @click=${(evt: Event) => {
          this.handleAddItem(evt, editor, data);
        }}
      >
        ${this.config?.get('add_label') || 'Add'}
      </button>
    </div>`;
  }

  templateHeader(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const items = this.itemsOrCreateItems(editor);
    if (!items.length) {
      return html``;
    }

    const actions = [];

    // Determine the ability to show simple fields and to
    let areSimpleFields = true;
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
      class="selective__action selective__action__expand"
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
      class="selective__action selective__action__collapse"
      @click=${handleCollapseAll}
    >
      <i class="material-icons">unfold_less</i>
    </div>`);

    return html`<div class="selective__field__actions">${actions}</div>`;
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const items = this.itemsOrCreateItems(editor);
    return html`<div class="selective__list">
        ${repeat(
          items,
          item => item.uid,
          (item: ListItemComponent, index) => {
            const itemValue = new DeepObject(
              index < this.originalValue?.length || 0
                ? this.originalValue[index]
                : item.fields.defaultValue
            );
            return item.template(editor, itemValue, item, index);
          }
        )}
        ${items.length === 0 ? this.templateEmpty(editor, data, 0) : ''}
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

class ListFieldItem extends UuidMixin(Base) implements ListItemComponent {
  field: FieldComponent;
  fields: FieldsComponent;
  isExpanded: boolean;

  constructor(field: FieldComponent, fields: FieldsComponent) {
    super();
    this.field = field;
    this.fields = fields;
    this.isExpanded = false;
  }

  handleCollapseItem() {
    this.isExpanded = false;
    this.field.render();
  }

  handleExpandItem() {
    this.isExpanded = true;
    this.field.render();
  }

  template(
    editor: SelectiveEditor,
    data: DeepObject,
    item: ListItemComponent,
    index: number
  ): TemplateResult {
    if (item.fields.allowSimple && item.fields.isSimple) {
      return this.templateSimple(editor, data, item, index);
    } else if (this.isExpanded) {
      return this.templateExpanded(editor, data, item, index);
    }
    return this.templateCollapsed(editor, data, item, index);
  }

  templateCollapsed(
    editor: SelectiveEditor,
    data: DeepObject,
    item: ListItemComponent,
    index: number
  ): TemplateResult {
    // Need to update the original value on the collapsed items.
    item.fields.updateOriginal(editor, data, true);
    const sortable = this.field.sortableUi;

    // TODO: Check if allowed to delete items.

    return html` <div
      class="selective__list__item selective__list__item--collapsed selective__sortable"
      draggable="true"
      data-index=${index}
      @dragenter=${sortable.handleDragEnter.bind(sortable)}
      @dragleave=${sortable.handleDragLeave.bind(sortable)}
      @dragover=${sortable.handleDragOver.bind(sortable)}
      @dragstart=${sortable.handleDragStart.bind(sortable)}
      @drop=${sortable.handleDrop.bind(sortable)}
    >
      <div class="selective__list__item__drag">
        <i class="material-icons">drag_indicator</i>
      </div>
      <div
        class="selective__list__item__preview"
        data-item-uid=${this.uid}
        @click=${this.handleExpandItem.bind(this)}
      >
        ${this.fields.templatePreview(editor, data)}
      </div>
      <div
        class="selective__list__item__delete tooltip--left"
        data-item-uid=${item.uid}
        @click=${(evt: Event) => {
          this.field.handleDeleteItem(evt, editor, index);
        }}
        aria-label="Delete item"
        data-tip="Delete item"
      >
        <i class="material-icons icon icon--delete">remove_circle</i>
      </div>
    </div>`;
  }

  templateExpanded(
    editor: SelectiveEditor,
    data: DeepObject,
    item: ListItemComponent,
    index: number
  ): TemplateResult {
    const sortable = this.field.sortableUi;
    return html` <div
      class="selective__list__item selective__sortable"
      draggable="true"
      data-index=${index}
      @dragenter=${sortable.handleDragEnter.bind(sortable)}
      @dragleave=${sortable.handleDragLeave.bind(sortable)}
      @dragover=${sortable.handleDragOver.bind(sortable)}
      @dragstart=${sortable.handleDragStart.bind(sortable)}
      @drop=${sortable.handleDrop.bind(sortable)}
    >
      <div
        class="selective__list__fields__label ${!item.fields.label
          ? 'selective__list__fields__label--empty'
          : ''}"
        data-item-uid=${item.uid}
        @click=${this.handleCollapseItem.bind(this)}
      >
        ${item.fields.label}
      </div>

      <div class="selective__list__fields">
        ${item.fields.template(editor, data)}
      </div>
    </div>`;
  }

  templateSimple(
    editor: SelectiveEditor,
    data: DeepObject,
    item: ListItemComponent,
    index: number
  ): TemplateResult {
    const sortable = this.field.sortableUi;

    // TODO: Check if allowed to delete items.

    return html` <div
      class="selective__list__item selective__list__item--simple selective__sortable"
      draggable="true"
      data-index=${index}
      @dragenter=${sortable.handleDragEnter.bind(sortable)}
      @dragleave=${sortable.handleDragLeave.bind(sortable)}
      @dragover=${sortable.handleDragOver.bind(sortable)}
      @dragstart=${sortable.handleDragStart.bind(sortable)}
      @drop=${sortable.handleDrop.bind(sortable)}
    >
      <div class="selective__list__item__drag">
        <i class="material-icons">drag_indicator</i>
      </div>
      ${item.fields.template(editor, data)}
      <div
        class="selective__list__item__delete tooltip--left"
        data-item-uid=${item.uid}
        @click=${(evt: Event) => {
          this.field.handleDeleteItem(evt, editor, index);
        }}
        title="Delete item"
      >
        <i class="material-icons">delete</i>
      </div>
    </div>`;
  }
}
