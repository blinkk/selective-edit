import {Config, autoConfig} from '../utility/config';
import {Fields, FieldsComponent, FieldsConstructor} from './fields';
import {TemplateResult, html, render} from 'lit-html';

import {Base} from '../mixins';
import {ClassManager} from '../utility/classes';
import {ConfigMixin} from '../mixins/config';
import {DataMixin} from '../mixins/data';
import {DeepObject} from '../utility/deepObject';
import {FieldConstructor} from './field';
import {RuleConstructor} from './rule';
import {Template} from './template';
import {Types} from './types';

export class SelectiveEditor extends DataMixin(ConfigMixin(Base)) {
  container?: HTMLElement;
  fields: FieldsComponent;
  isLocalized: boolean;
  template: Template;
  types: Types;

  constructor(config: Config | Record<string, any>, container?: HTMLElement) {
    super();
    this.container = container;
    this.config = autoConfig(config);
    this.types = {
      field: new ClassManager<FieldConstructor>(),
      fields: (Fields as unknown) as FieldsConstructor,
      rules: new ClassManager<RuleConstructor>(),
    };

    this.isLocalized = false;
    this.template = defaultTemplate;
    this.fields = new Fields(this.types);
  }

  addFieldType(key: string, FieldCls: FieldConstructor) {
    this.types.field.registerClass(key, FieldCls);
  }

  render(): void {
    // When no container is defined, it is rendered externally.
    if (!this.container || !this.data) {
      return;
    }

    render(this.template(this, this.data), this.container);
    document.dispatchEvent(new CustomEvent('selective.render.complete'));
  }
}

function defaultTemplate(
  editor: SelectiveEditor,
  data: DeepObject
): TemplateResult {
  return html`<div class="selective">
    ${editor.fields.template(editor, data)}
  </div>`;
}
