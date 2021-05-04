/**
 * Throttle events using the requestAnimationFrame.
 */
export class Throttle {
  running: boolean;

  constructor(type: string, name: string) {
    this.running = false;
    window.addEventListener(type, () => {
      if (this.running) {
        return;
      }
      this.running = true;
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent(name));
        this.running = false;
      });
    });
  }
}
