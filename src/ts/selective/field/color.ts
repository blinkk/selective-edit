import {Field, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../../utility/deepObject';
import {Types} from '../types';
import {classMap} from 'lit-html/directives/class-map.js';

export type ColorFieldConfig = FieldConfig;

export class ColorField extends Field {
  config: ColorFieldConfig;

  constructor(
    types: Types,
    config: ColorFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'text'
  ) {
    super(types, config, globalConfig, fieldType);
    this.config = config;
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html`${this.templateHelp(editor, data)}
      <div class=${classMap(this.classesForInput())}>
        <input
          type="color"
          id="${this.uid}"
          @blur=${this.handleBlur.bind(this)}
          @input=${this.handleInput.bind(this)}
          value=${value}
        />
      </div>
      ${this.templateErrors(editor, data)}`;
  }
}
