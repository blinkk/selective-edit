import {Field, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../../utility/deepObject';
import {Types} from '../types';
import {classMap} from 'lit-html/directives/class-map.js';

export interface TextAreaFieldConfig extends FieldConfig {
  /**
   * Placeholder for the textarea input.
   */
  placeholder?: string;
  /**
   * Number of rows to use when displaying the textarea.
   */
  rows?: number;
  /**
   * Textarea text wrap strategy.
   *
   * Browser defaults to soft wrapping.
   */
  wrap?: 'hard' | 'soft';
}

export class TextareaField extends Field {
  config: TextAreaFieldConfig;

  constructor(
    types: Types,
    config: TextAreaFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'textarea'
  ) {
    super(types, config, globalConfig, fieldType);
    this.config = config;
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html` ${this.templateHelp(editor, data)}
      <div class=${classMap(this.classesForInput())}>
        <textarea
          id=${this.uid}
          rows=${this.config.rows || 6}
          placeholder=${this.config.placeholder || ''}
          @blur=${this.handleBlur.bind(this)}
          @input=${this.handleInput.bind(this)}
          wrap=${this.config.wrap === undefined ? 'soft' : this.config.wrap}
        >
${value}</textarea
        >
      </div>
      ${this.templateErrors(editor, data)}`;
  }
}
