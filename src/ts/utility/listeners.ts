/**
 * Listeners for allowing a creating listeners and trigger callbacks.
 */
export class Listeners {
  listeners: Record<string, Array<any>>;

  constructor() {
    this.listeners = {};
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  add(eventName: string, callback: any): void {
    const listeners = this.listenersForEvent(eventName);
    listeners.push(callback);
  }

  listenersForEvent(eventName: string): Array<any> {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    return this.listeners[eventName];
  }

  trigger(eventName: string, ...data: Array<any>): void {
    for (const listener of this.listenersForEvent(eventName)) {
      listener(...data);
    }
  }
}
