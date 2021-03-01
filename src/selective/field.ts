import {DEFAULT_ZONE_KEY, Validation, ValidationLevel} from './validation';
import {GlobalConfig, SelectiveEditor} from './editor';
import {RuleConfig, Rules} from './validationRules';
import {TemplateResult, html} from 'lit-html';
import {Base} from '../mixins';
import {DataMixin} from '../mixins/data';
import {DataType} from '../utility/dataType';
import {DeepObject} from '../utility/deepObject';
import {EVENT_RENDER} from './events';
import {Template} from './template';
import {Types} from './types';
import {UuidMixin} from '../mixins/uuid';
import {classMap} from 'lit-html/directives/class-map';
import {repeat} from 'lit-html/directives/repeat';
import stringify from 'json-stable-stringify';

export interface FieldConfig {
  /**
   * Extra css classes to apply to the field in the editor.
   */
  classes?: Array<string>;
  /**
   * default value to use for the field.
   */
  default?: any;
  /**
   * Help string to display to assist user in understanding the
   * expectations of the field.
   *
   * In complex fields, this can be broken up into zones like
   * validation rules.
   */
  help?: string | Record<string, string>;
  /**
   * Key to reference the field in the data.
   */
  key: string;
  /**
   * Label for the field in the editor.
   */
  label?: string;
  /**
   * Type of field. Used to create the correct field in the
   * editor UI.
   */
  type: string;
  /**
   * Validation rules that should be applied to the field.
   *
   * In complex fields, this can be broken up into zone like
   * help text.
   */
  validation?: Array<RuleConfig> | Record<string, Array<RuleConfig>>;
}

/**
 * Protected values for the field config.
 *
 * These are reserved for internal usage and should not be overwritten
 * by individual field configurations.
 *
 * When adding new protected configs, they cannot be required as that would
 * break the interface for the base `FieldConfig`.
 */
export interface FieldProtectedConfig {
  /**
   * Set by the editor when the field was guessed by the auto
   * fields utility.
   */
  isGuessed?: boolean;
  /**
   * Set by the editor to allow for full reference to the
   * current field structure.
   */
  parentKey?: string;
}

export type InternalFieldConfig = FieldConfig & FieldProtectedConfig;

export interface FieldComponent {
  template: Template;
  key: string;
  isClean: boolean;
  isValid: boolean;
  lock(): void;
  render(): void;
  updateOriginal(editor: SelectiveEditor, data: DeepObject): void;
  unlock(): void;
  uuid: string;
  value: any;
}

export type FieldConstructor = (
  types: Types,
  config: InternalFieldConfig
) => FieldComponent;

export class Field
  extends UuidMixin(DataMixin(Base))
  implements FieldComponent {
  config: InternalFieldConfig;
  globalConfig: GlobalConfig;
  protected currentValue?: any;
  protected isLocked: boolean;
  protected isDeepLinked: boolean;
  readonly fieldType: string;
  protected originalValue?: any;
  protected _rules?: Rules;
  types: Types;
  usingAutoFields: boolean;
  validation?: Validation;
  zoneToKey?: Record<string, string>;

  constructor(
    types: Types,
    config: InternalFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'unknown'
  ) {
    super();
    this.types = types;
    this.config = config;
    this.globalConfig = globalConfig;
    this.fieldType = fieldType;

    this.isLocked = false;
    this.isDeepLinked = false;
    this.usingAutoFields = false;
  }

  /**
   * Generates a list of classes to apply to the field element.
   */
  classesForField(): Record<string, boolean> {
    const classes: Record<string, boolean> = {
      selective__field: true,
      'selective__field--auto': this.usingAutoFields,
      'selective__field--dirty': !this.isClean,
      'selective__field--guess': this.config.isGuessed || false,
      'selective__field--invalid': !this.isValid,
      'selective__field--linked': this.isDeepLinked,
    };

    classes[`selective__field__type__${this.fieldType}`] = true;

    for (const className of this.config.classes || []) {
      classes[className] = true;
    }

    return classes;
  }

  /**
   * Generates a list of classes to apply to the input element.
   */
  classesForInput(zoneKey = DEFAULT_ZONE_KEY): Record<string, boolean> {
    const classes: Record<string, boolean> = {
      selective__field__input: true,
    };

    if (!this.isValid) {
      for (const level of [
        ValidationLevel.Error,
        ValidationLevel.Warning,
        ValidationLevel.Info,
      ]) {
        if (this.validation?.hasAnyResults(zoneKey, level)) {
          classes[`selective__field__input--${level}`] = true;
        }
      }
    }

    return classes;
  }

  /**
   * Generates a list of classes to apply to the label element.
   */
  classesForLabel(zoneKey = DEFAULT_ZONE_KEY): Record<string, boolean> {
    const classes: Record<string, boolean> = {
      selective__field__label: true,
    };

    if (!this.isValid) {
      if (!this.isValid) {
        for (const level of [
          ValidationLevel.Error,
          ValidationLevel.Warning,
          ValidationLevel.Info,
        ]) {
          if (this.validation?.hasAnyResults(zoneKey, level)) {
            classes[`selective__field__label--${level}`] = true;
          }
        }
      }
    }

    return classes;
  }

  /**
   * The format of the original value may need to be cleaned up to be used
   * by the editor in a consistent format.
   *
   * @param value Original value from the source.
   */
  cleanOriginalValue(value: any): any {
    // Copy the array to prevent shared array.
    if (DataType.isArray(value)) {
      value = [...value];
    }

    return value;
  }

  get fullKey(): string {
    if (this.config.parentKey) {
      return `${this.config.parentKey}.${this.key}`;
    }
    return this.key;
  }

  /**
   * Handle when the input changes value.
   *
   * @param evt Input event from changing value.
   */
  handleInput(evt: Event) {
    const target = evt.target as HTMLInputElement;
    this.currentValue = target.value;
    this.render();
  }

  get isClean(): boolean {
    // When locked, the field is automatically considered dirty.
    if (this.isLocked) {
      return false;
    }

    return stringify(this.currentValue) === stringify(this.originalValue);
  }

  get isValid(): boolean {
    // Store the validation to keep from having to repeat the validation.
    // Is reset every time the updateOriginal is called (every render).
    if (!this.validation) {
      this.validation = new Validation(this.rules);

      if (!this.zoneToKey) {
        // Simple field, only the default zone.
        this.validation.validate(this.currentValue);
      } else {
        // Complex field, validate each zone separately.
        const value = this.currentValue || {};
        for (const zoneKey of Object.keys(this.zoneToKey)) {
          const valueKey = this.zoneToKey[zoneKey];
          this.validation.validate(value[valueKey], zoneKey);
        }
      }
    }
    // Is valid if there are no results in any zone.
    return !this.validation.hasAnyResults(null);
  }

  get key(): string {
    return this.config.key;
  }

  /**
   * Certain cases require the field to be locked while updating to prevent bad
   * data mixing. This allows for manually locking the fields.
   */
  lock() {
    this.isLocked = true;
  }

  /**
   * Signal for the editor to re-render.
   */
  render() {
    document.dispatchEvent(new CustomEvent(EVENT_RENDER));
  }

  get rules(): Rules {
    if (this._rules) {
      return this._rules;
    }

    // Each field has separate validation rule definitions.
    this._rules = new Rules(this.types.rules);
    let ruleConfigs = this.config?.validation || [];
    if (DataType.isArray(ruleConfigs)) {
      // Validation is an array when it is all one zone.
      ruleConfigs = ruleConfigs as Array<RuleConfig>;
      for (const ruleConfig of ruleConfigs) {
        this.rules.addRuleFromConfig(ruleConfig);
      }
    } else if (DataType.isObject(ruleConfigs)) {
      // Complex fields define rules into separate zones.
      ruleConfigs = ruleConfigs as Record<string, Array<RuleConfig>>;
      for (const zoneKey of Object.keys(ruleConfigs)) {
        for (const ruleConfig of ruleConfigs[zoneKey]) {
          this.rules.addRuleFromConfig(ruleConfig, zoneKey);
        }
      }
    } else if (ruleConfigs) {
      console.error(
        'Validation rules in an invalid format.',
        'Expecting array or Record<zoneKey, array>.',
        ruleConfigs
      );
    }
    return this._rules;
  }

  /**
   * Template for determining how to render the field.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  template(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    // Update the original every time the template is used.
    this.updateOriginal(editor, data);
    return this.templateWrapper(editor, data);
  }

  /**
   * Template for rendering the errors.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   * @param zoneKey Zone to provide the error messages for.
   */
  templateErrors(
    editor: SelectiveEditor,
    data: DeepObject,
    zoneKey?: string
  ): TemplateResult {
    if (this.isValid) {
      return html``;
    }

    const results = this.validation?.getResults(zoneKey) || [];
    if (!results.length) {
      return html``;
    }

    return html`<div class="selective__field__errors">
      ${repeat(
        results,
        result => result.uuid,
        result => html`
          <div
            class="selective__field__error selective__field__error--level__${result.level}"
            data-error-level="${result.level}"
          >
            ${result.message}
          </div>
        `
      )}
    </div>`;
  }

  /**
   * Template for rendering the field footer.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateFooter(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html``;
  }

  /**
   * Template for rendering the field footer structure.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateFooterStructure(
    editor: SelectiveEditor,
    data: DeepObject
  ): TemplateResult {
    return html`<div class="selective__field__footer">
      ${this.templateFooter(editor, data)}
    </div>`;
  }

  /**
   * Template for rendering the field header.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateHeader(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html``;
  }

  /**
   * Template for rendering the field header structure.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateHeaderStructure(
    editor: SelectiveEditor,
    data: DeepObject
  ): TemplateResult {
    return html`<div class="selective__field__header">
      ${this.templateHeader(editor, data)} ${this.templateLabel(editor, data)}
    </div>`;
  }

  /**
   * Template for rendering the field help.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   * @param zoneKey Zone to provide the error messages for.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateHelp(
    editor: SelectiveEditor,
    data: DeepObject,
    zoneKey?: string
  ): TemplateResult {
    let helpMessage = this.config.help;
    if (!helpMessage) {
      return html``;
    }

    // Allow for help messages to be broken up into zones.
    if (zoneKey && DataType.isObject(helpMessage)) {
      helpMessage = helpMessage as Record<string, string>;
      helpMessage = helpMessage[zoneKey];
    }

    return html`<div class="selective__field__help">${helpMessage}</div>`;
  }

  /**
   * Template for rendering the icon for deep linking.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateIconDeepLink(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editor: SelectiveEditor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: DeepObject
  ): TemplateResult {
    return html``;
  }

  /**
   * Template for rendering the icon for validation.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateIconValidation(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editor: SelectiveEditor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: DeepObject
  ): TemplateResult {
    if (this.isValid) {
      return html``;
    }

    return html`<span class="selective__field__invalid">
      <i class="material-icons">error</i>
    </span>`;
  }

  /**
   * Template for rendering the field input.
   *
   * The help text is part of the input template so complex inputs can
   * use zones for the help text.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`${this.templateHelp(editor, data)}
      <div class="selective__field__input">Input not defined.</div>`;
  }

  /**
   * Template for rendering the field input structure.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateInputStructure(
    editor: SelectiveEditor,
    data: DeepObject
  ): TemplateResult {
    return html`<div class="selective__field__input__structure">
      ${this.templateInput(editor, data)}
    </div>`;
  }

  /**
   * Template for rendering the field label.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateLabel(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    if (!this.config.label) {
      return html``;
    }
    return html`<div class=${classMap(this.classesForLabel())}>
      ${this.templateIconDeepLink(editor, data)}
      ${this.templateIconValidation(editor, data)}
      <label for=${this.uid}>${this.config.label}</label>
    </div>`;
  }

  /**
   * Template for rendering the field structure.
   *
   * Used for controlling the order that parts of the field are rendered.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateStructure(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`${this.templateHeaderStructure(editor, data)}
    ${this.templateInputStructure(editor, data)}
    ${this.templateFooterStructure(editor, data)}`;
  }

  /**
   * Template for rendering the field wrapper.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateWrapper(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`<div
      class=${classMap(this.classesForField())}
      data-field-type=${this.fieldType}
      data-field-full-key=${this.fullKey}
    >
      ${this.templateStructure(editor, data)}
    </div>`;
  }

  /**
   * Certain cases require the field to be locked while updating to prevent bad
   * data mixing. This allows for manually unlocking the fields.
   */
  unlock() {
    this.isLocked = false;
  }

  /**
   * Use the data passed to render to update the original value.
   * Also update the clean value when applicable.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  updateOriginal(editor: SelectiveEditor, data: DeepObject) {
    // Manual locking prevents the original value overwriting the value
    // in special cases when it should not.
    if (this.isLocked) {
      return;
    }

    // Clears the validation each time the original value is updated.
    this.validation = undefined;

    // Where there is no key, just assume that the current value is undefined.
    // if (!this.key) {
    //   this.currentValue = undefined;
    //   return;
    // }

    let newValue = data.get(this.key);

    const isClean = this.isClean;

    // Cleaning up the origina value.
    newValue = this.cleanOriginalValue(newValue);

    this.originalValue = newValue;

    // Only if the field is clean, update the value.
    if (isClean) {
      // Clean the value again to cleanup references like arrays.
      this.currentValue = this.cleanOriginalValue(newValue);

      if (this.currentValue === undefined) {
        this.currentValue = this.config.default;
      }
    }

    if (isClean !== this.isClean) {
      // Clean state has changed. Re-render.
      this.render();
    }
  }

  get value(): any {
    return this.currentValue;
  }
}
