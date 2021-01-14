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
import {FieldComponent} from './field';

export interface FieldsComponent {
  template: Template;

  /**
   * Fields can define any properties or methods they need.
   */
  [x: string]: any;
}

export type FieldsConstructor = (
  types: Types,
  config: Config
) => FieldsComponent;

export class Fields
  extends UuidMixin(DataMixin(ConfigMixin(Base)))
  implements FieldsComponent {
  private currentValue?: DeepObject;
  fields: Array<FieldComponent>;
  private isLocked: boolean;
  private originalValue?: DeepObject;
  types: Types;

  constructor(types: Types, config: Config) {
    super();
    this.types = types;
    this.config = config;

    this.isLocked = false;
    this.fields = [];
  }

  template(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`<div class="selective__fields">foo</div>`;
  }
}
