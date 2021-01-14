import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../utility/deepObject';
import {SelectiveEditor} from './editor';
import {Template} from './template';
import {Types} from './types';

export interface FieldComponent {
  template: Template;

  /**
   * Field can define any properties or methods they need.
   */
  [x: string]: any;
}

export type FieldConstructor = (types: Types) => FieldComponent;

export class Field implements FieldComponent {
  types: Types;

  constructor(types: Types) {
    this.types = types;
  }

  template(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`<div class="selective__field">foo</div>`;
  }
}
