import {TemplateResult, html} from 'lit-html';
import {Config} from '../../utility/config';
import {DeepObject} from '../../utility/deepObject';
import {Field} from '../field';
import {SelectiveEditor} from '../..';
import {Types} from '../types';

export class TextareaField extends Field {
  constructor(types: Types, config: Config, fieldType = 'textarea') {
    super(types, config, fieldType);
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html` ${this.templateHelp(editor, data)}<textarea
        class=${this.expandClasses(this.classesForInput())}
        id=${this.uid}
        rows=${this.config?.get('rows') || 6}
        placeholder=${this.config?.get('placeholder') || ''}
        @input=${this.handleInput.bind(this)}
      >
${value}</textarea
      >
      ${this.templateErrors(editor, data)}`;
  }
}
