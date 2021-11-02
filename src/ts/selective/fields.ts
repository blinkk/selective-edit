import {FieldComponent, FieldConfig, InternalFieldConfig} from './field';
import {GlobalConfig, SelectiveEditor} from './editor';
import {
  PreviewTypes,
  combinePreviewKeys,
  findOrGuessPreviewValue,
  templatePreviewValue,
} from '../utility/preview';
import {TemplateResult, html} from 'lit-html';
import {Base} from '../mixins';
import {DataMixin} from '../mixins/data';
import {DeepObject} from '../utility/deepObject';
import {Template} from './template';
import {Types} from './types';
import {UuidMixin} from '../mixins/uuid';
import merge from 'lodash.merge';
import {repeat} from 'lit-html/directives/repeat.js';

export interface FieldsConfig {
  fields?: Array<FieldConfig & InternalFieldConfig>;
  isGuessed?: boolean;
  parentKey: string;
  previewField?: string;
  previewFields?: Array<string>;
  previewType?: PreviewTypes;
}

export interface FieldsComponent {
  config: FieldsConfig;
  addField(fieldConfig: FieldConfig & InternalFieldConfig): void;
  allowSimple: boolean;
  fields: Array<FieldComponent>;
  isClean: boolean;
  isSimple: boolean;
  isValid: boolean;
  guessDefaultValue(): string | Record<string, any>;
  lock(): void;
  reset(): void;
  template: Template;
  templatePreviewValue(
    editor: SelectiveEditor,
    data: DeepObject,
    index?: number
  ): TemplateResult;
  updateOriginal(
    editor: SelectiveEditor,
    data: DeepObject,
    deep?: boolean
  ): void;
  value: any;
  unlock(): void;
}

export interface FieldsConstructor {
  new (
    types: Types,
    config: FieldsConfig,
    globalConfig: GlobalConfig
  ): FieldsComponent;
}

/**
 * Fields control the display of a list of fields in the editor.
 */
export class Fields
  extends UuidMixin(DataMixin(Base))
  implements FieldsComponent
{
  config: FieldsConfig;
  globalConfig: GlobalConfig;
  private currentValue?: DeepObject;
  fields: Array<FieldComponent>;
  private isLocked: boolean;
  private originalValue?: DeepObject;
  types: Types;

  constructor(types: Types, config: FieldsConfig, globalConfig: GlobalConfig) {
    super();
    this.types = types;
    this.config = config;
    this.globalConfig = globalConfig;

    this.isLocked = false;
    this.fields = [];

    // Create the fields based on the config.
    for (const fieldConfig of this.config.fields || []) {
      this.addField(fieldConfig);
    }
  }

  addField(fieldConfig: FieldConfig & InternalFieldConfig) {
    fieldConfig.parentKey = this.config.parentKey;
    fieldConfig.isGuessed = this.config.isGuessed;

    const newField = this.types.fields.newFromKey(
      fieldConfig.type,
      this.types,
      fieldConfig,
      this.globalConfig
    );

    if (!newField) {
      console.error(
        `Unable to add field for unknown field type: ${fieldConfig.type}.`
      );
      return;
    }
    this.fields.push(newField);
  }

  get allowSimple(): boolean {
    return !this.config.previewField && !this.config.previewFields;
  }

  /**
   * When there is no value, guess based on the known information about
   * the fields.
   */
  guessDefaultValue(): string | Record<string, any> {
    // When there are multiple fields, default is an object.
    if (this.fields.length > 1) {
      return {};
    }
    return '';
  }

  /**
   * Checks if the value is clean (unchanged) from the original value.
   */
  get isClean(): boolean {
    for (const field of this.fields) {
      if (!field.isClean) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if the fields are simple and can be simplified in the display.
   */
  get isSimple(): boolean {
    // Cannot be simple if there are more than one field.
    if (this.fields.length > 1) {
      return false;
    }

    // Allow the field to mark it as complex.
    for (const field of this.fields) {
      if (!field.isSimple) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks all the fields to find out if there are invalid fields.
   */
  get isValid() {
    for (const field of this.fields) {
      if (!field.isValid) {
        return false;
      }
    }
    return true;
  }

  /**
   * Certain cases require the field to be locked while updating to prevent bad
   * data mixing. This allows for manually locking the fields.
   */
  lock() {
    this.isLocked = true;

    // Lock all the fields to prevent them from being updated.
    for (const field of this.fields) {
      field.lock();
    }
  }

  get previewFields(): Array<string> {
    return combinePreviewKeys(
      this.config.previewFields,
      this.config.previewField
    );
  }

  reset(): void {
    this.fields = [];
  }

  /**
   * Template for determining how to render the fields.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  template(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    if (!this.fields.length) {
      return html``;
    }

    if (this.isSimple) {
      return html` ${this.updateOriginal(editor, data)}
      ${this.fields[0].template(editor, data)}`;
    }

    return html`<div class="selective__fields">
      ${this.updateOriginal(editor, data)}
      ${repeat(
        this.fields,
        (field: FieldComponent) => field.uuid,
        (field: FieldComponent) => html` ${field.template(editor, data)} `
      )}
    </div>`;
  }

  /**
   * Template for how to render a preview.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templatePreviewValue(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editor: SelectiveEditor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: DeepObject,
    index?: number
  ): TemplateResult {
    const defaultValue = 'Untitled item';
    const previewValue = findOrGuessPreviewValue(
      this.value,
      this.previewFields,
      defaultValue
    );
    return templatePreviewValue(
      previewValue,
      this.config.previewType ? this.config.previewType : PreviewTypes.Text,
      defaultValue,
      index
    ) as TemplateResult;
  }

  /**
   * Certain cases require the field to be locked while updating to prevent bad
   * data mixing. This allows for manually unlocking the fields.
   */
  unlock() {
    this.isLocked = false;

    // Lock all the fields to prevent them from being updated.
    for (const field of this.fields) {
      field.unlock();
    }
  }

  /**
   * The data is not known to the fields until the rendering is done.
   *
   * Updated the original value from the data provided during rendering.
   * This gives a base set of values for clean checks and validation to use.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   * @param deep Update in fields as well, such as when the field is not visible.
   */
  updateOriginal(
    editor: SelectiveEditor,
    data: DeepObject,
    deep = false
  ): void {
    // Manual locking prevents the original value overwriting the value
    // in special cases when it should not.
    if (this.isLocked) {
      return;
    }

    this.originalValue = data;

    if (deep) {
      // Update all the fields since they may not get rendered.
      // Ex: a collapsed list would not get the update.
      for (const field of this.fields) {
        field.updateOriginal(editor, data);
      }
    }
  }

  /**
   * Returns the value from all of the fields in a single object.
   */
  get value(): any {
    if (!this.fields.length) {
      return null;
    }

    if (this.allowSimple && this.isSimple && !this.fields[0].key) {
      return this.fields[0].value;
    }

    // Merging with the original value after setting values causes
    // issues where blank arrays are replaced by the original arrays.
    const value = new DeepObject(merge({}, this?.originalValue?.obj));
    for (const field of this.fields) {
      value.set(field.key, field.value);
    }

    return value.obj;
  }
}
