# Changelog

## [3.3.0](https://www.github.com/blinkk/selective-edit/compare/v3.2.4...v3.3.0) (2021-12-08)


### Features

* List field hover events. ([#70](https://www.github.com/blinkk/selective-edit/issues/70)) ([23a29fb](https://www.github.com/blinkk/selective-edit/commit/23a29fbbe138fbdc663ac4c975def57a1a80ad27))

### [3.2.4](https://www.github.com/blinkk/selective-edit/compare/v3.2.3...v3.2.4) (2021-11-18)


### Bug Fixes

* Validation for default zones. ([e95f683](https://www.github.com/blinkk/selective-edit/commit/e95f6831de10ed3c43ab0ddf137da6b818d6e271))

### [3.2.3](https://www.github.com/blinkk/selective-edit/compare/v3.2.2...v3.2.3) (2021-11-03)


### Bug Fixes

* Duplicate configuration for list items. ([#67](https://www.github.com/blinkk/selective-edit/issues/67)) ([d0f04bb](https://www.github.com/blinkk/selective-edit/commit/d0f04bbe33375b593614e143a49eaf15147ee10d))

### [3.2.2](https://www.github.com/blinkk/selective-edit/compare/v3.2.1...v3.2.2) (2021-08-13)


### Bug Fixes

* List sorting without changing positions does not change dirty. ([#65](https://www.github.com/blinkk/selective-edit/issues/65)) ([523489a](https://www.github.com/blinkk/selective-edit/commit/523489a3db9dc06affbe8ad87a199a6ddb5c6d40)), closes [#64](https://www.github.com/blinkk/selective-edit/issues/64)

### [3.2.1](https://www.github.com/blinkk/selective-edit/compare/v3.2.0...v3.2.1) (2021-08-13)


### Bug Fixes

* Use the value as a fallback for options if there is no label. ([#62](https://www.github.com/blinkk/selective-edit/issues/62)) ([31b153c](https://www.github.com/blinkk/selective-edit/commit/31b153ccc77698776fe85a4b17081d1da7a345c6)), closes [#133](https://www.github.com/blinkk/selective-edit/issues/133)

## [3.2.0](https://www.github.com/blinkk/selective-edit/compare/v3.1.0...v3.2.0) (2021-08-12)


### Features

* Delay validation on a form until it is marked for validation. ([#56](https://www.github.com/blinkk/selective-edit/issues/56)) ([24de0cb](https://www.github.com/blinkk/selective-edit/commit/24de0cbc46e73cf538a1ed014cf727230e721d0f))


### Bug Fixes

* Ensure the found preview value is a string. ([#57](https://www.github.com/blinkk/selective-edit/issues/57)) ([12c3c63](https://www.github.com/blinkk/selective-edit/commit/12c3c631bbf71310e326a218da10fa71eb7ab110))
* Sortable items can bind the focus in/out to control draggable. ([#59](https://www.github.com/blinkk/selective-edit/issues/59)) ([d259f16](https://www.github.com/blinkk/selective-edit/commit/d259f169cdff7df1f489f5188e548a5921b6f797)), closes [#58](https://www.github.com/blinkk/selective-edit/issues/58)

## [3.1.0](https://www.github.com/blinkk/selective-edit/compare/v3.0.1...v3.1.0) (2021-08-12)


### Features

* Index in list item preview to show order in list. ([#53](https://www.github.com/blinkk/selective-edit/issues/53)) ([7b035e7](https://www.github.com/blinkk/selective-edit/commit/7b035e7ea8f8446537b3afa708db806d5a7e405d))

### [3.0.1](https://www.github.com/blinkk/selective-edit/compare/v3.0.0...v3.0.1) (2021-08-12)


### Bug Fixes

* Lost focus check for unused zones failed since it was undefined. ([b9a0210](https://www.github.com/blinkk/selective-edit/commit/b9a021058cade926588920f5e92d9194b9906761))

## [3.0.0](https://www.github.com/blinkk/selective-edit/compare/v2.3.0...v3.0.0) (2021-08-11)


### ⚠ BREAKING CHANGES

* Focus tracking for field validation and gloval validation marking.

### Features

* Focus tracking for field validation and gloval validation marking. ([8d903a5](https://www.github.com/blinkk/selective-edit/commit/8d903a5688a124bf8e7a90c73f95e079c52a219e)), closes [#44](https://www.github.com/blinkk/selective-edit/issues/44)
* Use validation rules to determine if a field is required. ([#48](https://www.github.com/blinkk/selective-edit/issues/48)) ([c23bc55](https://www.github.com/blinkk/selective-edit/commit/c23bc552ea7a3c7e1f066b15dec9df994645392d))

## [2.3.0](https://www.github.com/blinkk/selective-edit/compare/v2.2.1...v2.3.0) (2021-08-11)


### Features

* Data format checking for existing values. ([#46](https://www.github.com/blinkk/selective-edit/issues/46)) ([d584b86](https://www.github.com/blinkk/selective-edit/commit/d584b86b9e2af80a58a779fa20f730470ec0bcfe))

### [2.2.1](https://www.github.com/blinkk/selective-edit/compare/v2.2.0...v2.2.1) (2021-08-02)


### Bug Fixes

* shared deep reference fix by deep cloning the values. ([549eacc](https://www.github.com/blinkk/selective-edit/commit/549eacc023f918fcd3558b508b3825d92dff6f0a))

## [2.2.0](https://www.github.com/blinkk/selective-edit/compare/v2.1.3...v2.2.0) (2021-07-26)


### Features

* optional label for variant and ability to clear variant ([#41](https://www.github.com/blinkk/selective-edit/issues/41)) ([2a74527](https://www.github.com/blinkk/selective-edit/commit/2a745275ffb3d516d21c08df66d3ec7eb686c2f9))

### [2.1.3](https://www.github.com/blinkk/selective-edit/compare/v2.1.2...v2.1.3) (2021-07-26)


### Bug Fixes

* test breakage for the label guessing ([0902426](https://www.github.com/blinkk/selective-edit/commit/09024265fa148357b1e4019159bb53f6f65599d6))

### [2.1.2](https://www.github.com/blinkk/selective-edit/compare/v2.1.1...v2.1.2) (2021-07-26)


### Bug Fixes

* guess label from key if not defined in config ([a550b12](https://www.github.com/blinkk/selective-edit/commit/a550b129345fe3d0e44fd05ce119f4d5d3063469))

### [2.1.1](https://www.github.com/blinkk/selective-edit/compare/v2.1.0...v2.1.1) (2021-07-24)


### Bug Fixes

* use the shortcut method to combine field keys. ([a577dff](https://www.github.com/blinkk/selective-edit/commit/a577dff28fff5e448bcefcd3366964e4978794d2))

## [2.1.0](https://www.github.com/blinkk/selective-edit/compare/v2.0.3...v2.1.0) (2021-07-23)


### Features

* utility method for combining the preview keys ([01000bd](https://www.github.com/blinkk/selective-edit/commit/01000bd427e769c15d44e6771648679e4863bcdd))

### [2.0.3](https://www.github.com/blinkk/selective-edit/compare/v2.0.2...v2.0.3) (2021-07-22)


### Bug Fixes

* reset method on FieldsComponent definiton ([d3d3760](https://www.github.com/blinkk/selective-edit/commit/d3d3760af1657362b345881b1680bb6913ce2343))

### [2.0.2](https://www.github.com/blinkk/selective-edit/compare/v2.0.1...v2.0.2) (2021-07-22)


### Bug Fixes

* no auto guess when there is no value ([#33](https://www.github.com/blinkk/selective-edit/issues/33)) ([179eef8](https://www.github.com/blinkk/selective-edit/commit/179eef8c398a91135d63e8e3b3d4aceb94b60716))
* reset the fields without having to recreate the class ([#34](https://www.github.com/blinkk/selective-edit/issues/34)) ([b0d0c5a](https://www.github.com/blinkk/selective-edit/commit/b0d0c5a3d5076b0db662e89dbebc2e1f4dcfa01d))

### [2.0.1](https://www.github.com/blinkk/selective-edit/compare/v2.0.0...v2.0.1) (2021-07-22)


### Bug Fixes

* value needs to be auto deep object ([f25b67f](https://www.github.com/blinkk/selective-edit/commit/f25b67f10055d8ed2eb70173ee597e741eae7dd5))

## [2.0.0](https://www.github.com/blinkk/selective-edit/compare/v1.2.1...v2.0.0) (2021-06-25)


### ⚠ BREAKING CHANGES

* move `sass` into `src`, change export root for ts

### Code Refactoring

* move `sass` into `src`, change export root for ts ([1f3733c](https://www.github.com/blinkk/selective-edit/commit/1f3733c257e5f6c388454b523c96f8b103a1620a))

### [1.2.1](https://www.github.com/blinkk/selective-edit/compare/v1.2.0...v1.2.1) (2021-06-17)


### Bug Fixes

* Export more of the utilities from the main package. ([e27f446](https://www.github.com/blinkk/selective-edit/commit/e27f446a2c3f262316d1664b33d5e2cc0177a640))

## [1.2.0](https://www.github.com/blinkk/selective-edit/compare/v1.1.2...v1.2.0) (2021-05-21)


### Features

* release please release automation. ([c713d90](https://www.github.com/blinkk/selective-edit/commit/c713d9073014bff299e5ac49f4e37502e976973a))
