import {TemplateResult, html} from 'lit-html';
import {Base} from '../mixins';
import {Config} from '../utility/config';
import {ConfigMixin} from '../mixins/config';
import {DataMixin} from '../mixins/data';
import {DeepObject} from '../utility/deepObject';
import {SelectiveEditor} from './editor';
import {Template} from './template';
import {Types} from './types';
import {UuidMixin} from '../mixins/uuid';

export interface FieldComponent {
  template: Template;

  /**
   * Field can define any properties or methods they need.
   */
  [x: string]: any;
}

export type FieldConstructor = (types: Types, config: Config) => FieldComponent;

export class Field
  extends UuidMixin(DataMixin(ConfigMixin(Base)))
  implements FieldComponent {
  types: Types;

  constructor(types: Types, config: Config) {
    super();
    this.types = types;
    this.config = config;
  }

  template(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`<div class="selective__field">foo</div>`;
  }
}
