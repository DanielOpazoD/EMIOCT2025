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
    this.boundListeners = new Set();
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

  setTimeout(callback, delay) {
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  setInterval(callback, interval) {
    const id = window.setInterval(callback, interval);
    this.intervals.add(id);
    return id;
  }

  addObserver(observer) {
    this.observers.add(observer);
    return observer;
  }

  addDomListener(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this.boundListeners.add({ target, event, handler, options });
  }

  destroy() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();

    this.timeouts.forEach(id => window.clearTimeout(id));
    this.intervals.forEach(id => window.clearInterval(id));
    this.timeouts.clear();
    this.intervals.clear();

    this.observers.forEach(observer => {
      if (observer.disconnect) observer.disconnect();
      if (observer.unobserve) observer.unobserve();
    });
    this.observers.clear();

    this.boundListeners.forEach(({ target, event, handler, options }) => {
      target.removeEventListener(event, handler, options);
    });
    this.boundListeners.clear();

    this.removeAllListeners();
  }
}
