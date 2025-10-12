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
    this._addToHistory();
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this._state);
  }

  set(path, value, options = {}) {
    const { silent = false, addToHistory = true } = options;

    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this._state);

    const oldValue = target[lastKey];

    if (oldValue === value) {
      return;
    }

    if (addToHistory) {
      this._addToHistory();
    }

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

  _addToHistory() {
    this._history = this._history.slice(0, this._historyIndex + 1);
    this._history.push(JSON.parse(JSON.stringify(this._state)));
    this._historyIndex++;

    if (this._history.length > 50) {
      this._history.shift();
      this._historyIndex--;
    }
  }

  undo() {
    if (this._historyIndex > 0) {
      this._historyIndex--;
      this._state = JSON.parse(JSON.stringify(this._history[this._historyIndex]));
      this.emit('state:restored');
      return true;
    }
    return false;
  }

  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++;
      this._state = JSON.parse(JSON.stringify(this._history[this._historyIndex]));
      this.emit('state:restored');
      return true;
    }
    return false;
  }
}
