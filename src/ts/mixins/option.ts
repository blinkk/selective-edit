import {TemplateResult, html} from 'lit-html';
import {Constructor} from './index';
import {DeepObject} from '../utility/deepObject';
import {SelectiveEditor} from '../selective/editor';
import {classMap} from 'lit-html/directives/class-map.js';
import {ifDefined} from 'lit-html/directives/if-defined.js';
import {repeat} from 'lit-html/directives/repeat.js';
import {styleMap} from 'lit-html/directives/style-map.js';

/**
 * Orientation for colors gradient.
 */
export enum ColorsOrientation {
  Vertical = 'vertical',
  Horizontal = 'horizontal',
  Slope = 'slope',
}

export interface ColorsConfig {
  colors: Array<string>;
  /**
   * Use a smooth color gradient?
   */
  isSmooth?: boolean;
  /**
   * Orientation for the color gradient.
   */
  orientation?: ColorsOrientation;
}

export interface Option {
  /**
   * Color for the color hint.
   */
  color?: string;
  /**
   * Gradient color hint.
   */
  gradient?: ColorsConfig;
  /**
   * Value when the option is selected.
   */
  value: any;
  /**
   * Label for the option.
   */
  label: string;
}

export interface OptionUiComponent {
  templateOption(editor: SelectiveEditor, option: Option): TemplateResult;
}

export interface OptionUIConfig {
  handleBlur: (evt: Event) => void;
  handleInput: (evt: Event) => void;
  isMulti?: boolean;
  isOptionSelected: (option: Option) => boolean;
  showColorHint?: boolean;
}

export function OptionMixin<TBase extends Constructor>(Base: TBase) {
  return class OptionClass extends Base {
    ariaLabelForOptionDot(config: OptionUIConfig, option: Option): string {
      if (option.color) {
        return option.color;
      }

      if (!option.gradient || !option.gradient.colors.length) {
        return option.label;
      }

      return option.gradient.colors.join(', ');
    }

    classesForOptions(
      config: OptionUIConfig,
      options: Array<Option>
    ): Record<string, boolean> {
      return {
        selective__options: true,
        'selective__options--color-hint': this.hasColorHints(options),
        'selective__options--few': options.length > 4,
        'selective__options--many': options.length > 11,
        'selective__options--multi': config.isMulti || false,
      };
    }

    classesForOption(
      config: OptionUIConfig,
      option: Option
    ): Record<string, boolean> {
      return {
        selective__options__option: true,
        'selective__options__option--selected': config.isOptionSelected(option),
        'selective__options__option--color-hint': Boolean(option.color),
        'selective__options__option--color-hint-gradient': Boolean(
          option.gradient
        ),
      };
    }

    /**
     * Are there color hints?
     */
    hasColorHints(options: Array<Option>): boolean {
      for (const option of options) {
        if (option.color || option.gradient) {
          return true;
        }
      }
      return false;
    }

    stylesForOptionDot(
      config: OptionUIConfig,
      option: Option
    ): Record<string, string> {
      if (option.color) {
        return {
          backgroundColor: option.color,
        };
      }

      if (!option.gradient || !option.gradient.colors.length) {
        return {};
      }

      const gradient = option.gradient;

      let orientationAngle = '0deg';
      if (gradient.orientation === ColorsOrientation.Horizontal) {
        orientationAngle = '90deg';
      } else if (gradient.orientation === ColorsOrientation.Slope) {
        orientationAngle = '45deg';
      }

      const isSmooth = gradient.isSmooth || false;
      const breakpoints: Array<string> = [`${gradient.colors[0]} 0%`];
      const numBreakpoints = isSmooth
        ? gradient.colors.length - 1
        : gradient.colors.length;

      let breakpoint = Math.floor(100 / numBreakpoints);
      let lastColor = null;
      for (const color of gradient.colors) {
        if (!lastColor) {
          lastColor = color;
          continue;
        }

        if (!isSmooth) {
          breakpoints.push(`${lastColor} ${breakpoint}%`);
        }
        breakpoints.push(`${color} ${breakpoint}%`);
        breakpoint += breakpoint;
        lastColor = color;
      }

      if (!isSmooth) {
        breakpoints.push(`${gradient.colors[gradient.colors.length - 1]} 100%`);
      }

      return {
        backgroundImage: `linear-gradient(${orientationAngle}, ${breakpoints.join(
          ', '
        )})`,
      };
    }

    templateColorSwatch(
      editor: SelectiveEditor,
      data: DeepObject,
      config: OptionUIConfig,
      option: Option
    ): TemplateResult {
      if (!option.color && !option.gradient) {
        return html``;
      }

      return html`<div
        class="selective__swatch"
        aria-label=${this.ariaLabelForOptionDot(config, option)}
        style=${styleMap(this.stylesForOptionDot(config, option))}
      ></div>`;
    }

    templateOption(
      editor: SelectiveEditor,
      data: DeepObject,
      config: OptionUIConfig,
      option: Option
    ): TemplateResult {
      let icon = '';
      if (config.isOptionSelected(option)) {
        icon = config.isMulti ? 'check_box' : 'radio_button_checked';
      } else {
        icon = config.isMulti
          ? 'check_box_outline_blank'
          : 'radio_button_unchecked';
      }

      return html`<div
        class=${classMap(this.classesForOption(config, option))}
        aria-checked=${config.isOptionSelected(option)}
        data-value=${option.value}
        tabindex="0"
        role=${config.isMulti ? 'checkbox' : 'radio'}
        @blur=${config.handleBlur}
        @click=${config.handleInput}
        @keypress=${(evt: KeyboardEvent) => {
          if (evt.code === 'Space') {
            evt.preventDefault();
            config.handleInput(evt);
          }
        }}
      >
        <span class="material-icons">${icon}</span>
        ${this.templateColorSwatch(editor, data, config, option)}
        <label>${option.label || option.value || '(Empty)'}</label>
      </div>`;
    }

    templateOptions(
      editor: SelectiveEditor,
      data: DeepObject,
      config: OptionUIConfig,
      options: Array<Option>
    ): TemplateResult {
      // TODO: Convert to a different UI when there are a lot of options.
      return html`<div
        class=${classMap(this.classesForOptions(config, options))}
        role=${ifDefined(config.isMulti ? undefined : 'radiogroup')}
      >
        ${repeat(
          options,
          option => option.value,
          option => this.templateOption(editor, data, config, option)
        )}
      </div>`;
    }
  };
}
