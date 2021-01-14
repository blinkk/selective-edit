import {Config, autoConfig} from '../utility/config';
import {FieldComponent, FieldConstructor} from './field';
import {Fields, FieldsComponent, FieldsConstructor} from './fields';
import {RuleComponent, RuleConstructor} from './rule';
import {TemplateResult, html, render} from 'lit-html';
import {Base} from '../mixins';
import {ClassManager} from '../utility/classes';
import {ConfigMixin} from '../mixins/config';
import {DataMixin} from '../mixins/data';
import {DeepObject} from '../utility/deepObject';
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
      fields: new ClassManager<FieldConstructor, FieldComponent>(),
      globals: {
        fields: (Fields as unknown) as FieldsConstructor,
      },
      rules: new ClassManager<RuleConstructor, RuleComponent>(),
    };

    this.isLocalized = false;
    this.template = defaultTemplate;
    this.fields = new Fields(this.types, {} as Config);
  }

  addFieldType(key: string, FieldCls: FieldConstructor) {
    this.types.fields.registerClass(key, FieldCls);
  }

  addFieldTypes(fieldTypes: Record<string, FieldConstructor>) {
    this.types.fields.registerClasses(fieldTypes);
  }

  addRuleType(key: string, RuleCls: RuleConstructor) {
    this.types.rules.registerClass(key, RuleCls);
  }

  addRuleTypes(ruleTypes: Record<string, RuleConstructor>) {
    this.types.rules.registerClasses(ruleTypes);
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
