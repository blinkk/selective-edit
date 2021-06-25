/**
 * Utility for working with deep object references.
 *
 * Example: obj.get('somthing.sub.key') would deeply reference the object.
 */

import {DataType} from './dataType';

export class DeepObject {
  obj: Record<string, any>;

  constructor(obj?: Record<string, any>) {
    this.obj = obj === undefined ? {} : obj;
  }

  /**
   * Allows for accessing nested values in an object with a single reference.
   *
   * @param key Period separated reference to the deep value.
   */
  get(key: string): any {
    let root = this.obj;

    if (!key) {
      return root;
    }

    for (const part of key.split('.')) {
      if (!root) {
        return undefined;
      }
      if (!(part in root)) {
        return undefined;
      }
      root = root[part];
    }
    return root;
  }

  /**
   * Determine all of the 'key' references for a deep object.
   *
   * ```
   * { foo: { bar: true } } => ['foo.bar']
   * ```
   */
  keys(): Array<string> {
    return this.keysForRecord(this.obj, []);
  }

  protected keysForRecord(
    record: Record<string, any>,
    parentKeys: Array<string>
  ): Array<string> {
    const keys = [];

    for (const [key, value] of Object.entries(record)) {
      const currentKey = [...parentKeys, key];

      if (DataType.isObject(value)) {
        // Value is another record, find it's keys and add them to the keys.
        const recordKeys = this.keysForRecord(value, currentKey);
        for (const subKey of recordKeys) {
          keys.push(subKey);
        }
      } else {
        keys.push(currentKey.join('.'));
      }
    }

    return keys;
  }

  /**
   * Set a deep value on the object using a referenced key.
   *
   * @param key Period separated reference to the deep value.
   * @param value New value to set at the deep reference.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  set(key: string, value: any): void {
    if (!key) {
      this.obj = value;
      return;
    }

    let root = this.obj;

    const parts = key.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in root)) {
        root[part] = {};
      }
      root = root[part];
    }
    root[parts[parts.length - 1]] = value;
  }

  /**
   * Updates the current object with the keys from a new value.
   *
   * @param value New object to be added to the existing object.
   */
  update(value?: Record<string, any>): void {
    if (!value) {
      return;
    }

    for (const key of Object.keys(value)) {
      this.set(key, value[key]);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const autoDeepObject = (value: any): DeepObject => {
  if (value instanceof DeepObject) {
    return value;
  }

  return new DeepObject(value);
};
