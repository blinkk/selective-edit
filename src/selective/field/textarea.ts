import {Field, FieldConfig} from '../field';
import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../../utility/deepObject';
import {SelectiveEditor} from '../..';
import {Types} from '../types';

export interface TextAreaFieldConfig extends FieldConfig {
  placeholder?: string;
  rows?: number;
}

export class TextareaField extends Field {
  config: TextAreaFieldConfig;

  constructor(
    types: Types,
    config: TextAreaFieldConfig,
    fieldType = 'textarea'
  ) {
    super(types, config, fieldType);
    this.config = config;
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html` ${this.templateHelp(editor, data)}<textarea
        class=${this.expandClasses(this.classesForInput())}
        id=${this.uid}
        rows=${this.config.rows || 6}
        placeholder=${this.config.placeholder || ''}
        @input=${this.handleInput.bind(this)}
      >
${value}</textarea
      >
      ${this.templateErrors(editor, data)}`;
  }
}
