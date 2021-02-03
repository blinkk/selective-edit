import {Field, FieldConfig} from '../field';
import {TemplateResult, html} from 'lit-html';
import {DataType} from '../../utility/dataType';
import {DeepObject} from '../../utility/deepObject';
import {SelectiveEditor} from '../editor';
import {Types} from '../types';
import {classMap} from 'lit-html/directives/class-map';

export type DateFieldConfig = FieldConfig;

export class DateField extends Field {
  config: DateFieldConfig;

  constructor(types: Types, config: DateFieldConfig, fieldType = 'text') {
    super(types, config, fieldType);
    this.config = config;
  }

  /**
   * Cleanup the date strings.
   *
   * @param value Original value from the source.
   */
  cleanOriginalValue(value: any): any {
    value = super.cleanOriginalValue(value);

    // If the date string is too long, strip off extra.
    if (value && DataType.isString(value) && value.length > 10) {
      value = value.slice(0, 10);
    }

    return value;
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html`${this.templateHelp(editor, data)}
      <input
        class=${classMap(this.classesForInput())}
        type="date"
        id="${this.uid}"
        @input=${this.handleInput.bind(this)}
        value=${value}
      />
      ${this.templateErrors(editor, data)}`;
  }
}
