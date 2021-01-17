import {Config, autoConfig} from '../../utility/config';
import {DeepObject, autoDeepObject} from '../../utility/deepObject';
import {TemplateResult, html} from 'lit-html';
import {Field} from '../field';
import {FieldsComponent} from '../fields';
import {SelectiveEditor} from '../editor';
import {Types} from '../types';
import merge from 'lodash.merge';

export class GroupField extends Field {
  fields?: FieldsComponent;
  isExpanded: boolean;
  usingAutoFields: boolean;

  constructor(types: Types, config: Config, fieldType = 'group') {
    super(types, config, fieldType);
    this.isExpanded = this.config?.get('isExpanded') || false;
    this.usingAutoFields = false;
  }

  protected createFields(fieldConfigs: Array<any>): FieldsComponent {
    const fields = new this.types.globals.FieldsCls(
      this.types,
      new Config({
        fields: fieldConfigs,
      })
    );

    console.log(fieldConfigs);

    // Create the fields based on the config.
    for (const fieldConfigRaw of fieldConfigs) {
      const fieldConfig = autoConfig(fieldConfigRaw);
      fieldConfig.set('parentKey', this.fullKey);

      // Mark the auto fields.
      if (this.usingAutoFields) {
        fieldConfig.set('isGuessed', true);
      }

      fields.addField(fieldConfig);
    }

    return fields;
  }

  protected ensureFields() {
    if (!this.fields) {
      this.fields = this.createFields(this.config?.get('fields') || []);
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
        >${this.isExpanded ? 'expand_less' : 'expand_more'}</i
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
      this.isExpanded = !this.isExpanded;
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
    if (!this.isExpanded) {
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
    const label = this.config?.get('label') || '(Group)';

    return html`<div class=${this.expandClasses(this.classesForLabel())}>
      ${this.templateIconValidation(editor, data)}
      <label>${label}</label>
    </div>`;
  }

  get value(): any {
    if (!this.fields) {
      return this.originalValue;
    }
    return merge({}, this.originalValue, this.fields.value);
  }
}
