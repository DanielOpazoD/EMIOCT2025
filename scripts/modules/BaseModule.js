import { EventEmitter } from '../utils/EventEmitter.js';

export class BaseModule extends EventEmitter {
  constructor(editor) {
    super();
    this.editor = editor;
    this.state = editor.state;
    this.config = editor.config;
    this.subscriptions = new Set();
    this.timeouts = new Set();
    this.intervals = new Set();
    this.observers = new Set();
    this.domListeners = new Set();
  }

  subscribe(event, callback) {
    const unsubscribe = this.editor.on(event, callback);
    this.subscriptions.add(unsubscribe);
    return () => {
      unsubscribe();
      this.subscriptions.delete(unsubscribe);
    };
  }

  subscribeToState(path, callback) {
    const unsubscribe = this.state.on(`state:change:${path}`, callback);
    this.subscriptions.add(unsubscribe);
    return () => {
      unsubscribe();
      this.subscriptions.delete(unsubscribe);
    };
  }

  listen(target, eventName, callback, options) {
    if (!target || typeof target.addEventListener !== 'function') {
      return () => {};
    }

    target.addEventListener(eventName, callback, options);
    const record = { target, eventName, callback, options };
    this.domListeners.add(record);

    return () => {
      target.removeEventListener(eventName, callback, options);
      this.domListeners.delete(record);
    };
  }

  setTimeout(callback, delay) {
    const id = globalThis.setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  clearTimeout(id) {
    if (!this.timeouts.has(id)) {
      return;
    }
    globalThis.clearTimeout(id);
    this.timeouts.delete(id);
  }

  setInterval(callback, interval) {
    const id = globalThis.setInterval(callback, interval);
    this.intervals.add(id);
    return id;
  }

  clearInterval(id) {
    if (!this.intervals.has(id)) {
      return;
    }
    globalThis.clearInterval(id);
    this.intervals.delete(id);
  }

  addObserver(observer) {
    if (observer) {
      this.observers.add(observer);
    }
    return observer;
  }

  destroy() {
    this.subscriptions.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error removing subscription', error);
      }
    });
    this.subscriptions.clear();

    this.timeouts.forEach((id) => globalThis.clearTimeout(id));
    this.timeouts.clear();

    this.intervals.forEach((id) => globalThis.clearInterval(id));
    this.intervals.clear();

    this.observers.forEach((observer) => {
      try {
        if (typeof observer.disconnect === 'function') {
          observer.disconnect();
        }
        if (typeof observer.unobserve === 'function' && observer.element) {
          observer.unobserve(observer.element);
        }
      } catch (error) {
        console.error('Error cleaning observer', error);
      }
    });
    this.observers.clear();

    this.domListeners.forEach(({ target, eventName, callback, options }) => {
      try {
        target.removeEventListener(eventName, callback, options);
      } catch (error) {
        console.error('Error removing DOM listener', error);
      }
    });
    this.domListeners.clear();

    this.removeAllListeners();
  }
}
