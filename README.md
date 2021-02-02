# Selective Editor

Experimental.

Selective editor for providing a rich UI for editing structured data.

See the [typescript docs][tsdocs] or [example][example].

## Usage

### Styles

For an out-of-box experience you can instead use the styling used by the example.

```sass
@import "selective-edit/sass/selective"
```

If you desire full control over the styling there are a few basic style rules
that the selective editor requires in order to function correctly.

They are available in the `/sass/selective-core.sass` file.

```sass
@import "selective-edit/sass/selective-core"
```

### Javascript

An example of creating a selective editor with an assortment of fields and
validation rules.

```js
import {
  GroupField,
  LengthRule,
  ListField,
  MatchRule,
  PatternRule,
  RangeRule,
  RequireRule,
  SelectField,
  TextField,
  TextareaField,
  VariantField,
} from '@blinkk/selective-edit';

const fieldsEl = document.querySelector('#fields')
const selective = new SelectiveEditor({
  // Control which field types are available for the editor.
  fieldTypes: {
    group: GroupField,
    list: ListField,
    select: SelectField,
    text: TextField,
    textarea: TextareaField,
    variant: VariantField,
  },
  // Control which validation rules are available for the fields.
  ruleTypes: {
    length: LengthRule,
    match: MatchRule,
    pattern: PatternRule,
    range: RangeRule,
    require: RequireRule,
  },
}, fieldsEl);
```

## Field Types

The selective editor comes with several standard field types which can be used
directly or extended and customized. Custom field types can also be designed
and used with the selective editor.

Custom field types can extend one of the existing field types, the base
[Field][doc_Field], or follow the [FieldComponent][doc_FieldComponent] interface.

Selective edit uses the [`html-lit` library](https://lit-html.polymer-project.org/) to handle the UI of the editor.

## Development

To get started, run the `yarn install` command.

### Example Server

The local server provides the ability to test changes to the fields while developing
the field types, validation types, etc.

```sh
yarn run serve
```

Then visit [localhost:8888](http://localhost:8888/) to view example page.

### Writing tests

When writing tests or to have tests be automatically run while making changes use the
`dev` script.

```sh
yarn run dev
```

[doc_Field]: https://blinkkcode.github.io/selective-edit/classes/selective_field.field.html
[doc_FieldComponent]: https://blinkkcode.github.io/selective-edit/interfaces/selective_field.fieldcomponent.html
[example]: https://blinkkcode.github.io/selective-edit/example/
[tsdocs]: https://blinkkcode.github.io/selective-edit/
