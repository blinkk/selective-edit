import {DeepObject, autoDeepObject} from '../../utility/deepObject';
import {Field, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {TemplateResult, html} from 'lit-html';

import {DataType} from '../../utility/dataType';
import {FieldsComponent} from '../fields';
import {Types} from '../types';
import {classMap} from 'lit-html/directives/class-map.js';
import {findPreviewValue} from '../../utility/preview';
import merge from 'lodash.merge';
import {repeat} from 'lit-html/directives/repeat.js';

export interface GroupFieldConfig extends FieldConfig {
  /**
   * Fields to be grouped and hidden.
   */
  fields?: Array<FieldConfig>;
  /**
   * Is the group expanded to show the fields?
   *
   * Set to `true` to expand the group by default.
   */
  isExpanded?: boolean;
  /**
   * Preview field keys.
   *
   * When showing a preview of the group, use these field keys to determine
   * the value to show for the preview.
   *
   * If no fields are no preview will be shown for the group when collapsed.
   */
  previewFields?: Array<string>;
}

export class GroupField extends Field {
  config: GroupFieldConfig;
  fields?: FieldsComponent;
  usingAutoFields: boolean;

  constructor(
    types: Types,
    config: GroupFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'group'
  ) {
    super(types, config, globalConfig, fieldType);
    this.config = config;
    this.usingAutoFields = false;
  }

  classesForField(): Record<string, boolean> {
    const classes = super.classesForField();

    classes[`selective__field__type__${this.fieldType}--expanded`] =
      this.config.isExpanded || false;

    return classes;
  }

  protected createFields(fieldConfigs: Array<any>): FieldsComponent {
    return new this.types.globals.FieldsCls(
      this.types,
      {
        fields: fieldConfigs,
        isGuessed: this.usingAutoFields,
        parentKey: this.fullKey,
      },
      this.globalConfig
    );
  }

  protected ensureFields() {
    if (!this.fields) {
      this.fields = this.createFields(this.config.fields || []);
    }
  }

  get isClean(): boolean {
    // If there are no fields, nothing has changed.
    if (!this.fields) {
      return true;
    }
    return this.fields.isClean;
  }

  /**
   * Check if the data format is invalid for what the field expects to edit.
   */
  get isDataFormatValid(): boolean {
    if (this.originalValue === undefined || this.originalValue === null) {
      return true;
    }

    return DataType.isObject(this.originalValue);
  }

  get isValid(): boolean {
    // If there are no fields, nothing has changed.
    if (!this.fields) {
      return true;
    }
    return this.fields.isValid;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateHeader(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const actions = [];

    actions.push(html`<div class="selective__action selective__action__expand">
      <i class="material-icons"
        >${this.config.isExpanded ? 'expand_more' : 'chevron_right'}</i
      >
    </div>`);
    return html`<div class="selective__field__actions">${actions}</div>`;
  }

  /**
   * Template for rendering the field header structure.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateHeaderStructure(
    editor: SelectiveEditor,
    data: DeepObject
  ): TemplateResult {
    const handleExpandToggle = () => {
      this.config.isExpanded = !this.config.isExpanded;
      this.render();
    };

    return html`<div
      class="selective__field__header"
      @click=${handleExpandToggle}
    >
      ${this.templateHeader(editor, data)} ${this.templateLabel(editor, data)}
    </div>`;
  }

  /**
   * Template for rendering the field input.
   *
   * The help text is part of the input template so complex inputs can
   * use zones for the help text.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    if (!this.config.isExpanded) {
      return this.templatePreview(editor, data);
    }

    this.ensureFields();

    return html`${this.templateHelp(editor, data)}${this.fields?.template(
      editor,
      autoDeepObject(this.originalValue)
    ) || ''}`;
  }

  /**
   * Template for rendering the field label.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateLabel(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const label = this.config.label || '(Group)';

    return html`<div class=${classMap(this.classesForLabel())}>
      ${this.templateIconValidation(editor, data)}
      <label>${label}</label>
    </div>`;
  }

  get value(): Record<string, any> {
    if (!this.fields) {
      return this.originalValue;
    }
    return merge({}, this.originalValue, this.fields.value);
  }

  /**
   * Template for rendering the field preview.
   *
   * When the group is collapsed, show a set of previews for a few values in the group.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templatePreview(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    if (!this.config.previewFields) {
      return html`${this.templateHelp(editor, data)}`;
    }

    return html`${this.templateHelp(editor, data)}
      <div class="selective__field__preview">
        ${repeat(
          this.config.previewFields,
          key => key,
          key => {
            return this.templatePreviewField(editor, data, key);
          }
        )}
      </div>`;
  }

  /**
   * Template for rendering the field preview.
   *
   * When the group is collapsed, show a set of previews for a few values in the group.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templatePreviewField(
    editor: SelectiveEditor,
    data: DeepObject,
    fieldKey: string
  ): TemplateResult {
    let previewLabel = fieldKey;
    for (const fieldConfig of this.config.fields || []) {
      if (fieldConfig.key === fieldKey) {
        previewLabel = fieldConfig.label || previewLabel;
        break;
      }
    }

    return html`<div class="selective__field__preview__line">
      <strong>${previewLabel}:</strong> ${findPreviewValue(
        this.currentValue || {},
        [fieldKey],
        fieldKey
      )}
    </div>`;
  }
}
