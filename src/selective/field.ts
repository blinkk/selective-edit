import {DEFAULT_ZONE_KEY, Validation, ValidationLevel} from './validation';
import {TemplateResult, html} from 'lit-html';
import {Base} from '../mixins';
import {Config} from '../utility/config';
import {ConfigMixin} from '../mixins/config';
import {DataMixin} from '../mixins/data';
import {DataType} from '../utility/dataType';
import {DeepObject} from '../utility/deepObject';
import {EVENT_RENDER} from './events';
import {Rules} from './validationRules';
import {SelectiveEditor} from './editor';
import {Template} from './template';
import {Types} from './types';
import {UuidMixin} from '../mixins/uuid';
import stringify from 'json-stable-stringify';
import {repeat} from 'lit-html/directives/repeat';

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
  protected currentValue?: any;
  protected isLocked: boolean;
  protected isDeepLinked: boolean;
  readonly fieldType: string;
  protected originalValue?: any;
  rules: Rules;
  types: Types;
  usingAutoFields: boolean;
  validation?: Validation;
  zoneToKey?: Record<string, string>;

  constructor(types: Types, config: Config, fieldType = 'unknown') {
    super();
    this.types = types;
    this.config = config;
    this.fieldType = fieldType;

    this.isLocked = false;
    this.isDeepLinked = false;
    this.usingAutoFields = false;

    // Each field has separate validation rule definitions.
    this.rules = new Rules(this.types.rules);
    const ruleConfigs = this.config?.get('validation');
    if (DataType.isArray(ruleConfigs)) {
      // Validation is an array when it is all one zone.
      for (const ruleConfig of ruleConfigs) {
        this.rules.addRuleFromConfig(new Config(ruleConfig));
      }
    } else if (DataType.isObject(ruleConfigs)) {
      // Complex fields define rules into separate zones.
      for (const zoneKey of Object.keys(ruleConfigs)) {
        for (const ruleConfig of ruleConfigs[zoneKey]) {
          this.rules.addRuleFromConfig(new Config(ruleConfig), zoneKey);
        }
      }
    } else if (ruleConfigs) {
      console.error(
        'Validation rules in an invalid format.',
        'Expecting array or Record<zoneKey, array>.',
        ruleConfigs
      );
    }
  }

  /**
   * Generates a list of classes to apply to the field element.
   */
  classesForField(): Array<string> {
    const classes: Array<string> = [
      'selective__field',
      `selective__field__type__${this.fieldType}`,
    ];

    for (const className of this.config?.get('classes') || []) {
      classes.push(className);
    }

    if (this.usingAutoFields) {
      classes.push('selective__field--auto');
    }

    if (this.config?.get('isGuessed') || false) {
      classes.push('selective__field--guess');
    }

    if (!this.isClean) {
      classes.push('selective__field--dirty');
    }

    if (!this.isValid) {
      classes.push('selective__field--invalid');
    }

    if (this.isDeepLinked) {
      classes.push('selective__field--linked');
    }

    return classes;
  }

  /**
   * Generates a list of classes to apply to the input element.
   */
  classesForInput(zoneKey = DEFAULT_ZONE_KEY): Array<string> {
    const classes: Array<string> = [];

    if (!this.isValid) {
      for (const level of [
        ValidationLevel.Error,
        ValidationLevel.Warning,
        ValidationLevel.Info,
      ]) {
        if (this.validation?.hasAnyResults(zoneKey, level)) {
          classes.push(`selective__field__input--${level}`);
        }
      }
    }

    return classes;
  }

  /**
   * Generates a list of classes to apply to the label element.
   */
  classesForLabel(zoneKey = DEFAULT_ZONE_KEY): Array<string> {
    const classes = ['selective__field__label'];

    if (!this.isValid) {
      if (!this.isValid) {
        for (const level of [
          ValidationLevel.Error,
          ValidationLevel.Warning,
          ValidationLevel.Info,
        ]) {
          if (this.validation?.hasAnyResults(zoneKey, level)) {
            classes.push(`selective__field__label--${level}`);
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

  protected expandClasses(classes: Array<string>): string {
    return classes.join(' ');
  }

  get fullKey(): string {
    const parentKey = this.config?.get('parentKey');
    if (parentKey) {
      return `${parentKey}.${this.key}`;
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

    return (
      stringify(this.currentValue?.obj) === stringify(this.originalValue?.obj)
    );
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
        for (const zoneKey of Object.keys(this.zoneToKey)) {
          const valueKey = this.zoneToKey[zoneKey];
          this.validation.validate(this.currentValue[valueKey], zoneKey);
        }
      }
    }
    // Is valid if there are no results in any zone.
    return !this.validation.hasAnyResults(null);
  }

  get key(): string {
    return this.config?.get('key') || '';
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
   * Template for rendering the field help.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateHelp(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const helpMessage = this.config?.get('help');
    if (!helpMessage) {
      return html``;
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

    return html` <span class="selective__field__invalid">
      <i class="material-icons">error</i>
    </span>`;
  }

  /**
   * Template for rendering the field input.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`<div class="selective__field__input">Input not defined.</div>`;
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
    return html`<div class="selective__field__input">
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
    const label = this.config?.get('label');
    if (!label) {
      return html``;
    }
    return html`<div class=${this.expandClasses(this.classesForLabel())}>
      ${this.templateIconDeepLink(editor, data)}
      ${this.templateIconValidation(editor, data)}
      <label for=${this.uid}>${label}</label>
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
    return html`${this.templateHeader(editor, data)}
    ${this.templateLabel(editor, data)} ${this.templateHelp(editor, data)}
    ${this.templateInputStructure(editor, data)}
    ${this.templateFooter(editor, data)}`;
  }

  /**
   * Template for rendering the field wrapper.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateWrapper(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    return html`<div
      class=${this.expandClasses(this.classesForField())}
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
        this.currentValue = this.config?.get('default');
      }
    }

    if (isClean !== this.isClean) {
      // Clean state has changed. Re-render.
      this.render();
    }
  }
}

export class TextField extends Field {
  constructor(types: Types, config: Config, fieldType = 'text') {
    super(types, config, fieldType);
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html`<input
        class=${this.expandClasses(this.classesForInput())}
        type="text"
        id="${this.uid}"
        placeholder=${this.config?.get('placeholder') || ''}
        @input=${this.handleInput.bind(this)}
        value=${value}
      />
      ${this.templateErrors(editor, data)}`;
  }
}

export class TextareaField extends Field {
  constructor(types: Types, config: Config, fieldType = 'textarea') {
    super(types, config, fieldType);
  }

  templateInput(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const value = this.currentValue || '';
    return html`<textarea
        class=${this.expandClasses(this.classesForInput())}
        id=${this.uid}
        rows=${this.config?.get('rows') || 6}
        placeholder=${this.config?.get('placeholder') || ''}
        @input=${this.handleInput.bind(this)}
      >
${value}</textarea
      >
      ${this.templateErrors(editor, data)}`;
  }
}
