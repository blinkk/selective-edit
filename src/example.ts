import {SelectiveEditor} from './index';

const configEl = document.querySelector('#config') as HTMLTextAreaElement;
const fieldsEl = document.querySelector('#fields') as HTMLElement;

/**
 * Basic example of using -selective editor.
 */

const editorConfig = JSON.parse(configEl.value || '') as Record<string, any>;
const exampleSelective = new SelectiveEditor(fieldsEl, editorConfig);
