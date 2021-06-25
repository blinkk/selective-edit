/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/**
 * Utility for determining the type of a data value.
 */

export class DataType {
  static isArray(value: any): boolean {
    if (Array.isArray) {
      return Array.isArray(value);
    }
    return (
      Boolean(value) && typeof value === 'object' && value.constructor === Array
    );
  }

  static isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  static isDate(value: any): boolean {
    return value instanceof Date;
  }

  static isFunction(value: any): boolean {
    return typeof value === 'function';
  }

  static isNumber(value: any): boolean {
    return typeof value === 'number' && isFinite(value);
  }

  static isNull(value: any): boolean {
    return value === null;
  }

  static isObject(value: any): boolean {
    return (
      Boolean(value) &&
      typeof value === 'object' &&
      value.constructor === Object
    );
  }

  static isRegExp(value: any): boolean {
    return (
      Boolean(value) &&
      typeof value === 'object' &&
      value.constructor === RegExp
    );
  }

  static isString(value: any): boolean {
    return typeof value === 'string' || value instanceof String;
  }

  static isSymbol(value: any): boolean {
    return typeof value === 'symbol';
  }

  static isUndefined(value: any): boolean {
    return typeof value === 'undefined';
  }
}
