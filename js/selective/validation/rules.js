/**
 * Validation rules for fields.
 */

import {
  Base,
  compose,
} from '../../utility/compose'
import ConfigMixin from '../../mixin/config'
import DataType from '../../utility/dataType'

const DEFAULT_ZONE_KEY = '__default__'

export default class ValidationRules extends compose(ConfigMixin,)(Base) {
  constructor(config) {
    super()
    this._rules = {}
    this.setConfig(config)
  }

  get config() {
    return this.getConfig()
  }

  get rules() {
    return this._rules
  }

  get ruleTypes() {
    return this.config.ruleTypes
  }

  addRule(rule, zoneKey) {
    let newRule = this.ruleTypes.newFromKey(rule['type'], rule)

    if (!newRule) {
      newRule = new UnknownValidationRule(rule)
    }

    const rules = this.getRulesForZone(zoneKey)
    rules.push(newRule)
  }

  addRules(rules, zoneKey) {
    if (DataType.isObject(rules)) {
      for (const zoneKey of Object.keys(rules)) {
        for (const rule of rules[zoneKey]) {
          this.addRule(rule, zoneKey)
        }
      }
    } else {
      for (const rule of rules) {
        this.addRule(rule, zoneKey)
      }
    }
  }

  getRulesForZone(zoneKey) {
    zoneKey = zoneKey || DEFAULT_ZONE_KEY

    if (!this._rules[zoneKey]) {
      this._rules[zoneKey] = []
    }

    return this._rules[zoneKey]
  }
}


export class ValidationRule extends compose(ConfigMixin,)(Base) {
  constructor(config) {
    super()
    this.setConfig(config)
  }

  get appliesToOnlyDefaultLocale() {
    return this.config.onlyDefaultLocale || false
  }

  get appliesToOnlyNonDefaultLocale() {
    return this.config.onlyNonDefaultLocale || false
  }

  get config() {
    return this.getConfig()
  }

  get message() {
    return this.config.message
  }

  get type() {
    return this.config.type
  }

  validate(value, locale, isDefaultLocale) {
    console.error('Validation check not defined.');
  }
}


export class LengthValidationRule extends ValidationRule {
  get message() {
    return super.message || 'Value needs to have the correct length.'
  }

  validate(value, locale, isDefaultLocale) {
    // Allow for empty fields. Use the required rule for making sure it exists.
    if (!value) {
      return null
    }

    const configMax = this.config.max
    const configMin = this.config.min

    if (!DataType.isArray(value)) {
      // Do not count whitespace.
      value = value.trim()
    }

    if (configMin && value.length < configMin.value) {
      return configMin.message || this.message
    }

    if (configMax && value.length > configMax.value) {
      return configMax.message || this.message
    }

    return null
  }
}


export class MatchValidationRule extends ValidationRule {
  constructor(config) {
    super(config)
    this._patterns = {}
  }

  get message() {
    return super.message || `Value needs to match the validation rule.`
  }

  _testPattern(key, pattern, value) {
    if (!this._patterns[key]) {
      this._patterns[key] = new RegExp(pattern)
    }

    return this._patterns[key].test(value)
  }

  validate(value, locale, isDefaultLocale) {
    // Allow for empty fields. Use the required rule for making sure it exists.
    if (!value) {
      return null
    }

    // Handle the allowed matching.
    let matchConfig = this.config.allowed
    if (matchConfig) {
      if (matchConfig.pattern) {
        if (!this._testPattern('allowed', matchConfig.pattern, value)) {
          return matchConfig.message || this.message
        }
      }

      if (matchConfig.values) {
        if (!matchConfig.values.includes(value)) {
          return matchConfig.message || this.message
        }
      }
    }

    // Handle the excluded matching.
    matchConfig = this.config.excluded
    if (matchConfig) {
      if (matchConfig.pattern) {
        if (this._testPattern('excluded', matchConfig.pattern, value)) {
          return matchConfig.message || this.message
        }
      }

      if (matchConfig.values) {
        if (matchConfig.values.includes(value)) {
          return matchConfig.message || this.message
        }
      }
    }

    return null
  }
}


export class PatternValidationRule extends ValidationRule {
  get message() {
    return super.message || `Value needs to match the pattern: ${this.config.pattern}`
  }

  validate(value, locale, isDefaultLocale) {
    // Allow for empty fields. Use the required rule for making sure it exists.
    if (!value) {
      return null
    }

    // Only need to compile the pattern once.
    if (!this.pattern) {
      this.pattern = new RegExp(this.config.pattern)
    }

    if (!this.pattern.test(value)) {
      return this.message
    }

    return null
  }
}


export class RangeValidationRule extends ValidationRule {
  get message() {
    return super.message || 'Value needs to be a number in range.'
  }

  validate(value, locale, isDefaultLocale) {
    // Allow for empty fields. Use the required rule for making sure it exists.
    if (!value) {
      return null
    }

    const configMax = this.config.max
    const configMin = this.config.min

    if (DataType.isArray(value)) {
      if (configMin && value.length < configMin.value) {
        return configMin.message || this.message
      }

      if (configMax && value.length > configMax.value) {
        return configMax.message || this.message
      }
    } else {
      value = parseFloat(value)

      if (isNaN(value)) {
        return this.message
      }

      if (configMin && value < configMin.value) {
        return configMin.message || this.message
      }

      if (configMax && value > configMax.value) {
        return configMax.message || this.message
      }
    }

    return null
  }
}


export class RequiredValidationRule extends ValidationRule {
  get appliesToOnlyDefaultLocale() {
    const configValue = this.config.onlyDefaultLocale
    if (configValue == undefined) {
      return true
    }
    return configValue
  }

  get message() {
    return super.message || 'Value is required. Cannot be empty.'
  }

  validate(value, locale, isDefaultLocale) {
    if (!value) {
      return this.message
    }

    // Handle required array values.
    if (DataType.isArray(value)) {
      if (value.length < 1) {
        return this.message
      }
    }

    // Require that it be more than just whitespace.
    try {
      value = value.trim()
      if (!value.length) {
        return this.message
      }
    } catch (e) {
      if (e instanceof TypeError) {
        // Value type doesn't have a trim or length.
      } else {
        throw e
      }
    }

    // Quill editor blank is not a blank string.
    if (value == '<p><br></p>') {
      return this.message
    }

    return null
  }
}


class UnknownValidationRule extends ValidationRule {
  constructor(config) {
    super(config)

    console.warn(`Validation type '${this.type}' is not recognized.`);
  }

  validate(value, locale, isDefaultLocale) {
    return null
  }
}
