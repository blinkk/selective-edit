/**
 * UID mixin for adding unique id to a class.
 */

import generateUUID from '../utility/uuid'


const UidMixin = superclass => class extends superclass {
  getUid() {
    if (!this._uid) {
      this._uid = generateUUID()
    }
    return this._uid
  }
}

export default UidMixin
