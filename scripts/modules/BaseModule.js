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
    return unsubscribe;
  }

  subscribeToState(path, callback) {
    const unsubscribe = this.state.on(`state:change:${path}`, callback);
    this.subscriptions.add(unsubscribe);
    return unsubscribe;
  }

  addDomListener(target, event, handler, options) {
    if (!target || typeof target.addEventListener !== 'function') {
      return () => {};
    }
    target.addEventListener(event, handler, options);
    const record = { target, event, handler, options };
    this.domListeners.add(record);
    const unsubscribe = () => {
      target.removeEventListener(event, handler, options);
      this.domListeners.delete(record);
    };
    this.subscriptions.add(unsubscribe);
    return unsubscribe;
  }

  setTimeout(callback, delay) {
    const id = setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  clearTimeout(id) {
    clearTimeout(id);
    this.timeouts.delete(id);
  }

  setInterval(callback, interval) {
    const id = setInterval(callback, interval);
    this.intervals.add(id);
    return id;
  }

  clearInterval(id) {
    clearInterval(id);
    this.intervals.delete(id);
  }

  addObserver(observer) {
    this.observers.add(observer);
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

    this.timeouts.forEach((id) => clearTimeout(id));
    this.timeouts.clear();

    this.intervals.forEach((id) => clearInterval(id));
    this.intervals.clear();

    this.observers.forEach((observer) => {
      if (observer.disconnect) observer.disconnect();
      if (observer.unobserve) observer.unobserve();
    });
    this.observers.clear();

    this.domListeners.forEach(({ target, event, handler, options }) => {
      if (target && target.removeEventListener) {
        target.removeEventListener(event, handler, options);
      }
    });
    this.domListeners.clear();

    this.removeAllListeners();
  }
}
