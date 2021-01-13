/**
 * Compose multiple mixins into an easier syntax.
 *
 * Adapted from lodash flow.
 */

interface MixinComponent {
  [x: string]: any;
}

interface ComposeConstructor {
  new: (...args: any) => any;
}

/**
 * Allows using composition to modify a base class to have specific functionality.
 *
 * @param mixins Array of mixins to be applied to the base class.
 */
export function compose(
  ...mixins: Array<MixinComponent>
): (...baseClasses: Array<any>) => any {
  const length = mixins.length;
  mixins = mixins.reverse();
  return function (this: any, ...baseClasses: Array<any>): any {
    let index = 0;
    let result = length
      ? mixins[index].apply(this, baseClasses)
      : baseClasses[0];
    while (++index < length) {
      result = mixins[index].call(this, result);
    }
    return result;
  };
}

export class Base {}
