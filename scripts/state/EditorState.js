import { EventEmitter } from '../utils/EventEmitter.js';

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
        toolbarVisible: false,
        readingMode: false
      },
      notes: {
        hidden: false,
        selected: null
      }
    };

    this._history = [];
    this._historyIndex = -1;
  }

  get(path) {
    return path.split('.').reduce((value, key) => value?.[key], this._state);
  }

  set(path, value, options = {}) {
    const { silent = false, addToHistory = true } = options;

    if (addToHistory) {
      this._addToHistory();
    }

    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((acc, key) => {
      if (!acc[key]) acc[key] = {};
      return acc[key];
    }, this._state);

    const oldValue = target[lastKey];
    target[lastKey] = value;

    if (!silent) {
      this.emit('state:change', { path, value, oldValue });
      this.emit(`state:change:${path}`, { value, oldValue });
    }
  }

  update(updates, options = {}) {
    Object.entries(updates).forEach(([path, value]) => {
      this.set(path, value, { ...options, silent: true });
    });

    if (!options.silent) {
      this.emit('state:change', { updates });
    }
  }

  undo() {
    if (this._historyIndex > 0) {
      this._historyIndex -= 1;
      this._state = JSON.parse(JSON.stringify(this._history[this._historyIndex]));
      this.emit('state:restored');
      return true;
    }
    return false;
  }

  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex += 1;
      this._state = JSON.parse(JSON.stringify(this._history[this._historyIndex]));
      this.emit('state:restored');
      return true;
    }
    return false;
  }

  _addToHistory() {
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(JSON.parse(JSON.stringify(this._state)));
    this._historyIndex += 1;

    if (this._history.length > 50) {
      this._history.shift();
      this._historyIndex -= 1;
    }
  }
}
