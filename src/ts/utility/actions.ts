import {TemplateResult, html} from 'lit-html';

import {classMap} from 'lit-html/directives/class-map.js';

export interface ActionsOptions {
  modifier?: 'pre' | 'post';
}

export class Actions {
  actions: Array<TemplateResult> = [];
  options: ActionsOptions;

  constructor(options?: ActionsOptions) {
    this.options = options || {};
  }

  add(action: TemplateResult): void {
    this.actions.push(action);
  }

  get classes(): Record<string, boolean> {
    const classes: Record<string, boolean> = {
      selective__field__actions: true,
    };

    if (this.options.modifier) {
      classes[`selective__field__actions--${this.options.modifier}`] = true;
    }

    return classes;
  }

  template(): TemplateResult {
    return html`<div class=${classMap(this.classes)}>${this.actions}</div>`;
  }
}
