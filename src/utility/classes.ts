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

/**
 * Class manager allowing for dynamically changing which class definitions are
 * used. Allows for defining a default set of classes which can later be
 * overwritten without special changes to the code.
 */
export class ClassManager {
  DefaultCls?: ClassConstructor;
  classes: Record<string, ClassConstructor>;

  constructor(DefaultCls?: ClassConstructor) {
    this.DefaultCls = DefaultCls;
    this.classes = {};
  }

  /**
   * Retrieve the class definition based on the key.
   *
   * @param key Key used to identify the purpose for the class.
   */
  getByKey(key: string): ClassConstructor | null {
    if (this.classes[key]) {
      return this.classes[key];
    }

    return null;
  }

  /**
   * Create a new instance of a registered class if available.
   *
   * Falls back to the default class if it is defined or returns null if no
   * matching class definition is found.
   *
   * @param key Key used to identify the purpose for the class.
   * @param args Arguments to be passed onto the class constructor.
   */
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

  /**
   * Register a new class that will be used when creating a new class
   * based on the provided key.
   *
   * @param key Key used to identify the purpose for the class.
   * @param Cls Class definition to use for the given key.
   */
  registerClass(key: string, Cls: ClassConstructor): void {
    this.classes[key] = Cls;
  }

  /**
   * Register multiple classes as a time.
   *
   * @param classes A mapping of keys to class definitions.
   */
  registerClasses(classes: Record<string, ClassConstructor>): void {
    for (const key of Object.keys(classes)) {
      this.registerClass(key, classes[key]);
    }
  }
}
