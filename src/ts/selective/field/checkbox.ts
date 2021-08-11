import {ColorsConfig, Option, OptionMixin} from '../../mixins/option';
import {Field, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../../utility/deepObject';
import {Types} from '../types';

export interface CheckboxFieldConfig extends FieldConfig {
  /**
   * Color for the color hint.
   */
  color?: string;
  /**
   * Gradient color hint.
   */
  gradient?: ColorsConfig;
  /**
   * Value when checked. If not defined the value is true when
   * the checkbox is checked.
   */
  value?: any;
  /**
   * Value when the field is not checked.
   */
  valueUnchecked?: any;
}

export class CheckboxField extends OptionMixin(Field) {
  config: CheckboxFieldConfig;

  constructor(
    types: Types,
    config: CheckboxFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'checkbox'
  ) {
    super(types, config, globalConfig, fieldType);
    this.config = config;
  }

  get isChecked(): boolean {
    const value = this.currentValue !== undefined ? this.currentValue : false;

    // If there is no value defined, treat the value as a boolean.
    if (this.config.value === undefined) {
      return value === true;
    }

    // TODO: This works for simple data types, but may fail on complex
    // values like objects or arrays.
    return value === this.config.value;
  }

  handleInput() {
    if (this.isChecked) {
      this.currentValue =
        this.config.valueUnchecked !== undefined
          ? this.config.valueUnchecked
          : false;
    } else {
      this.currentValue =
        this.config.value !== undefined ? this.config.value : true;
    }
    this.render();
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`${this.templateOptions(
      editor,
      data,
      {
        handleBlur: this.handleBlur.bind(this),
        handleInput: this.handleInput.bind(this),
        isMulti: true, // Treat it as multi-check option to show as checkbox.
        isOptionSelected: () => this.isChecked,
      },
      [this.config as Option]
    )}
    ${this.templateHelp(editor, data)} ${this.templateErrors(editor, data)}`;
  }

  /**
   * Label on the checkbox field is shown with the checkbox.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateLabel(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html``;
  }
}
