import { BaseModule } from './BaseModule.js';

const STORAGE_KEY = 'emi-editor-cache';

export class PersistenceModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.autosaveIntervalId = null;
  }

  async loadFromCache() {
    if (!this.isEnabled()) return;
    try {
      const storage = this.getStorage();
      if (!storage) return;
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (data.state) {
        Object.entries(data.state).forEach(([path, value]) => {
          this.state.set(path, value, { addToHistory: false, silent: true });
        });
      }

      if (data.notes && this.editor.modules?.notes) {
        this.editor.modules.notes.importData(data.notes);
      }
    } catch (error) {
      console.warn('No se pudo restaurar la caché del editor', error);
    }
  }

  async save() {
    if (!this.isEnabled()) return;
    try {
      const storage = this.getStorage();
      if (!storage) return;

      const payload = {
        state: {
          'zoom': this.state.get('zoom'),
          'notes.hidden': this.state.get('notes.hidden')
        },
        notes: this.editor.modules?.notes?.exportData()
      };

      storage.setItem(STORAGE_KEY, JSON.stringify(payload));
      this.emit('persistence:saved', payload);
      return payload;
    } catch (error) {
      console.warn('Error al guardar la caché del editor', error);
      return null;
    }
  }

  startAutosave() {
    if (!this.config.get('persistence.autosave')) {
      return;
    }

    const interval = this.config.get('persistence.interval') || 30000;
    if (this.autosaveIntervalId) {
      return;
    }
    this.autosaveIntervalId = this.setInterval(() => this.save(), interval);
  }

  stopAutosave() {
    if (this.autosaveIntervalId) {
      this.clearInterval(this.autosaveIntervalId);
      this.autosaveIntervalId = null;
    }
  }

  destroy() {
    this.stopAutosave();
    super.destroy();
  }

  isEnabled() {
    return this.config.get('modules.notes.enabled') !== false;
  }

  getStorage() {
    const storageType = this.config.get('persistence.storage');
    if (storageType === 'localStorage' && typeof window !== 'undefined') {
      return window.localStorage;
    }
    return null;
  }
}
