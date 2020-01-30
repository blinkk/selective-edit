/**
 * Automatically guess the field configuration from data.
 */
import { autoDeepObject } from '../utility/deepObject'
import DataType from '../utility/dataType'

export default class AutoFields {
  constructor(data) {
    this.data = data
    this._data = autoDeepObject(data)
    this.dataType = new DataType()
  }

  get config() {
    return {
      'fields': this.guessAll(),
    }
  }

  _deepGuess(data, keyBase) {
    let fields = []
    keyBase = keyBase || []

    if (this.dataType.isArray(data)) {
      const firstValue = data.length ? data[0] : null
      fields.push(this._fieldConfig('', firstValue))
    } else {
      for (const key in data) {
        if (!data.hasOwnProperty(key)) {
          continue
        }

        const newKeyBase = keyBase.concat([key])
        if (this.dataType.isObject(data[key])) {
          fields = fields.concat(this._deepGuess(data[key], newKeyBase))
        } else {
          const fullKey = newKeyBase.join('.')
          fields.push(this._fieldConfig(fullKey, data[key]))
        }
      }
    }

    return fields
  }

  _fieldConfig(key, value) {
    const fieldType = this.typeFromValue(value)
    const fieldConfig = {
      "type": fieldType,
      "key": key,
      "label": this.labelFromKey(key),
    }

    if (fieldConfig.type == 'list') {
      fieldConfig['fields'] = this._deepGuess(value, key.split('.'))
    }

    return fieldConfig
  }

  /**
   * Given a data key, guess the field configuration from the data.
   */
  guess(key) {
    return this._fieldConfig(
      key, this.typeFromValue(this._data.get(key)))
  }

  /**
   * Guess all the field configuration from the data.
   */
  guessAll() {
    return this._deepGuess(this.data)
  }

  /**
   * From a key guess the label of the field.
   */
  labelFromKey(key) {
    return key.replace('.', ' ').split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ')
  }

  /**
   * From a value guess the type of field.
   */
  typeFromValue(value) {
    if (this.dataType.isArray(value)) {
      return 'list'
    }
    if (value.length > 150) {
      return 'textarea'
    }
    return 'text'
  }
}
