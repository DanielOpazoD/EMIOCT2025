import { EventEmitter } from '../utils/EventEmitter.js';

export class Component extends EventEmitter {
  constructor() {
    super();
    this.element = null;
  }

  destroy() {
    this.element?.remove();
    this.removeAllListeners();
  }
}
