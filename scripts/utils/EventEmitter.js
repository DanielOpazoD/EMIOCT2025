export class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    if (!this._events.has(eventName)) {
      this._events.set(eventName, new Set());
    }

    const listeners = this._events.get(eventName);
    listeners.add(listener);

    return () => this.off(eventName, listener);
  }

  once(eventName, listener) {
    const wrapper = (...args) => {
      this.off(eventName, wrapper);
      listener(...args);
    };

    return this.on(eventName, wrapper);
  }

  off(eventName, listener) {
    const listeners = this._events.get(eventName);
    if (!listeners) {
      return;
    }

    listeners.delete(listener);

    if (listeners.size === 0) {
      this._events.delete(eventName);
    }
  }

  emit(eventName, ...args) {
    const listeners = this._events.get(eventName);
    if (!listeners) {
      return;
    }

    [...listeners].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in '${eventName}' listener`, error);
      }
    });
  }

  removeAllListeners(eventName) {
    if (typeof eventName === 'string') {
      this._events.delete(eventName);
    } else {
      this._events.clear();
    }
  }
}
