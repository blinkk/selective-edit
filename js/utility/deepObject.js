/**
 * Utility for working with deep object references.
 *
 * Example: obj.get('somthing.sub.key') would deeply reference the object.
 */

export default class DeepObject {
  constructor(obj) {
    this.obj = obj || {}
  }

  get(key) {
    let root = this.obj
    for (const part of key.split('.')) {
      if (!root) {
        return undefined
      }
      if (!part in root) {
        return undefined
      }
      root = root[part]
    }
    return root
  }
}


export const autoDeepObject = (value) => {
  if (value instanceof DeepObject) {
    return value
  }
  return new DeepObject(value)
}
