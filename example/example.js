"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("./selective/events");
const list_1 = require("./selective/field/list");
const index_1 = require("./index");
const text_1 = require("./selective/field/text");
const textarea_1 = require("./selective/field/textarea");
const deepObject_1 = require("./utility/deepObject");
const configEl = document.querySelector('#config');
const dataEl = document.querySelector('#data');
const fieldsEl = document.querySelector('#fields');
const guessEl = document.querySelector('.content__data__actions button');
const valueEl = document.querySelector('#value');
/**
 * Basic example of using -selective editor.
 */
const editorConfig = JSON.parse(configEl.value || '');
const exampleSelective = new index_1.SelectiveEditor(editorConfig, fieldsEl);
// Add the field types.
exampleSelective.addFieldTypes({
    list: list_1.ListField,
    text: text_1.TextField,
    textarea: textarea_1.TextareaField,
});
exampleSelective.data = deepObject_1.autoDeepObject(JSON.parse(dataEl.value));
// Bind to the custom event to re-render the editor.
document.addEventListener(events_1.EVENT_RENDER, () => {
    exampleSelective.render();
});
// Show value after every render as an example.
document.addEventListener(events_1.EVENT_RENDER_COMPLETE, () => {
    valueEl.textContent = JSON.stringify(exampleSelective.value, null, 2);
});
// Allow guessing config based on data.
guessEl.addEventListener('click', () => {
    const configs = exampleSelective.guessFields();
    const deepPrettyFields = (configs) => {
        const prettyFields = [];
        for (const config of configs) {
            const prettyConfig = config.config;
            if (prettyConfig['fields']) {
                prettyConfig['fields'] = deepPrettyFields(prettyConfig['fields']);
            }
            prettyFields.push(config.config);
        }
        return prettyFields;
    };
    const prettyFields = deepPrettyFields(configs);
    configEl.textContent = JSON.stringify({ fields: prettyFields }, null, 2);
});
exampleSelective.render();
//# sourceMappingURL=example.js.map