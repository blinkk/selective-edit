import {TemplateResult, html} from 'lit-html';
import {expandClasses, repeat} from '..';
import {Constructor} from './index';
import {DeepObject} from '../utility/deepObject';
import {SelectiveEditor} from '../selective/editor';
import {ifDefined} from 'lit-html/directives/if-defined';

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
    ): Array<string> {
      const classes: Array<string> = ['selective__options'];

      if (config.isMulti) {
        classes.push('selective__options--multi');
      }

      if (this.hasColorHints(options)) {
        classes.push('selective__options--color-hint');
      }

      if (options.length > 4) {
        classes.push('selective__options--few');
      }

      if (options.length > 11) {
        classes.push('selective__options--many');
      }

      return classes;
    }

    classesForOption(config: OptionUIConfig, option: Option): Array<string> {
      const classes: Array<string> = ['selective__options__option'];

      if (config.isOptionSelected(option)) {
        classes.push('selective__options__option--selected');
      }

      if (option.color) {
        classes.push('selective__options__option--color-hint');
      } else if (option.gradient) {
        classes.push('selective__options__option--color-hint-gradient');
      }

      return classes;
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

    styleForOptionDot(config: OptionUIConfig, option: Option): string {
      if (option.color) {
        return `background-color: ${option.color};`;
      }

      if (!option.gradient || !option.gradient.colors.length) {
        return '';
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

      return `background: linear-gradient(${orientationAngle}, ${breakpoints.join(
        ', '
      )});`;
    }

    templateOption(
      editor: SelectiveEditor,
      data: DeepObject,
      config: OptionUIConfig,
      option: Option
    ): TemplateResult {
      return html`<div
        class=${expandClasses(this.classesForOption(config, option))}
        aria-checked=${config.isOptionSelected(option)}
        data-value=${option.value}
        role=${config.isMulti ? 'checkbox' : 'radio'}
        @click=${config.handleInput}
      >
        <div
          class="selective__options__option__swatch"
          aria-label=${this.ariaLabelForOptionDot(config, option)}
          style=${this.styleForOptionDot(config, option)}
        ></div>
        <label>${option.label || '(Empty)'}</label>
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
        class=${expandClasses(this.classesForOptions(config, options))}
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
