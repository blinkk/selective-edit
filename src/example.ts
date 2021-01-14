import {TemplateResult, html, render} from 'lit-html';

const container = document.querySelector('.container');
const template = (data: Record<string, any>): TemplateResult =>
  html`${data.foo}`;

if (container) {
  render(
    template({
      foo: 'bar',
    }),
    container
  );
}
