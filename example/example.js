"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const field_1 = require("./selective/field");
const index_1 = require("./index");
const deepObject_1 = require("./utility/deepObject");
const configEl = document.querySelector('#config');
const dataEl = document.querySelector('#data');
const fieldsEl = document.querySelector('#fields');
/**
 * Basic example of using -selective editor.
 */
const editorConfig = JSON.parse(configEl.value || '');
const exampleSelective = new index_1.SelectiveEditor(editorConfig, fieldsEl);
// Add the field types.
exampleSelective.addFieldTypes({
    text: field_1.TextField,
    textarea: field_1.TextareaField,
});
exampleSelective.data = deepObject_1.autoDeepObject(JSON.parse(dataEl.value));
exampleSelective.render();
// Bind to the custom event to re-render the editor.
document.addEventListener('selective.render', () => {
    exampleSelective.render();
});
//# sourceMappingURL=example.js.map