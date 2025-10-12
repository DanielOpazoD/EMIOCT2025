import { EventEmitter } from '../utils/EventEmitter.js';

export class Component extends EventEmitter {
  constructor() {
    super();
    this.element = null;
  }

  destroy() {
    if (this.element && this.element.remove) {
      this.element.remove();
    }
    this.removeAllListeners();
  }
}
