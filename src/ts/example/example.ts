import {
  CheckboxField,
  CheckboxMultiField,
  ColorField,
  DateField,
  DatetimeField,
  GroupField,
  LengthRule,
  ListField,
  MatchRule,
  NumberField,
  PatternRule,
  RadioField,
  RangeRule,
  RequireRule,
  SelectiveEditor,
  TextField,
  TextareaField,
  TimeField,
  VariantField,
} from '../index';
import {EVENT_RENDER, EVENT_RENDER_COMPLETE} from '../selective/events';
import {FieldConstructor, InternalFieldConfig} from '../selective/field';
import {ListFieldConfig} from '../selective/field/list';
import {RuleConstructor} from '../selective/validationRules';
import {autoDeepObject} from '../utility/deepObject';
import merge from 'lodash.merge';

const configEl = document.querySelector('#config') as HTMLTextAreaElement;
const dataEl = document.querySelector('#data') as HTMLTextAreaElement;
const fieldsEl = document.querySelector('#fields') as HTMLElement;
const guessEl = document.querySelector(
  '.content__data__actions button'
) as HTMLButtonElement;
const statusCleanEl = document.querySelector(
  '.status__clean'
) as HTMLSpanElement;
const statusValidEl = document.querySelector(
  '.status__valid'
) as HTMLSpanElement;
const valueEl = document.querySelector('#value') as HTMLTextAreaElement;

/**
 * Basic example of using -selective editor.
 */
const editorConfig = merge(
  {
    fieldTypes: {
      checkbox: CheckboxField as unknown as FieldConstructor,
      checkboxMulti: CheckboxMultiField as unknown as FieldConstructor,
      color: ColorField as unknown as FieldConstructor,
      date: DateField as unknown as FieldConstructor,
      datetime: DatetimeField as unknown as FieldConstructor,
      group: GroupField as unknown as FieldConstructor,
      list: ListField as unknown as FieldConstructor,
      number: NumberField as unknown as FieldConstructor,
      radio: RadioField as unknown as FieldConstructor,
      text: TextField as unknown as FieldConstructor,
      textarea: TextareaField as unknown as FieldConstructor,
      time: TimeField as unknown as FieldConstructor,
      variant: VariantField as unknown as FieldConstructor,
    },
    ruleTypes: {
      length: LengthRule as unknown as RuleConstructor,
      match: MatchRule as unknown as RuleConstructor,
      pattern: PatternRule as unknown as RuleConstructor,
      range: RangeRule as unknown as RuleConstructor,
      require: RequireRule as unknown as RuleConstructor,
    },
  },
  JSON.parse(configEl.value || '') as Record<string, any>
);
const exampleSelective = new SelectiveEditor(editorConfig, fieldsEl);

exampleSelective.data = autoDeepObject(JSON.parse(dataEl.value));

// Bind to the custom event to re-render the editor.
document.addEventListener(EVENT_RENDER, () => {
  exampleSelective.render();
});

// Show value after every render as an example.
document.addEventListener(EVENT_RENDER_COMPLETE, () => {
  valueEl.textContent = JSON.stringify(exampleSelective.value, null, 2);

  // Update status.
  updateStatus(statusCleanEl, exampleSelective.isClean);
  updateStatus(statusValidEl, exampleSelective.isValid);
});

// Allow guessing config based on data.
guessEl.addEventListener('click', () => {
  const configs = exampleSelective.guessFields();

  const deepPrettyFields = (configs: Array<InternalFieldConfig>) => {
    const prettyFields = [];
    for (const config of configs) {
      if ((config as ListFieldConfig).fields) {
        (config as ListFieldConfig).fields = deepPrettyFields(
          (config as ListFieldConfig).fields || []
        );
      }
      config.parentKey = undefined;
      config.isGuessed = undefined;
      prettyFields.push(config);
    }
    return prettyFields;
  };

  const prettyFields = deepPrettyFields(configs);
  configEl.textContent = JSON.stringify({fields: prettyFields}, null, 2);
});

exampleSelective.render();

function updateStatus(element: HTMLSpanElement, isTrue: boolean) {
  if (isTrue) {
    element.textContent = 'True';
    element.classList.add('status--true');
    element.classList.remove('status--false');
  } else {
    element.textContent = 'False';
    element.classList.add('status--false');
    element.classList.remove('status--true');
  }
}

// Style the localhost differently.
if (window.location.hostname === 'localhost') {
  document.body.classList.add('localhost');
}
