# Selective Editor

Experimental.

Selective editor for providing a rich UI for editing structured data.

## Usage

The selective editor is broken up into two parts: the core editor and the defaults.

### Core Usage

If you are using the editor and want to control more of the functionality use
the core editor and styling. This doesn't use the dependencies on the
Material Design Components and keeps things slimmed down in size.

SASS:

```sass
@import "selective-edit/sass/selective-core"
```

JS:

```js
import Selective from 'selective-edit'

editor = new Selective(document.querySelector('.editor'), {})

// Need to add your own field types...

// TODO: Once the placeholder field type is working again it will not need to
// have the config set after the field types are added.
editor.setConfig(...)

editor.data = {
  // ...
}
```

### Default Usage

When you want to use the default styling that the example page uses you can use
the selective defaults that include the dependencies on the Material Design Components.

```sass
@import "selective-edit/sass/selective"
```

```js
import Selective from 'selective-edit'
import { defaultFieldTypes } from 'selective-edit/js/selective-defaults'

editor = new Selective(document.querySelector('.editor'))
editor.addFieldTypes(defaultFieldTypes)
// TODO: Once the placeholder field type is working again it will not need to
// have the config set after the field types are added.
editor.setConfig(...)
editor.data = {
  // ...
}
```

## Field Types

The selective editor comes with a few default field types to help make thing easier
to get started but is made to be customized with field types specific to your
usage.

Selective edit uses the `html-lit` package to handle the templating of
fields and UI rendering.

For example, adding a `number` field type:


```js
import Selective from 'selective-edit'
import { Field } from 'selective-edit'

editor = new Selective(document.querySelector('.editor'))

class NumberField extends Field {
  constructor(config) {
    super(config)
    this.fieldType = 'number'

    this.template = (editor, field, data) => html`<div class="selective__field selective__field__${field.fieldType}" data-field-type="${field.fieldType}">
      <label for="${field.getUid()}">${field.label}</label>
      <input type="number" id="${field.getUid()}" value="${field.valueFromData(data)}" @input=${field.handleInput.bind(field)}>
    </div>`
  }
}

editor.addFieldType('number', NumberField)

// TODO: Once the placeholder field type is working again it will not need to
// have the config set after the field types are added.
editor.setConfig({
  fields: [
    {
      "type": "number",
      "key": "counter",
      "label": "Numbers!"
    }
  ]
})

editor.data = {
  counter: 100
}
```

## Development

### Install

```sh
yarn install
```

### Dev Server

```sh
yarn run watch
```

Then visit [localhost:8888](http://localhost:8888/) to view example page.

### Build Assets

```sh
yarn run build
```
