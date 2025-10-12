import { EventEmitter } from '../utils/EventEmitter.js';
import { NotesModule } from '../modules/NotesModule.js';
import { SectionsModule } from '../modules/SectionsModule.js';
import { UIModule } from '../modules/UIModule.js';
import { PersistenceModule } from '../modules/PersistenceModule.js';
import { ToolbarModule } from '../modules/ToolbarModule.js';
import { EditorConfig } from '../config/EditorConfig.js';
import { EditorState } from '../state/EditorState.js';

export class Editor extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = options;
    this.container = options.container || document.body;
    this.config = new EditorConfig(options.config);
    this.state = new EditorState();

    this.modules = {
      persistence: new PersistenceModule(this),
      ui: new UIModule(this),
      toolbar: new ToolbarModule(this),
      sections: new SectionsModule(this),
      notes: new NotesModule(this)
    };

    this._readyPromise = this.init();
  }

  async init() {
    try {
      await this.modules.persistence.loadFromCache();
    } catch (error) {
      console.warn('Error al cargar la persistencia inicial', error);
    }

    this.modules.ui.render();
    this.modules.toolbar.setup();
    this.modules.sections.initialize();
    this.modules.notes.initialize();
    this.modules.persistence.startAutosave();

    this.emit('editor:ready', this);
    this.emit('ready', this);
    return this;
  }

  get ready() {
    return this._readyPromise;
  }

  createNote(options) {
    return this.modules.notes.create(options);
  }

  createSection(name) {
    return this.modules.sections.create(name);
  }

  save() {
    return this.modules.persistence.save();
  }

  destroy() {
    Object.values(this.modules).forEach((module) => module.destroy?.());
    this.removeAllListeners();
  }
}
