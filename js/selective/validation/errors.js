/**
 * Validation errors for fields.
 *
 * 'Zone' based error tracking. Allows for complex fields that have different
 * validation for different parts of the field.
 */

const DEFAULT_ZONE_KEY = '__default__'

export default class ValidationErrors {
  constructor() {
    this._zones = {}
  }

  get errors() {
    return this.getErrorsForZone()
  }

  addError(type, message, zoneKey) {
    const zone = this.getErrorsForZone(zoneKey)
    zone[type] = message
  }

  getErrorsForZone(zoneKey) {
    zoneKey = zoneKey || DEFAULT_ZONE_KEY

    if (!this._zones[zoneKey]) {
      this._zones[zoneKey] = {}
    }

    return this._zones[zoneKey]
  }

  hasErrors(zoneKey) {
    const zone = this.getErrorsForZone(zoneKey)
    return Object.keys(zone).length > 0
  }

  validateRules(rules, value, locale, isDefaultLocale, zoneKey) {
    for (const rule of rules) {
      // Ignore rules that only apply to default locale when not default.
      // For example, a required rule is usually only required in the default.
      if (!isDefaultLocale && rule.appliesToOnlyDefaultLocale) {
        continue
      }

      // Ignore rules that only apply to non-default locales when default.
      if (isDefaultLocale && rule.appliesToOnlyNonDefaultLocale) {
        continue
      }

      // Using the result from the validation allows the message to be different
      // based on what went wrong with the validation.
      const result = rule.validate(value, locale, isDefaultLocale)
      if (result) {
        this.addError(rule.type, result, zoneKey)
      }
    }
  }
}
