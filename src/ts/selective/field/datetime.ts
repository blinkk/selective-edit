import {Field, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {TemplateResult, html} from 'lit-html';
import {DataType} from '../../utility/dataType';
import {DeepObject} from '../../utility/deepObject';
import {Types} from '../types';
import {classMap} from 'lit-html/directives/class-map.js';

export type DatetimeFieldConfig = FieldConfig;

export class DatetimeField extends Field {
  config: DatetimeFieldConfig;

  constructor(
    types: Types,
    config: DatetimeFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'text'
  ) {
    super(types, config, globalConfig, fieldType);
    this.config = config;
  }

  /**
   * Cleanup the datetime strings.
   *
   * @param value Original value from the source.
   */
  cleanOriginalValue(value: any): any {
    value = super.cleanOriginalValue(value);

    // If the datetime string is too long, strip off extra.
    if (value && DataType.isString(value) && value.length > 16) {
      value = value.slice(0, 16);
    }

    return value;
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html`${this.templateHelp(editor, data)}
      <div class=${classMap(this.classesForInput())}>
        <input
          type="datetime-local"
          id="${this.uid}"
          @blur=${this.handleBlur.bind(this)}
          @input=${this.handleInput.bind(this)}
          value=${value}
        />
      </div>
      ${this.templateErrors(editor, data)}`;
  }
}
