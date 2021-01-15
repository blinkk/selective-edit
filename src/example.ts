import {TextField, TextareaField} from './selective/field';
import {FieldsConstructor} from './selective/fields';
import {SelectiveEditor} from './index';
import {autoDeepObject} from './utility/deepObject';

const configEl = document.querySelector('#config') as HTMLTextAreaElement;
const dataEl = document.querySelector('#data') as HTMLTextAreaElement;
const fieldsEl = document.querySelector('#fields') as HTMLElement;

/**
 * Basic example of using -selective editor.
 */

const editorConfig = JSON.parse(configEl.value || '') as Record<string, any>;
const exampleSelective = new SelectiveEditor(editorConfig, fieldsEl);

// Add the field types.
exampleSelective.addFieldTypes({
  text: (TextField as unknown) as FieldsConstructor,
  textarea: (TextareaField as unknown) as FieldsConstructor,
});

exampleSelective.data = autoDeepObject(JSON.parse(dataEl.value));

exampleSelective.render();

// Bind to the custom event to re-render the editor.
document.addEventListener('selective.render', () => {
  exampleSelective.render();
});
