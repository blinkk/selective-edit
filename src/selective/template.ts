import {DeepObject} from '../utility/deepObject';
import {SelectiveEditor} from './editor';
import {TemplateResult} from 'lit-html';

export interface Template {
  (editor: SelectiveEditor, data: DeepObject): TemplateResult;
}
