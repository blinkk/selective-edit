"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("../selective/events");
const group_1 = require("../selective/field/group");
const length_1 = require("../selective/rule/length");
const list_1 = require("../selective/field/list");
const match_1 = require("../selective/rule/match");
const pattern_1 = require("../selective/rule/pattern");
const range_1 = require("../selective/rule/range");
const require_1 = require("../selective/rule/require");
const select_1 = require("../selective/field/select");
const index_1 = require("../index");
const text_1 = require("../selective/field/text");
const textarea_1 = require("../selective/field/textarea");
const variant_1 = require("../selective/field/variant");
const deepObject_1 = require("../utility/deepObject");
const lodash_merge_1 = __importDefault(require("lodash.merge"));
const configEl = document.querySelector('#config');
const dataEl = document.querySelector('#data');
const fieldsEl = document.querySelector('#fields');
const guessEl = document.querySelector('.content__data__actions button');
const statusCleanEl = document.querySelector('.status__clean');
const statusValidEl = document.querySelector('.status__valid');
const valueEl = document.querySelector('#value');
/**
 * Basic example of using -selective editor.
 */
const editorConfig = lodash_merge_1.default({
    fieldTypes: {
        group: group_1.GroupField,
        list: list_1.ListField,
        select: select_1.SelectField,
        text: text_1.TextField,
        textarea: textarea_1.TextareaField,
        variant: variant_1.VariantField,
    },
    ruleTypes: {
        length: length_1.LengthRule,
        match: match_1.MatchRule,
        pattern: pattern_1.PatternRule,
        range: range_1.RangeRule,
        require: require_1.RequireRule,
    },
}, JSON.parse(configEl.value || ''));
const exampleSelective = new index_1.SelectiveEditor(editorConfig, fieldsEl);
exampleSelective.data = deepObject_1.autoDeepObject(JSON.parse(dataEl.value));
// Bind to the custom event to re-render the editor.
document.addEventListener(events_1.EVENT_RENDER, () => {
    exampleSelective.render();
});
// Show value after every render as an example.
document.addEventListener(events_1.EVENT_RENDER_COMPLETE, () => {
    valueEl.textContent = JSON.stringify(exampleSelective.value, null, 2);
    // Update status.
    updateStatus(statusCleanEl, exampleSelective.isClean);
    updateStatus(statusValidEl, exampleSelective.isValid);
});
// Allow guessing config based on data.
guessEl.addEventListener('click', () => {
    const configs = exampleSelective.guessFields();
    const deepPrettyFields = (configs) => {
        const prettyFields = [];
        for (const config of configs) {
            if (config.fields) {
                config.fields = deepPrettyFields(config.fields);
            }
            config.parentKey = undefined;
            config.isGuessed = undefined;
            prettyFields.push(config);
        }
        return prettyFields;
    };
    const prettyFields = deepPrettyFields(configs);
    configEl.textContent = JSON.stringify({ fields: prettyFields }, null, 2);
});
exampleSelective.render();
function updateStatus(element, isTrue) {
    if (isTrue) {
        element.textContent = 'True';
        element.classList.add('status--true');
        element.classList.remove('status--false');
    }
    else {
        element.textContent = 'False';
        element.classList.add('status--false');
        element.classList.remove('status--true');
    }
}
// Style the localhost differently.
if (window.location.hostname === 'localhost') {
    document.body.classList.add('localhost');
}
//# sourceMappingURL=example.js.map