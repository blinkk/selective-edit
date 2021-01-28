import {Field, FieldConfig} from '../field';
import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../../utility/deepObject';
import {SelectiveEditor} from '../editor';
import {Types} from '../types';
import {classMap} from 'lit-html/directives/class-map';

export interface TextAreaFieldConfig extends FieldConfig {
  /**
   * Placeholder for the textarea input.
   */
  placeholder?: string;
  /**
   * Number of rows to use when displaying the textarea.
   */
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
        class=${classMap(this.classesForInput())}
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
