import { EventEmitter } from '../utils/EventEmitter.js';

export class Component extends EventEmitter {
  constructor() {
    super();
    this.element = null;
  }

  createElement() {
    return document.createElement('div');
  }

  render() {}

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.removeAllListeners();
  }
}
