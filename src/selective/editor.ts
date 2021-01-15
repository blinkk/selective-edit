import {Config, autoConfig} from '../utility/config';
import {FieldComponent, FieldConstructor} from './field';
import {Fields, FieldsComponent, FieldsConstructor} from './fields';
import {RuleComponent, RuleConstructor} from './validationRules';
import {TemplateResult, html, render} from 'lit-html';
import {Base} from '../mixins';
import {ClassManager} from '../utility/classes';
import {ConfigMixin} from '../mixins/config';
import {DataMixin} from '../mixins/data';
import {DeepObject} from '../utility/deepObject';
import {EVENT_RENDER_COMPLETE} from './events';
import {Template} from './template';
import {Types} from './types';

export class SelectiveEditor extends DataMixin(ConfigMixin(Base)) {
  container?: HTMLElement;
  fields: FieldsComponent;
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

    this.template = defaultTemplate;
    this.fields = new Fields(this.types, {} as Config);
  }

  addFieldType(key: string, FieldCls: FieldConstructor) {
    this.types.fields.registerClass(key, FieldCls);
    this.resetFields();
  }

  addFieldTypes(fieldTypes: Record<string, FieldConstructor>) {
    this.types.fields.registerClasses(fieldTypes);
    this.resetFields();
  }

  addRuleType(key: string, RuleCls: RuleConstructor) {
    this.types.rules.registerClass(key, RuleCls);
  }

  addRuleTypes(ruleTypes: Record<string, RuleConstructor>) {
    this.types.rules.registerClasses(ruleTypes);
  }

  render() {
    // When no container is defined, it is rendered externally.
    if (!this.container || !this.data) {
      return;
    }

    render(this.template(this, this.data), this.container);
    document.dispatchEvent(new CustomEvent(EVENT_RENDER_COMPLETE));
  }

  resetFields(): void {
    this.fields = new Fields(this.types, {} as Config);

    for (const fieldConfigRaw of this.config?.get('fields') || []) {
      this.fields.addField(new Config(fieldConfigRaw));
    }
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
