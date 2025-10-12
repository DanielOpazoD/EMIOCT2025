import { BaseModule } from './BaseModule.js';

export class PersistenceModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.storageKey = this.config.get('persistence.storageKey') || 'emi-editor-cache-v1';
    this.autosaveEnabled = this.config.get('persistence.autosave') !== false;
    this.pendingSave = null;
  }

  initialize() {
    if (this.autosaveEnabled) {
      const interval = Number(this.config.get('persistence.interval')) || 30000;
      if (interval > 0) {
        this.setInterval(() => this.save(), interval);
      }
    }

    this.subscribe('notes:change', () => this.scheduleAutosave());
    this.subscribe('note:created', () => this.scheduleAutosave());
    this.subscribe('note:updated', () => this.scheduleAutosave());
    this.subscribe('note:deleted', () => this.scheduleAutosave());

    const unsubscribeState = this.state.on('state:change', () => this.scheduleAutosave());
    this.subscriptions.add(unsubscribeState);
  }

  async loadFromCache() {
    if (!this.isStorageAvailable()) {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      console.warn('No se pudo leer la caché del editor', error);
      return {};
    }
  }

  async save() {
    const payload = {
      state: this.editor.state.toJSON(),
      notes: this.editor.modules.notes?.exportData?.() ?? {},
      sections: this.editor.modules.sections?.exportData?.() ?? [],
      savedAt: new Date().toISOString()
    };

    if (!this.isStorageAvailable()) {
      return payload;
    }

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
      this.editor.emit('persistence:saved', payload);
    } catch (error) {
      console.warn('No se pudo guardar la caché del editor', error);
    }

    return payload;
  }

  importData(data) {
    if (!data || typeof data !== 'object') {
      return;
    }

    if (data.notes) {
      this.editor.modules.notes.importData(data.notes);
    }
    if (data.sections) {
      this.editor.modules.sections.initialize(data.sections);
    }
    if (data.state) {
      this.editor.state.replace(data.state, { addToHistory: false, silent: true });
    }

    this.editor.emit('persistence:imported', data);
  }

  scheduleAutosave() {
    if (!this.autosaveEnabled) {
      return;
    }

    if (this.pendingSave) {
      this.clearTimeout(this.pendingSave);
    }

    this.pendingSave = this.setTimeout(() => {
      this.pendingSave = null;
      this.save();
    }, Number(this.config.get('performance.debounceDelay')) || 300);
  }

  isStorageAvailable() {
    try {
      return typeof window !== 'undefined' && !!window.localStorage;
    } catch (error) {
      return false;
    }
  }
}
