import {Field, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../../utility/deepObject';
import {Types} from '../types';
import {classMap} from 'lit-html/directives/class-map.js';

export interface NumberFieldConfig extends FieldConfig {
  /**
   * Maximum value for the number input.
   */
  max?: number;
  /**
   * Minimum value for the number input.
   */
  min?: number;
  /**
   * Placeholder for the number input.
   */
  placeholder?: string;
  /**
   * Step size for the number input.
   */
  step?: number;
}

export class NumberField extends Field {
  config: NumberFieldConfig;

  constructor(
    types: Types,
    config: NumberFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'text'
  ) {
    super(types, config, globalConfig, fieldType);
    this.config = config;
  }

  /**
   * Handle when the input changes value.
   *
   * @param evt Input event from changing value.
   */
  handleInput(evt: Event) {
    const target = evt.target as HTMLInputElement;
    this.currentValue = parseFloat(target.value) || undefined;
    this.render();
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html`${this.templateHelp(editor, data)}
      <div class=${classMap(this.classesForInput())}>
        <input
          type="number"
          id="${this.uid}"
          placeholder=${this.config.placeholder || ''}
          @blur=${this.handleBlur.bind(this)}
          @input=${this.handleInput.bind(this)}
          max=${this.config.max === undefined ? '' : this.config.max}
          min=${this.config.min === undefined ? '' : this.config.min}
          step=${this.config.step || 1}
          value=${value}
        />
      </div>
      ${this.templateErrors(editor, data)}`;
  }
}
