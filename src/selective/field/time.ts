import {Field, FieldConfig} from '../field';
import {TemplateResult, html} from 'lit-html';
import {DataType} from '../../utility/dataType';
import {DeepObject} from '../../utility/deepObject';
import {SelectiveEditor} from '../editor';
import {Types} from '../types';
import {classMap} from 'lit-html/directives/class-map';

export type TimeFieldConfig = FieldConfig;

export class TimeField extends Field {
  config: TimeFieldConfig;

  constructor(types: Types, config: TimeFieldConfig, fieldType = 'text') {
    super(types, config, fieldType);
    this.config = config;
  }

  /**
   * Cleanup the time strings.
   *
   * @param value Original value from the source.
   */
  cleanOriginalValue(value: any): any {
    value = super.cleanOriginalValue(value);

    // If the time string is too long, strip off extra.
    if (value && DataType.isString(value) && value.length > 5) {
      value = value.slice(0, 5);
    }

    return value;
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html`${this.templateHelp(editor, data)}
      <input
        class=${classMap(this.classesForInput())}
        type="time"
        id="${this.uid}"
        @input=${this.handleInput.bind(this)}
        value=${value}
      />
      ${this.templateErrors(editor, data)}`;
  }
}
