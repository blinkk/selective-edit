/**
 * Generic key value manager for storing classes.
 */

export default class ClassManager {
  constructor(DefaultCls) {
    this.DefaultCls = DefaultCls || null
    this.classes = {}
  }

  forEachFunc(functionName, ...args) {
    for (const [key, value] of Object.entries(this.classes)) {
      value[functionName](...args)
    }
  }

  newFromKey(key, ...args) {
    if ( this.classes[key] ) {
      return new this.classes[key](...args)
    }

    if ( this.DefaultCls ) {
      return new this.DefaultCls(...args)
    }

    return null
  }

  setClass(key, TypeCls) {
    this.classes[key] = TypeCls
  }

  setClasses(classes) {
    for (const key of Object.keys(classes)) {
      this.setClass(key, classes[key])
    }
  }
}
