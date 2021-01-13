/**
 * Generic key value manager for storing classes.
 */

/**
 * Generic class definition for the classes manager.
 */
export interface ClassComponent {
  /**
   * Classes can define any other properties and methods.
   */
  [x: string]: any;
}

/**
 * Generic class constructor for the classes manager.
 */
export interface ClassConstructor {
  new (...args: any): any;
}

export class ClassManager {
  DefaultCls?: ClassConstructor;
  classes: Record<string, ClassConstructor>;

  constructor(DefaultCls?: ClassConstructor) {
    this.DefaultCls = DefaultCls;
    this.classes = {};
  }

  getByKey(key: string): ClassConstructor | null {
    if (this.classes[key]) {
      return this.classes[key];
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  newFromKey(key: string, ...args: any): ClassComponent | null {
    // Create based on the provided key if defined.
    if (this.classes[key]) {
      return new this.classes[key](...args);
    }

    // Fall back to the default class when defined.
    if (this.DefaultCls) {
      return new this.DefaultCls(...args);
    }

    return null;
  }

  registerClass(key: string, Cls: ClassConstructor): void {
    this.classes[key] = Cls;
  }

  registerClasses(classes: Record<string, ClassConstructor>): void {
    for (const key of Object.keys(classes)) {
      this.registerClass(key, classes[key]);
    }
  }
}
