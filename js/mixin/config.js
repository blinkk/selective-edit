/**
 * Config mixin for adding configuration options to a class.
 */

import {
 autoConfig
} from '../utility/config'

const ConfigMixin = superclass => class extends superclass {
  constructor() {
    super()
    this._config = autoConfig({})
  }

  getConfig() {
    return this._config
  }

  setConfig(value) {
    this._config = autoConfig(value)
  }
}

export default ConfigMixin
