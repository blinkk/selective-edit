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
}
