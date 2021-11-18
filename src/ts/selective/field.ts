import {DEFAULT_ZONE_KEY, Validation, ValidationLevel} from './validation';
import {GlobalConfig, SelectiveEditor} from './editor';
import {RuleConfig, Rules} from './validationRules';
import {Template, templateInfo} from './template';
import {TemplateResult, html} from 'lit-html';

import {Base} from '../mixins';
import {DataMixin} from '../mixins/data';
import {DataType} from '../utility/dataType';
import {DeepObject} from '../utility/deepObject';
import {EVENT_RENDER} from './events';
import {Types} from './types';
import {UuidMixin} from '../mixins/uuid';
import {classMap} from 'lit-html/directives/class-map.js';
import cloneDeep from 'lodash.clonedeep';
import {guessLabel} from './autoFields';
import {repeat} from 'lit-html/directives/repeat.js';
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
  /**
   * Template for rendering the field.
   */
  template: Template;
  /**
   * Key to use to retrieve and save the value in the data.
   */
  key: string;
  /**
   * Track when an input has lost focus.
   *
   * This allows for the UI to only show an error message after the user has
   * attempted to change the value.
   */
  hasLostFocus(zoneKey?: string): boolean;
  /**
   * Is the field clean?
   *
   * The field is considered clean if there are no changes from the original.
   *
   * This is used by the editor to determine if there are changes pending.
   */
  isClean: boolean;
  /**
   * Is the data provided to the field in the correct format?
   *
   * If a field recieves data that is not in the format expected the field
   * will show a message instead of the normal inputs.
   */
  isDataFormatValid: boolean;
  /**
   * Is the field simple?
   *
   * Complex fields usually have multiple inputs. This is used to determine how
   * the field is shown in non-trivial view. For example, lists will not show a
   * 'simple' view of list items if it uses a complex field.
   */
  isSimple: boolean;
  /**
   * Has the field passed all relative validation rules.
   */
  isValid: boolean;
  /**
   * Internal lock for fields that can get messed up. For example list fields.
   */
  lock(): void;
  /**
   * Mark the zone as having lost focus.
   *
   * This allows for the UI to only show an error message after the user has
   * attempted to change the value.
   */
  lostFocus(zoneKey?: string): void;
  render(): void;
  updateOriginal(editor: SelectiveEditor, data: DeepObject): void;
  /**
   * Internal unlock for fields that can get messed up. For example list fields.
   */
  unlock(): void;
  /**
   * Unique id value for the field. Usually a shortened form of the UUID.
   */
  uid: string;
  /**
   * UUID value for the field.
   */
  uuid: string;
  /**
   * Current value of the field.
   */
  value: any;
}

export type FieldConstructor = (
  types: Types,
  config: InternalFieldConfig
) => FieldComponent;

export interface ZoneInfo {
  key: string;
  hasLostFocus?: boolean;
}

export class Field
  extends UuidMixin(DataMixin(Base))
  implements FieldComponent
{
  config: InternalFieldConfig;
  globalConfig: GlobalConfig;
  protected currentValue?: any;
  protected isLocked: boolean;
  protected isDeepLinked: boolean;
  readonly fieldType: string;
  protected originalValue?: any;
  types: Types;
  usingAutoFields: boolean;
  validation?: Validation;
  zones?: Record<string, ZoneInfo>;
  protected _rules?: Rules;

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
      'selective__field--required': this.validation?.isRequired() || false,
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
    // Deep copy the value to prevent shared reference modification.
    return cloneDeep(value);
  }

  /**
   * Store the validation to keep from having to repeat the validation.
   *
   * Validation is reset every time the updateOriginal is called (every render).
   *
   * @param editor Selective editor being rendered.
   */
  protected ensureValidation(editor?: SelectiveEditor) {
    if (!this.validation) {
      this.validation = new Validation(this.rules);
    }

    // Only validate when the editor is marked for validation
    // or the field has lost the user focus unless delayed.
    if (
      (!editor?.config.delayValidation && this.hasLostFocus()) ||
      editor?.markValidation
    ) {
      const zoneKeys = Object.keys(this.zones ?? {});

      // If there is only the default zone with a default key use simple validation.
      const onlySimpleDefaultZone =
        !this.zones ||
        (zoneKeys.length === 1 &&
          zoneKeys[0] === DEFAULT_ZONE_KEY &&
          this.zones[DEFAULT_ZONE_KEY].key === DEFAULT_ZONE_KEY);

      if (!this.zones || onlySimpleDefaultZone) {
        // Simple field with only the default zone.
        // Simple field.
        this.validation.validate(this.currentValue);
      } else {
        // Complex field, validate each zone separately.
        const value = this.currentValue || {};
        for (const zoneKey of zoneKeys) {
          const valueKey = this.zones[zoneKey].key;
          this.validation.validate(value[valueKey], zoneKey);
        }
      }
    }
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

  /**
   * Handle when the input loses focus.
   */
  handleBlur() {
    // Mark that the field has lost focus.
    this.lostFocus();
    this.render();
  }

  /**
   * Determines if the field has lost focus before for a zone.
   *
   * This is used for UI to determine when to display validation
   * messsages for a better UX when they have not interacted with
   * the field.
   */
  hasLostFocus(zoneKey = DEFAULT_ZONE_KEY): boolean {
    if (!this.zones) {
      return false;
    }
    return this.zones[zoneKey]?.hasLostFocus ?? false;
  }

  get isClean(): boolean {
    // When locked, the field is automatically considered dirty.
    if (this.isLocked) {
      return false;
    }

    return stringify(this.currentValue) === stringify(this.originalValue);
  }

  /**
   * Check if the data format is invalid for what the field expects to edit.
   */
  get isDataFormatValid(): boolean {
    // If there is no value, it is considered valid.
    if (this.originalValue === undefined || this.originalValue === null) {
      return true;
    }

    // Simple fields cannot handle complex data like objects and arrays.
    if (
      this.isSimple &&
      (DataType.isObject(this.originalValue) ||
        DataType.isArray(this.originalValue))
    ) {
      return false;
    }

    return true;
  }

  get isSimple(): boolean {
    // Normal fields are not complex.
    return true;
  }

  get isValid(): boolean {
    // Is valid if there are no results in any zone.
    // When the validation has not been triggered it is also valid.
    return !this.validation || !this.validation.hasAnyResults(null);
  }

  get key(): string {
    return this.config.key;
  }

  /**
   * Certain cases require the field to be locked while updating to prevent
   * bad data mixing. This allows for manually locking the fields.
   */
  lock() {
    this.isLocked = true;
  }

  /**
   * Mark that the field has lost focus for a zone.
   *
   * This is used for UI to determine when to display validation
   * messsages for a better UX when they have not interacted with
   * the field.
   */
  lostFocus(zoneKey = DEFAULT_ZONE_KEY) {
    this.zones = this.zones ?? {};
    this.zones[zoneKey] = this.zones[zoneKey] ?? {
      key: zoneKey,
    };
    this.zones[zoneKey].hasLostFocus = true;
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
   * The default field template has several levels of templates
   * to make it easier for individual fields to override parts of
   * template without needing to replicate a lot of internal template
   * features.
   *
   * Base field template structure:
   *
   * ```
   * template
   * └── templateWrapper
   *     └── templateStructure
   *         ├── templateHeaderStructure
   *         │   ├── templateHeader
   *         │   └── templateLabel
   *         ├── templateInputStructure
   *         │   └── templateInput
   *         └── templateFooterStructure
   *             └── templateFooter
   * ```
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  template(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    // Update the original every time the template is used.
    this.updateOriginal(editor, data);
    this.ensureValidation(editor);
    return this.templateWrapper(editor, data);
  }

  /**
   * Template for showing the invalid data format messaging.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateDataFormatInvalid(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    editor: SelectiveEditor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: DeepObject
  ): TemplateResult {
    return templateInfo(html`The value for this field is not in the expected
    format and cannot be edited in the editor interface.`);
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
    const parts: Array<TemplateResult> = [];
    if (!this.isDataFormatValid) {
      parts.push(this.templateDataFormatInvalid(editor, data));
    } else {
      parts.push(this.templateInput(editor, data));
    }
    return html`<div class="selective__field__input__structure">${parts}</div>`;
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

    if (!this.config.label) {
      this.config.label = guessLabel(this.config.key);
    }

    let requiredMark = html``;

    if (this.validation?.isRequired()) {
      requiredMark = html`<span class="selective__field__label__required"
        >*</span
      >`;
    }

    return html`<div class=${classMap(this.classesForLabel())}>
      ${this.templateIconDeepLink(editor, data)}
      ${this.templateIconValidation(editor, data)}
      <label for=${this.uid}>${this.config.label}${requiredMark}</label>
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
    // Clears the validation each time the original value is updated.
    // Needs to happen every time, even for locked fields.
    this.validation = undefined;

    // Manual locking prevents the original value overwriting the value
    // in special cases when it should not.
    if (this.isLocked) {
      return;
    }

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
