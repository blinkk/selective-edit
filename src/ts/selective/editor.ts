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

/**
 * Globally accessible configuration. Allow for passing arbitrary
 * information to fields.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GlobalConfig {}

export interface EditorConfig {
  /**
   * Optionally provide the field types that the editor understands.
   */
  fieldTypes?: Record<string, FieldConstructor>;
  /**
   * Optionally provide the validation rules that the fields can use.
   */
  ruleTypes?: Record<string, RuleConstructor>;
  /**
   * Optionally define an initial set of field configurations.
   */
  fields?: Array<FieldConfig>;
  /**
   * Global configuration for all of the fields.
   *
   * This allows for passing things that fields will need access to
   * such as an api or additional global meta information.
   */
  global?: GlobalConfig;
  /**
   * Delay the validation until marked for validation.
   *
   * The default for the editor is to show validation messages after
   * the user has left the fields. This provides a better user
   * experience for longer forms but can be disruptive on smaller forms.
   *
   * By delaying the validation the editor will not run the field
   * validation until the `markValidation` is set to `true` and
   * the editor is re-rendered.
   */
  delayValidation?: boolean;
}

export class SelectiveEditor extends DataMixin(Base) {
  config: EditorConfig;
  container?: HTMLElement;
  fields: FieldsComponent;
  /**
   * Controls when the validation should be checked across all the
   * fields in the editor.
   *
   * **Note:** Render cycle needs to complete before the validation can
   * be trusted.
   */
  markValidation?: boolean;
  isPendingRender: boolean;
  isRendering: boolean;
  types: Types;

  constructor(config: EditorConfig, container?: HTMLElement) {
    super();
    this.container = container;
    this.config = config;
    this.types = {
      fields: new ClassManager<FieldConstructor, FieldComponent>(),
      globals: {
        FieldsCls: Fields as unknown as FieldsConstructor,
        AutoFieldsCls: AutoFields,
      },
      rules: new ClassManager<RuleConstructor, RuleComponent>(),
    };
    this.isRendering = false;
    this.isPendingRender = false;

    if (this.config.fieldTypes) {
      this.types.fields.registerClasses(this.config.fieldTypes);
    }
    if (this.config.ruleTypes) {
      this.types.rules.registerClasses(this.config.ruleTypes);
    }

    this.fields = new Fields(
      this.types,
      {
        fields: this.config.fields,
        parentKey: '',
      },
      this.config.global || {}
    );
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

    if (!this.data) {
      this.config.fields = [];
      this.resetFields();
      return this.config.fields;
    }

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
    this.fields = new Fields(
      this.types,
      {
        fields: this.config.fields,
        parentKey: '',
      },
      this.config.global || {}
    );
    this.render();
  }

  get value(): any {
    return this.fields.value;
  }
}
