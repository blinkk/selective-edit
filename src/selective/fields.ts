import {TemplateResult, html} from 'lit-html';
import {Base} from '../mixins';
import {ConfigMixin} from '../mixins/config';
import {DataMixin} from '../mixins/data';
import {DeepObject} from '../utility/deepObject';
import {SelectiveEditor} from './editor';
import {Template} from './template';
import {Types} from './types';
import {UuidMixin} from '../mixins/uuid';

export interface FieldsComponent {
  template: Template;

  /**
   * Fields can define any properties or methods they need.
   */
  [x: string]: any;
}

export type FieldsConstructor = (types: Types) => FieldsComponent;

export class Fields
  extends UuidMixin(DataMixin(ConfigMixin(Base)))
  implements FieldsComponent {
  types: Types;

  constructor(types: Types) {
    super();
    this.types = types;
  }

  template(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`<div class="selective__fields">foo</div>`;
  }
}
