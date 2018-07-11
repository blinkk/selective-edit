/**
 * Utility for determining the type of a data value.
 */

export default class DataType {
  isArray (value) {
    if (Array.isArray) {
      return Array.isArray(value)
    }
    return value && typeof value === 'object' && value.constructor === Array
  }

  isBoolean (value) {
    return typeof value === 'boolean'
  }

  isDate (value) {
    return value instanceof Date
  }

  isFunction (value) {
    return typeof value === 'function'
  }

  isNumber (value) {
    return typeof value === 'number' && isFinite(value)
  }

  isNull (value) {
    return value === null
  }

  isObject (value) {
    return value && typeof value === 'object' && value.constructor === Object
  }

  isRegExp (value) {
    return value && typeof value === 'object' && value.constructor === RegExp
  }

  isString (value) {
    return typeof value === 'string' || value instanceof String
  }

  isSymbol (value) {
    return typeof value === 'symbol'
  }

  isUndefined (value) {
    return typeof value === 'undefined'
  }
}
