import { EventEmitter } from '../utils/EventEmitter.js';
import { EditorConfig } from '../config/EditorConfig.js';
import { EditorState } from '../state/EditorState.js';
import { NotesModule } from '../modules/NotesModule.js';
import { SectionsModule } from '../modules/SectionsModule.js';
import { UIModule } from '../modules/UIModule.js';
import { PersistenceModule } from '../modules/PersistenceModule.js';
import { ToolbarModule } from '../modules/ToolbarModule.js';

export class Editor extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.container = options.container || document.getElementById('editor-container') || document.body;

    this.config = new EditorConfig(options.config);
    this.state = new EditorState();

    this.modules = {
      notes: new NotesModule(this),
      sections: new SectionsModule(this),
      ui: new UIModule(this),
      persistence: new PersistenceModule(this),
      toolbar: new ToolbarModule(this)
    };

    this._initialized = false;
    this.ready = this.init();
  }

  async init() {
    if (this._initialized) {
      return this.ready;
    }

    this._initialized = true;

    try {
      this.emit('editor:initializing', this);

      this.modules.persistence.initialize?.();
      const persisted = await this.modules.persistence.loadFromCache?.();

      if (persisted?.state) {
        this.state.replace(persisted.state, { silent: true, addToHistory: false });
      }

      this.modules.ui.render();
      this.modules.toolbar.setup();
      this.modules.sections.initialize(persisted?.sections || []);
      this.modules.notes.initialize(persisted?.notes || {});

      this.emit('editor:ready', this);
      this.emit('ready', this);
      return this;
    } catch (error) {
      this.emit('editor:error', error);
      throw error;
    }
  }

  createNote(options = {}) {
    return this.modules.notes.create(options);
  }

  createSection(name) {
    return this.modules.sections.create(name);
  }

  save() {
    return this.modules.persistence.save();
  }

  destroy() {
    Object.values(this.modules).forEach((module) => {
      if (module && typeof module.destroy === 'function') {
        module.destroy();
      }
    });
    this.removeAllListeners();
  }
}
