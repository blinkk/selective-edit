"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const configEl = document.querySelector('#config');
const fieldsEl = document.querySelector('#fields');
/**
 * Basic example of using -selective editor.
 */
const editorConfig = JSON.parse(configEl.value || '');
const exampleSelective = new index_1.SelectiveEditor(editorConfig, fieldsEl);
//# sourceMappingURL=example.js.map