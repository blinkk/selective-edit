import {TemplateResult, html} from 'lit-html';
import {Base} from '../mixins';
import {Config} from '../utility/config';
import {ConfigMixin} from '../mixins/config';
import {DEFAULT_ZONE_KEY} from './validation';
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
  private currentValue?: any;
  private isLocked: boolean;
  private isDeepLinked: boolean;
  readonly fieldType: string;
  private originalValue?: any;
  rules: Rules;
  types: Types;
  usingAutoFields: boolean;

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
    } else {
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

    // TODO: Use validation to set the classes for the given zone.
    // const errors = this.getErrorsForLocale(locale)
    // if (errors) {
    //   const zoneErrors = errors.getErrorsForZone(zoneKey)
    //   const errorTypes = Object.keys(zoneErrors).sort()
    //   const errorLevels = new Set()

    //   if (errorTypes.length) {
    //     classes.push('selective__field__input--error')
    //   }

    //   for (const key of errorTypes) {
    //     classes.push(`selective__field__input--error__${key}`)
    //     const errors = zoneErrors[key]
    //     for (const error of errors) {
    //       errorLevels.add(error.level)
    //     }
    //   }

    //   for (const key of errorLevels) {
    //     classes.push(`selective__field__input--error__level__${key}`)
    //   }
    // }

    return classes;
  }

  /**
   * Generates a list of classes to apply to the label element.
   */
  classesForLabel(zoneKey = DEFAULT_ZONE_KEY): Array<string> {
    const classes = ['selective__field__label'];

    // TODO: Use validation to set the classes for the given zone.
    // if (locale || zoneKey || !this.isLocalized) {
    //   const errors = this.getErrorsForLocale(locale);
    //   if (errors) {
    //     const zoneErrors = errors.getErrorsForZone(zoneKey);
    //     const errorTypes = Object.keys(zoneErrors).sort();
    //     const errorLevels = new Set();

    //     if (errorTypes.length) {
    //       classes.push('selective__field__label--error');
    //     }

    //     for (const key of errorTypes) {
    //       classes.push(`selective__field__label--error__${key}`);
    //       const errors = zoneErrors[key];
    //       for (const error of errors) {
    //         errorLevels.add(error.level);
    //       }
    //     }

    //     for (const key of errorLevels) {
    //       classes.push(`selective__field__label--error__level__${key}`);
    //     }
    //   }
    // }

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
    const parentKey = this.config?.get('parentKey');
    if (parentKey) {
      return `${parentKey}.${this.key}`;
    }
    return this.key;
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
    // TODO: Make this work.
    return true;
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
    return html`<div class="selective__field">foo</div>`;
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
}
