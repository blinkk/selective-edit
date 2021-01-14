import {TemplateResult, html} from 'lit-html';
import {DeepObject} from '../utility/deepObject';
import {SelectiveEditor} from './editor';
import {Template} from './template';
import {Types} from './types';

export interface FieldsComponent {
  template: Template;

  /**
   * Fields can define any properties or methods they need.
   */
  [x: string]: any;
}

export type FieldsConstructor = (types: Types) => FieldsComponent;

export class Fields implements FieldsComponent {
  template: Template;
  types: Types;

  constructor(types: Types) {
    this.types = types;
    this.template = defaultTemplate;
  }
}

function defaultTemplate(
  editor: SelectiveEditor,
  data: DeepObject
): TemplateResult {
  return html`<div class="selective__fields">foo</div>`;
}
