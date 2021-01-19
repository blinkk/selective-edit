import {FieldComponent, FieldConfig, FieldConstructor} from './field';
import {Fields, FieldsComponent, FieldsConstructor} from './fields';
import {RuleComponent, RuleConstructor} from './validationRules';
import {TemplateResult, html, render} from 'lit-html';
import {AutoFields} from './autoFields';
import {Base} from '../mixins';
import {ClassManager} from '../utility/classes';
import {DataMixin} from '../mixins/data';
import {DeepObject} from '../utility/deepObject';
import {EVENT_RENDER_COMPLETE} from './events';
import {Types} from './types';

export interface EditorConfig {
  fieldTypes?: Array<FieldConstructor>;
  fields?: Array<FieldConfig>;
}

export class SelectiveEditor extends DataMixin(Base) {
  config: EditorConfig;
  container?: HTMLElement;
  fields: FieldsComponent;
  isPendingRender: boolean;
  isRendering: boolean;
  types: Types;

  constructor(
    config: EditorConfig | Record<string, any>,
    container?: HTMLElement
  ) {
    super();
    this.container = container;
    this.config = config;
    this.types = {
      fields: new ClassManager<FieldConstructor, FieldComponent>(),
      globals: {
        FieldsCls: (Fields as unknown) as FieldsConstructor,
        AutoFieldsCls: AutoFields,
      },
      rules: new ClassManager<RuleConstructor, RuleComponent>(),
    };
    this.isRendering = false;
    this.isPendingRender = false;
    this.fields = new Fields(this.types, {
      parentKey: '',
    });
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

  guessFields(): Array<FieldConfig> {
    const autoFields = new this.types.globals.AutoFieldsCls({});
    this.config.fields = autoFields.guessFields(this.data?.obj);
    this.resetFields();
    return this.config.fields;
  }

  get isClean(): boolean {
    return this.fields.isClean;
  }

  get isValid(): boolean {
    return this.fields.isValid;
  }

  template(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`<div class="selective">
      ${editor.fields.template(editor, data)}
    </div>`;
  }

  render() {
    // When no container is defined, it is rendered externally.
    if (!this.container || !this.data) {
      return;
    }

    if (this.isRendering) {
      this.isPendingRender = true;
      return;
    }
    this.isPendingRender = false;
    this.isRendering = true;

    const isClean = this.isClean;
    const isValid = this.isValid;
    render(this.template(this, this.data), this.container);

    this.isRendering = false;
    document.dispatchEvent(new CustomEvent(EVENT_RENDER_COMPLETE));

    if (
      this.isPendingRender ||
      this.isClean !== isClean ||
      this.isValid !== isValid
    ) {
      this.render();
    }
  }

  resetFields(): void {
    this.fields = new Fields(this.types, {
      fields: this.config.fields,
      parentKey: '',
    });
    this.render();
  }

  get value(): any {
    return this.fields.value;
  }
}
