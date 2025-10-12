export class EventEmitter {
  constructor() {
    this._events = new Map();
  }

  on(event, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }

    const listeners = this._events.get(event);
    listeners.add(listener);

    return () => this.off(event, listener);
  }

  once(event, listener) {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe();
      listener(...args);
    });
    return unsubscribe;
  }

  off(event, listener) {
    if (!this._events.has(event)) {
      return;
    }

    const listeners = this._events.get(event);
    listeners.delete(listener);

    if (listeners.size === 0) {
      this._events.delete(event);
    }
  }

  emit(event, ...args) {
    const listeners = this._events.get(event);
    if (!listeners || listeners.size === 0) {
      return false;
    }

    Array.from(listeners).forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error emitting event "${event}"`, error);
      }
    });
    return true;
  }

  removeAllListeners() {
    this._events.clear();
  }
}
