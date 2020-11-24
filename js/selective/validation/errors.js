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

  addError(type, level, message, zoneKey) {
    const zone = this.getErrorsForZone(zoneKey)
    zone[type] = {
      'level': level,
      'message': message,
      'type': type,
    }
  }

  getErrorsForZone(zoneKey) {
    zoneKey = zoneKey || DEFAULT_ZONE_KEY

    if (!this._zones[zoneKey]) {
      this._zones[zoneKey] = {}
    }

    return this._zones[zoneKey]
  }

  hasAnyErrors() {
    for (const zoneKey of Object.keys(this._zones)) {
      for (const typeKey of Object.keys(this._zones[zoneKey])) {
        if (this._zones[zoneKey][typeKey].level == 'error') {
          return true
        }
      }
    }

    return false
  }

  hasAnyMessages() {
    for (const zoneKey of Object.keys(this._zones)) {
      if (Object.keys(this._zones[zoneKey]).length > 0) {
        return true
      }
    }

    return false
  }

  hasErrors(zoneKey) {
    const zone = this.getErrorsForZone(zoneKey)
    for (const typeKey of Object.keys(zone)) {
      if (this._zones[zoneKey][typeKey].level == 'error') {
        return true
      }
    }
    return false
  }

  hasMessages(zoneKey) {
    const zone = this.getErrorsForZone(zoneKey)
    return Object.keys(zone).length > 0
  }

  validateRules(rules, value, locale, isDefaultLocale, zoneKey) {
    for (const rule of rules.getRulesForZone(zoneKey)) {
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
        this.addError(rule.type, rule.level, result, zoneKey)
      }
    }
  }
}
