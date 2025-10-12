import { EventEmitter } from '../utils/EventEmitter.js';

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export class EditorState extends EventEmitter {
  constructor() {
    super();

    this._state = {
      editMode: false,
      currentPage: null,
      currentSection: null,
      zoom: 1,
      documentShift: 0,
      magicView: {
        active: false,
        source: null,
        page: null
      },
      ui: {
        panelOpen: false,
        toolbarVisible: true,
        readingMode: false
      },
      notes: {
        hidden: false,
        selected: null
      },
      sections: {
        all: [],
        current: null
      }
    };

    this._history = [cloneState(this._state)];
    this._historyIndex = 0;
  }

  get(path) {
    if (!path) {
      return undefined;
    }

    return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), this._state);
  }

  set(path, value, options = {}) {
    const { silent = false, addToHistory = true } = options;
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key] || typeof obj[key] !== 'object') {
        obj[key] = {};
      }
      return obj[key];
    }, this._state);

    const oldValue = target[lastKey];
    if (oldValue === value) {
      return oldValue;
    }

    target[lastKey] = value;

    if (addToHistory) {
      this._pushToHistory();
    }

    if (!silent) {
      this.emit('state:change', { path, value, oldValue });
      this.emit(`state:change:${path}`, { value, oldValue });
    }

    return value;
  }

  update(updates, options = {}) {
    const { silent = false, addToHistory = true } = options;
    if (!updates || typeof updates !== 'object') {
      return;
    }

    const applied = [];

    Object.entries(updates).forEach(([path, value]) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((obj, key) => {
        if (!obj[key] || typeof obj[key] !== 'object') {
          obj[key] = {};
        }
        return obj[key];
      }, this._state);

      const oldValue = target[lastKey];
      if (oldValue === value) {
        return;
      }

      target[lastKey] = value;
      applied.push({ path, value, oldValue });

      if (!silent) {
        this.emit(`state:change:${path}`, { value, oldValue });
      }
    });

    if (applied.length === 0) {
      return;
    }

    if (addToHistory) {
      this._pushToHistory();
    }

    if (!silent) {
      const updatesPayload = applied.reduce((acc, item) => {
        acc[item.path] = item.value;
        return acc;
      }, {});

      this.emit('state:change', { updates: updatesPayload });
    }
  }

  replace(newState, options = {}) {
    const { silent = false, addToHistory = true } = options;
    if (!newState || typeof newState !== 'object') {
      return;
    }

    this._state = cloneState({ ...this._state, ...newState });

    if (addToHistory) {
      this._pushToHistory();
    }

    if (!silent) {
      this.emit('state:change', { state: this.toJSON() });
    }
  }

  undo() {
    if (this._historyIndex === 0) {
      return false;
    }

    this._historyIndex -= 1;
    this._state = cloneState(this._history[this._historyIndex]);
    this.emit('state:restored', { state: this.toJSON() });
    return true;
  }

  redo() {
    if (this._historyIndex >= this._history.length - 1) {
      return false;
    }

    this._historyIndex += 1;
    this._state = cloneState(this._history[this._historyIndex]);
    this.emit('state:restored', { state: this.toJSON() });
    return true;
  }

  toJSON() {
    return cloneState(this._state);
  }

  _pushToHistory() {
    const snapshot = cloneState(this._state);

    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }

    this._history.push(snapshot);
    this._historyIndex = this._history.length - 1;

    if (this._history.length > 50) {
      this._history.shift();
      this._historyIndex = Math.max(0, this._historyIndex - 1);
    }
  }
}
