/**
 * Compose multiple mixins into an easier syntax.
 *
 * Adapted from lodash flow.
 */

function compose(...mixins) {
  const length = mixins.length
  mixins = mixins.reverse()
  return function(...args) {
    let index = 0
    let result = length ? mixins[index].apply(this, args) : args[0]
    while (++index < length) {
      result = mixins[index].call(this, result)
    }
    return result
  }
}

class Base {}

export { Base, compose }
