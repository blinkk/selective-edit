import {Field, FieldConfig} from '../field';
import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../../utility/deepObject';
import {SelectiveEditor} from '../..';
import {Types} from '../types';

export interface TextFieldConfig extends FieldConfig {
  placeholder?: string;
}

export class TextField extends Field {
  config: TextFieldConfig;

  constructor(types: Types, config: TextFieldConfig) {
    super(types, config, 'text');
    this.config = config;
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html`${this.templateHelp(editor, data)}
      <input
        class=${this.expandClasses(this.classesForInput())}
        type="text"
        id="${this.uid}"
        placeholder=${this.config.placeholder || ''}
        @input=${this.handleInput.bind(this)}
        value=${value}
      />
      ${this.templateErrors(editor, data)}`;
  }
}
