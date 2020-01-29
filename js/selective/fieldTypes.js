/**
 * Fields types defined for editing.
 */

import ConfigMixin from '../mixin/config'
import { Base, compose } from '../utility/compose'

export default class FieldTypes extends compose(ConfigMixin,)(Base) {
  constructor(config) {
    super()
    this.fieldTypes = {}
    this.setConfig(config)
  }

  addFieldType(key, FieldCls) {
    this.fieldTypes[key] = FieldCls
  }

  initialize(containerEl) {
    for (const [key, value] of Object.entries(this.fieldTypes)) {
      value.initialize(containerEl)
    }
  }

  newField(type, ...args) {
    if ( type in this.fieldTypes ) {
      return new this.fieldTypes[type](...args)
    }

    // TODO: Placeholder field.
  }
}
