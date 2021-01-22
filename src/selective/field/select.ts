import {Field, FieldConfig} from '../field';
import {Option, OptionMixin, OptionUIConfig} from '../../mixins/option';
import {TemplateResult, html} from 'lit-html';
import {expandClasses, findParentByClassname} from '../../utility/dom';
import {DataType} from '../../utility/dataType';
import {DeepObject} from '../../utility/deepObject';
import {SelectiveEditor} from '../..';
import {Types} from '../types';

export interface SelectConfig extends FieldConfig {
  /**
   * Allow multiple values to be selected.
   */
  isMulti?: boolean;
  options: Array<Option>;
}

export class SelectField extends OptionMixin(Field) {
  config: SelectConfig;

  constructor(types: Types, config: SelectConfig, fieldType = 'select') {
    super(types, config, fieldType);
    this.config = config;
  }

  /**
   * The value can be either a single value or an array based on the
   * options. Clean up the original value to match the correct
   * options.
   *
   * @param value Original value from the source.
   */
  cleanOriginalValue(value: any): any {
    value = super.cleanOriginalValue(value);

    // Original values need to be sorted when doing multi.
    if (this.config.isMulti) {
      value = value || [];

      // Convert multi to be an array if it was not before.
      if (!DataType.isArray(value)) {
        value = [value];
      }

      value.sort();
      return value;
    }

    // Convert from an array if it was before.
    if (Array.isArray(value)) {
      // Use the first value of the existing array.
      return value[0];
    }
    return value;
  }

  /**
   * Handle when the input changes value.
   *
   * @param evt Input event from changing value.
   */
  handleInput(evt: Event) {
    const target = findParentByClassname(
      evt.target as HTMLInputElement,
      'selective__options__option'
    );

    if (!target) {
      return;
    }

    let value = target.dataset.value;

    // Handle the multi-selection.
    if (this.config.isMulti) {
      let existingValue = this.currentValue || [];
      if (existingValue.includes(value)) {
        existingValue = existingValue.filter((item: any) => item !== value);
      } else {
        existingValue.push(value);
      }
      existingValue.sort();

      // Save the updated value array.
      value = existingValue;
    }

    this.currentValue = value;
    this.render();
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    const optionUiConfig: OptionUIConfig = {
      handleInput: this.handleInput.bind(this),
      isMulti: this.config.isMulti,
      isOptionSelected: (option: Option) => {
        if (this.config.isMulti) {
          return value.includes(option.value);
        }
        return value === option.value;
      },
      showColorHint: this.hasColorHints(this.config.options),
    };

    return html`${this.templateHelp(editor, data)}
      <div class=${expandClasses(this.classesForInput())} id="${this.uid}">
        ${this.templateOptions(
          editor,
          data,
          optionUiConfig,
          this.config.options
        )}
      </div>
      ${this.templateErrors(editor, data)}`;
  }
}
