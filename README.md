# Selective Editor

Experimental.

Selective editor for providing a rich UI for editing structured data.

See the [typescript docs][tsdocs] or [example][example].

[![codecov](https://codecov.io/gh/blinkk/selective-edit/branch/main/graph/badge.svg?token=VdpVUcYr4n)](https://codecov.io/gh/blinkk/selective-edit)

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

See the [example][example] and [example source][example_source] to see how to
create a selective editor with an assortment of fields and validation rules.

## Field types

The selective editor comes with several standard field types which can be used
directly or extended and customized. Custom field types can also be designed
and used with the selective editor.

Custom field types can extend one of the existing field types, the base
[Field][doc_Field], or follow the [FieldComponent][doc_FieldComponent] interface.

Selective edit uses the [`html-lit` library](https://lit-html.polymer-project.org/) to handle the UI of the editor.

## Validation rule types

Every field can be validated. Selective edit comes with some basic rules
(length, matching, pattern matching, range, required), but projects can also define
their own validation rules. Follow the [RuleComponent][doc_RuleComponent] interface to
create a custom rule or extend one of the existing rules to improve it for your needs.

## Field config

The editor uses field configurations to control what to display in the editor.

```js
// Add a field for the editor to display.
selective.fields.addField({
  type: "text",
  key: "title",
  label: "Title",
  help: "Title for the data.",
})
```

Different field types have different configurations options:

  - [Checkbox][doc_FieldConfig_CheckboxField]
  - [CheckboxMulti][doc_FieldConfig_CheckboxMultiField]
  - [Color][doc_FieldConfig_ColorField]
  - [Date][doc_FieldConfig_DateField]
  - [Datetime][doc_FieldConfig_DatetimeField]
  - [Group][doc_FieldConfig_GroupField]
  - [List][doc_FieldConfig_ListField]
  - [Number][doc_FieldConfig_NumberField]
  - [Radio][doc_FieldConfig_RadioField]
  - [Text][doc_FieldConfig_TextField]
  - [Textarea][doc_FieldConfig_TextareaField]
  - [Time][doc_FieldConfig_TimeField]
  - [Variant][doc_FieldConfig_VariantField]

[doc_Field]: https://blinkk.github.io/selective-edit/classes/selective_field.field.html
[doc_FieldConfig_CheckboxField]: https://blinkk.github.io/selective-edit/interfaces/selective_field_checkbox.checkboxfieldconfig.html
[doc_FieldConfig_CheckboxMultiField]: https://blinkk.github.io/selective-edit/interfaces/selective_field_checkboxmulti.checkboxmultifieldconfig.html
[doc_FieldConfig_ColorField]: https://blinkk.github.io/selective-edit/modules/selective_field_color.html#colorfieldconfig
[doc_FieldConfig_DateField]: https://blinkk.github.io/selective-edit/modules/selective_field_date.html#datefieldconfig
[doc_FieldConfig_DatetimeField]: https://blinkk.github.io/selective-edit/modules/selective_field_datetime.html#datetimefieldconfig
[doc_FieldConfig_GroupField]: https://blinkk.github.io/selective-edit/interfaces/selective_field_group.groupfieldconfig.html
[doc_FieldConfig_ListField]: https://blinkk.github.io/selective-edit/interfaces/selective_field_list.listfieldconfig.html
[doc_FieldConfig_NumberField]: https://blinkk.github.io/selective-edit/interfaces/selective_field_number.numberfieldconfig.html
[doc_FieldConfig_RadioField]: https://blinkk.github.io/selective-edit/interfaces/selective_field_radio.radiofieldconfig.html
[doc_FieldConfig_TextField]: https://blinkk.github.io/selective-edit/interfaces/selective_field_text.textfieldconfig.html
[doc_FieldConfig_TextareaField]: https://blinkk.github.io/selective-edit/interfaces/selective_field_textarea.textareafieldconfig.html
[doc_FieldConfig_TimeField]: https://blinkk.github.io/selective-edit/modules/selective_field_time.html#timefieldconfig
[doc_FieldConfig_VariantField]: https://blinkk.github.io/selective-edit/interfaces/selective_field_variant.variantfieldconfig.html
[doc_FieldComponent]: https://blinkk.github.io/selective-edit/interfaces/selective_field.fieldcomponent.html
[doc_RuleComponent]: https://blinkk.github.io/selective-edit/interfaces/selective_validationrules.rulecomponent.html
[example]: https://blinkk.github.io/selective-edit/example/
[example_source]: https://github.com/blinkk/selective-edit/blob/main/src/example/example.ts
[tsdocs]: https://blinkk.github.io/selective-edit/
