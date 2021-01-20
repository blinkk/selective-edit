import {DeepObject, autoDeepObject} from '../../utility/deepObject';
import {Field, FieldConfig} from '../field';
import {TemplateResult, html} from 'lit-html';
import {FieldsComponent} from '../fields';
import {SelectiveEditor} from '../editor';
import {Types} from '../types';
import {expandClasses} from '../../utility/dom';
import merge from 'lodash.merge';

export interface GroupFieldConfig extends FieldConfig {
  /**
   * Fields to be grouped and hidden.
   */
  fields?: Array<FieldConfig>;
  /**
   * Is the group expanded to show the fields?
   */
  isExpanded?: boolean;
}

export class GroupField extends Field {
  config: GroupFieldConfig;
  fields?: FieldsComponent;
  usingAutoFields: boolean;

  constructor(types: Types, config: GroupFieldConfig, fieldType = 'group') {
    super(types, config, fieldType);
    this.config = config;
    this.usingAutoFields = false;
  }

  protected createFields(fieldConfigs: Array<any>): FieldsComponent {
    return new this.types.globals.FieldsCls(this.types, {
      fields: fieldConfigs,
      isGuessed: this.usingAutoFields,
      parentKey: this.fullKey,
    });
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

  get isValid(): boolean {
    // If there are no fields, nothing has changed.
    if (!this.fields) {
      return true;
    }
    return this.fields.isValid;
  }

  templateHeader(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const actions = [];

    actions.push(html`<div class="selective__action selective__action__expand">
      <i class="material-icons"
        >${this.config.isExpanded ? 'expand_less' : 'expand_more'}</i
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
      return this.templateHelp(editor, data);
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

    return html`<div class=${expandClasses(this.classesForLabel())}>
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
}
