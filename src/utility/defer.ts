/**
 * Ability to defer a promise resolution.
 */
export class Defer {
  promise: Promise<any>;
  reject: (reason?: any) => void;
  resolve: (value: any) => void;

  constructor() {
    this.reject = () => {};
    this.resolve = () => {};
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });

    Object.freeze(this);
  }
}
