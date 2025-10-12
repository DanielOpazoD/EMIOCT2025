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

    this.container = options.container || document.body;
    this.config = new EditorConfig(options.config);
    this.state = new EditorState();

    this.modules = {
      notes: new NotesModule(this),
      sections: new SectionsModule(this),
      ui: new UIModule(this),
      persistence: new PersistenceModule(this),
      toolbar: new ToolbarModule(this)
    };

    this._initPromise = this.init();
  }

  async init() {
    const snapshot = await this.modules.persistence.loadFromCache();

    if (snapshot?.state) {
      const { zoom, documentShift, notesHidden } = snapshot.state;
      if (typeof zoom === 'number') {
        this.state.set('zoom', zoom, { addToHistory: false });
      }
      if (typeof documentShift === 'number') {
        this.state.set('documentShift', documentShift, { addToHistory: false });
      }
      if (typeof notesHidden === 'boolean') {
        this.state.set('notes.hidden', notesHidden, { addToHistory: false });
      }
    }

    this.modules.ui.render();
    this.modules.toolbar.setup();
    this.modules.sections.initialize(snapshot?.sections);
    this.modules.notes.initialize(snapshot?.notes);

    this.emit('editor:ready');
    this.emit('ready');
  }

  whenReady() {
    return this._initPromise;
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
    Object.values(this.modules).forEach(module => module.destroy?.());
    this.removeAllListeners();
  }
}
