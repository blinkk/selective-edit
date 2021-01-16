import {EVENT_RENDER, EVENT_RENDER_COMPLETE} from './selective/events';
import {FieldConstructor} from './selective/field';
import {ListField} from './selective/field/list';
import {SelectiveEditor} from './index';
import {TextField} from './selective/field/text';
import {TextareaField} from './selective/field/textarea';
import {autoDeepObject} from './utility/deepObject';

const configEl = document.querySelector('#config') as HTMLTextAreaElement;
const dataEl = document.querySelector('#data') as HTMLTextAreaElement;
const fieldsEl = document.querySelector('#fields') as HTMLElement;
const valueEl = document.querySelector('#value') as HTMLTextAreaElement;

/**
 * Basic example of using -selective editor.
 */
const editorConfig = JSON.parse(configEl.value || '') as Record<string, any>;
const exampleSelective = new SelectiveEditor(editorConfig, fieldsEl);

// Add the field types.
exampleSelective.addFieldTypes({
  list: (ListField as unknown) as FieldConstructor,
  text: (TextField as unknown) as FieldConstructor,
  textarea: (TextareaField as unknown) as FieldConstructor,
});

exampleSelective.data = autoDeepObject(JSON.parse(dataEl.value));

// Bind to the custom event to re-render the editor.
document.addEventListener(EVENT_RENDER, () => {
  exampleSelective.render();
});

// Show value after every render as an example.
document.addEventListener(EVENT_RENDER_COMPLETE, () => {
  valueEl.textContent = JSON.stringify(exampleSelective.value, null, 2);
});

exampleSelective.render();
