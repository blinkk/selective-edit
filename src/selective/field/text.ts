import {TemplateResult, html} from 'lit-html';
import {Config} from '../../utility/config';
import {DeepObject} from '../../utility/deepObject';
import {Field} from '../field';
import {SelectiveEditor} from '../..';
import {Types} from '../types';

export class TextField extends Field {
  constructor(types: Types, config: Config, fieldType = 'text') {
    super(types, config, fieldType);
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html`<input
        class=${this.expandClasses(this.classesForInput())}
        type="text"
        id="${this.uid}"
        placeholder=${this.config?.get('placeholder') || ''}
        @input=${this.handleInput.bind(this)}
        value=${value}
      />
      ${this.templateErrors(editor, data)}`;
  }
}
