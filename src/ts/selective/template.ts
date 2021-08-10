import {TemplateResult, html} from 'lit-html';

import {DeepObject} from '../utility/deepObject';
import {SelectiveEditor} from './editor';

export interface Template {
  (editor: SelectiveEditor, data: DeepObject): TemplateResult;
}

export function templateError(message: TemplateResult): TemplateResult {
  return html`<div class="selective__error">
    <div class="selective__error__icon">
      <span class="material-icons">error</span>
    </div>
    <div class="selective__error__message">${message}</div>
  </div>`;
}

export function templateInfo(message: TemplateResult): TemplateResult {
  return html`<div class="selective__info">
    <div class="selective__info__icon">
      <span class="material-icons">info</span>
    </div>
    <div class="selective__info__message">${message}</div>
  </div>`;
}

export function templateWarning(message: TemplateResult): TemplateResult {
  return html`<div class="selective__warning">
    <div class="selective__warning__icon">
      <span class="material-icons">warning</span>
    </div>
    <div class="selective__warning__message">${message}</div>
  </div>`;
}
