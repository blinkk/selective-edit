import {Field, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {Option, OptionMixin} from '../../mixins/option';
import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../../utility/deepObject';
import {Types} from '../types';
import {findParentByClassname} from '../../utility/dom';

export interface CheckboxMultiFieldConfig extends FieldConfig {
  /**
   * Options for the multi checkbox.
   */
  options: Array<Option>;
}

export class CheckboxMultiField extends OptionMixin(Field) {
  config: CheckboxMultiFieldConfig;

  constructor(
    types: Types,
    config: CheckboxMultiFieldConfig,
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
    this.currentValue = this.currentValue || [];
    const value = target.dataset.value;
    if (this.currentValue.includes(value)) {
      this.currentValue = this.currentValue.filter(
        (item: string) => item !== value
      );
    } else {
      this.currentValue.push(value);
    }
    this.render();
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || [];
    return html`${this.templateHelp(editor, data)}
    ${this.templateOptions(
      editor,
      data,
      {
        handleInput: this.handleInput.bind(this),
        isMulti: true, // Treat it as multi-check option to show as checkboxes.
        isOptionSelected: (option: Option) => value.includes(option.value),
      },
      this.config.options
    )}
    ${this.templateErrors(editor, data)}`;
  }
}
