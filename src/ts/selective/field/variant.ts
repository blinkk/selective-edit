import {DeepObject, autoDeepObject} from '../../utility/deepObject';
import {Field, FieldConfig} from '../field';
import {GlobalConfig, SelectiveEditor} from '../editor';
import {TemplateResult, html} from 'lit-html';

import {DataType} from '../../utility/dataType';
import {FieldsComponent} from '../fields';
import {Types} from '../types';
import {findParentByClassname} from '../../utility/dom';
import merge from 'lodash.merge';
import {repeat} from 'lit-html/directives/repeat.js';

export interface VariantOptionConfig {
  /**
   * Fields to show when the variant is in use.
   */
  fields: Array<FieldConfig>;
  /**
   * Label for the variant option.
   */
  label?: string;
  /**
   * Help text to explain the variant.
   */
  help?: string;
}

export interface VariantFieldConfig extends FieldConfig {
  /**
   * Label for presenting the variants as options.
   */
  variantLabel?: string;
  /**
   * Variant options the user are allowed to select from.
   */
  variants: Record<string, VariantOptionConfig>;
}

export class VariantField extends Field {
  config: VariantFieldConfig;
  fields?: FieldsComponent;
  usingAutoFields: boolean;
  variant?: string;

  constructor(
    types: Types,
    config: VariantFieldConfig,
    globalConfig: GlobalConfig,
    fieldType = 'variant'
  ) {
    super(types, config, globalConfig, fieldType);
    this.config = config;
    this.usingAutoFields = false;
  }

  protected createFields(): FieldsComponent | undefined {
    const variant: string | undefined =
      this.variant || this.originalValue?._variant || this.config.default;

    // If we don't know which variant to use, then skip it.
    if (!variant) {
      return undefined;
    }

    // Use the found variant if it is undefined.
    if (this.variant === undefined) {
      this.variant = variant;
    }

    const variantConfig = this.config.variants[variant] || {};
    const fieldConfigs: Array<FieldConfig> = variantConfig.fields || [];

    return new this.types.globals.FieldsCls(
      this.types,
      {
        fields: fieldConfigs,
        isGuessed: this.usingAutoFields,
        parentKey: this.fullKey,
      },
      this.globalConfig
    );
  }

  protected ensureFields() {
    if (!this.fields) {
      this.fields = this.createFields();
    }
  }

  handleVariantClick(evt: Event) {
    const target = evt.target as HTMLElement;
    const variantTarget = findParentByClassname(
      target,
      'selective__variant__variant'
    );
    const variant = variantTarget?.dataset.variant;

    if (!variant || variant === this.variant) {
      return;
    }
    this.variant = variant;

    // Reset the fields so they can be recreated next render.
    this.fields = undefined;

    this.render();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleVariantClear(evt: Event) {
    this.variant = undefined;

    // Reset the fields so they can be recreated next render.
    this.fields = undefined;

    this.render();
  }

  get isClean(): boolean {
    // If there are no fields, nothing has changed.
    if (!this.fields) {
      return true;
    }

    // Check for changes to the variant.
    if (this.originalValue && this.originalValue._variant !== this.variant) {
      return false;
    }

    return this.fields.isClean;
  }

  /**
   * Check if the data format is invalid for what the field expects to edit.
   */
  get isDataFormatValid(): boolean {
    if (this.originalValue === undefined || this.originalValue === null) {
      return true;
    }

    return DataType.isObject(this.originalValue);
  }

  get isValid(): boolean {
    // If there are no fields, nothing has changed.
    if (!this.fields) {
      return true;
    }
    return this.fields.isValid;
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
    this.ensureFields();

    return html`${this.templateHelp(editor, data)}${this.fields?.template(
      editor,
      autoDeepObject(this.originalValue)
    ) || ''}`;
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
      parts.push(this.templateVariants(editor, data));
      parts.push(this.templateInput(editor, data));
    }
    return html`<div class="selective__field__input__structure">${parts}</div>`;
  }

  /**
   * Template for rendering the variant options.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  templateVariants(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    const variants = this.config.variants;
    const variantKeys = Object.keys(variants).sort();

    return html`<div class="selective__variant__variants">
      ${this.config.variantLabel
        ? html`<label>${this.config.variantLabel}:</label>`
        : ''}
      ${repeat(
        variantKeys,
        variantKey => variantKey,
        variantKey => html`
          <button
            ?disabled=${this.variant !== variantKey &&
            this.fields &&
            !this.fields.isClean}
            class="selective__variant__variant ${this.variant === variantKey
              ? 'selective__variant__variant--selected selective__button--primary'
              : ''}"
            data-variant=${variantKey}
            @click=${this.handleVariantClick.bind(this)}
          >
            <span>${variants[variantKey].label || variantKey}</span>
          </button>
        `
      )}
      ${this.variant
        ? html`<div
            class="selective__variant__clear"
            data-tip="Clear"
            @click=${this.handleVariantClear.bind(this)}
          >
            <span class="material-icons">clear</span>
          </div>`
        : ''}
    </div>`;
  }

  /**
   * Template for rendering the field wrapper.
   *
   * @param editor Selective editor used to render the template.
   * @param data Data provided to render the template.
   */
  templateWrapper(editor: SelectiveEditor, data: DeepObject): TemplateResult {
    // Need to ensure the fields exists before we check for the clean status.
    this.ensureFields();
    return super.templateWrapper(editor, data);
  }

  get value(): Record<string, any> {
    if (!this.fields) {
      return this.originalValue;
    }

    return merge({}, this.originalValue, this.fields.value, {
      _variant: this.variant,
    });
  }
}
