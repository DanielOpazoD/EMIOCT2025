import { BaseModule } from './BaseModule.js';

const DEFAULT_STORAGE_KEY = 'emi-editor-cache-v2';

export class PersistenceModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.storageKey = DEFAULT_STORAGE_KEY;
    this.autosaveIntervalId = null;
  }

  async loadFromCache() {
    if (!this.isStorageAvailable()) {
      return null;
    }

    try {
      const cachedValue = window.localStorage.getItem(this.storageKey);
      if (!cachedValue) {
        this.startAutosave();
        return null;
      }

      const snapshot = JSON.parse(cachedValue);
      this.startAutosave();
      return snapshot;
    } catch (error) {
      console.warn('No se pudo cargar el estado del editor', error);
      return null;
    }
  }

  async save() {
    if (!this.isStorageAvailable()) {
      return false;
    }

    const payload = {
      notes: this.editor.modules.notes?.exportData?.() || null,
      sections: this.editor.modules.sections?.exportData?.() || null,
      state: {
        zoom: this.state.get('zoom'),
        documentShift: this.state.get('documentShift'),
        notesHidden: this.state.get('notes.hidden')
      },
      savedAt: new Date().toISOString()
    };

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
      this.editor.emit('persistence:saved', payload);
      return true;
    } catch (error) {
      console.error('No se pudo guardar el estado del editor', error);
      return false;
    }
  }

  startAutosave() {
    const autosaveEnabled = this.config.get('persistence.autosave');
    const interval = this.config.get('persistence.interval');

    if (!autosaveEnabled || !Number.isFinite(interval) || interval <= 0) {
      return;
    }

    if (this.autosaveIntervalId) {
      window.clearInterval(this.autosaveIntervalId);
    }

    this.autosaveIntervalId = this.setInterval(() => {
      this.save();
    }, interval);
  }

  isStorageAvailable() {
    try {
      const storage = window.localStorage;
      const testKey = '__emi-test__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }

  destroy() {
    super.destroy();
    if (this.autosaveIntervalId) {
      window.clearInterval(this.autosaveIntervalId);
      this.autosaveIntervalId = null;
    }
  }
}
