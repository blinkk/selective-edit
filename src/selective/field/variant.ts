import {DeepObject, autoDeepObject} from '../../utility/deepObject';
import {Field, FieldConfig} from '../field';
import {TemplateResult, html} from 'lit-html';
import {FieldsComponent} from '../fields';
import {SelectiveEditor} from '../..';
import {Types} from '../types';
import {findParentByClassname} from '../../utility/dom';
import merge from 'lodash.merge';
import {repeat} from 'lit-html/directives/repeat';

export interface VariantOptionConfig {
  fields: Array<FieldConfig>;
  label?: string;
  help?: string;
}

export interface VariantFieldConfig extends FieldConfig {
  variantLabel?: string;
  variants: Record<string, VariantOptionConfig>;
  placeholder?: string;
}

export class VariantField extends Field {
  config: VariantFieldConfig;
  fields?: FieldsComponent;
  usingAutoFields: boolean;
  variant?: string;

  constructor(types: Types, config: VariantFieldConfig, fieldType = 'variant') {
    super(types, config, fieldType);
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

    return new this.types.globals.FieldsCls(this.types, {
      fields: fieldConfigs,
      isGuessed: this.usingAutoFields,
      parentKey: this.fullKey,
    });
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
    return html`<div class="selective__field__input">
      ${this.templateVariants(editor, data)}${this.templateInput(editor, data)}
    </div>`;
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
      <label>${this.config.variantLabel || 'Variant'}:</label>
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
            ${variants[variantKey].label || variantKey}
          </button>
        `
      )}
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
