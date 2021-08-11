import {Field, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {Option, OptionMixin} from '../../mixins/option';
import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../../utility/deepObject';
import {Types} from '../types';
import {findParentByClassname} from '../../utility/dom';

export interface RadioFieldConfig extends FieldConfig {
  /**
   * Options for the multi checkbox.
   */
  options: Array<Option>;
}

export class RadioField extends OptionMixin(Field) {
  config: RadioFieldConfig;

  constructor(
    types: Types,
    config: RadioFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'checkboxMulti'
  ) {
    super(types, config, globalConfig, fieldType);
    this.config = config;
  }

  handleInput(evt: Event) {
    const target = findParentByClassname(
      evt.target as HTMLElement,
      'selective__options__option'
    );
    if (!target) {
      return;
    }
    this.currentValue = target.dataset.value;
    this.render();
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`${this.templateHelp(editor, data)}
    ${this.templateOptions(
      editor,
      data,
      {
        handleBlur: this.handleBlur.bind(this),
        handleInput: this.handleInput.bind(this),
        isMulti: false,
        isOptionSelected: (option: Option) =>
          this.currentValue === option.value,
      },
      this.config.options
    )}
    ${this.templateErrors(editor, data)}`;
  }
}
