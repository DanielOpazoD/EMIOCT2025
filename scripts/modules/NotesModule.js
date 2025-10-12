import { BaseModule } from './BaseModule.js';
import { FloatingNote } from '../components/FloatingNote.js';
import { NotesRegistry, createEnhancedNote } from '../data/NotesRegistry.js';
import { NotesViewController } from '../controllers/NotesViewController.js';
import { NotesVisibilityManager } from '../managers/NotesVisibilityManager.js';
import { NotesDragManager } from '../managers/NotesDragManager.js';

export class NotesModule extends BaseModule {
  constructor(editor) {
    super(editor);

    this.registry = new NotesRegistry({
      onChange: () => this.handleRegistryChange()
    });
    this.viewController = new NotesViewController(this);
    this.visibilityManager = new NotesVisibilityManager(this);
    this.dragManager = new NotesDragManager(this);

    this.container = null;
    this.resizeObserver = null;
    this.noteComponents = new Map();
    this.defaultWidth = this.config.get('modules.notes.defaultWidth') || 240;
  }

  initialize() {
    this.setupContainer();
    this.setupObservers();
    this.restoreNotes();
  }

  setupContainer() {
    this.container = document.getElementById('floatingNotesLayer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'floatingNotesLayer';
      this.container.className = 'floating-notes-layer';
      this.editor.container?.appendChild(this.container);
    }
  }

  setupObservers() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        this.handleResize(entries);
      });
      this.addObserver(this.resizeObserver);
    }

    this.subscribeToState('currentSection', () => {
      this.visibilityManager.refresh();
    });

    this.subscribeToState('notes.hidden', () => {
      this.visibilityManager.updateVisibility();
    });

    this.subscribeToState('zoom', ({ value }) => {
      this.handleZoomChange(value);
    });
  }

  create(options = {}) {
    const position = options.position || this.calculateDefaultPosition();
    const noteData = createEnhancedNote({
      ...options,
      left: position.left,
      top: position.top,
      width: options.width || this.defaultWidth,
      topicId: options.topicId || this.state.get('currentPage')?.dataset?.topicId || null,
      sectionId: options.sectionId || this.state.get('currentSection') || null
    });

    this.registry.set(noteData.id, noteData);
    const noteComponent = this.instantiateNote(noteData);
    this.emit('note:created', noteData);
    this.editor.emit('note:created', noteData);
    return noteData;
  }

  instantiateNote(noteData) {
    if (!this.container) {
      throw new Error('Notes container not found');
    }

    const noteComponent = new FloatingNote(noteData, this);
    this.noteComponents.set(noteData.id, noteComponent);
    this.viewController.registerComponent(noteComponent);
    this.container.appendChild(noteComponent.element);

    if (this.resizeObserver) {
      this.resizeObserver.observe(noteComponent.element);
    }

    noteComponent.render();
    return noteComponent;
  }

  update(noteId, updates) {
    const updated = this.registry.update(noteId, updates);
    const component = this.noteComponents.get(noteId);
    if (component) {
      component.emit('data:update', updated);
    }
    this.emit('note:updated', updated);
    this.editor.emit('note:updated', updated);
    return updated;
  }

  delete(noteId) {
    const noteData = this.registry.get(noteId);
    if (!noteData) return false;

    const component = this.noteComponents.get(noteId);
    if (component) {
      if (this.resizeObserver) {
        this.resizeObserver.unobserve(component.element);
      }
      component.destroy();
      this.viewController.unregisterComponent(noteId);
      this.noteComponents.delete(noteId);
    }

    this.registry.delete(noteId);
    this.emit('note:deleted', noteData);
    this.editor.emit('note:deleted', noteData);
    return true;
  }

  toggleVisibility() {
    const hidden = !!this.state.get('notes.hidden');
    this.state.set('notes.hidden', !hidden);
    this.visibilityManager.updateVisibility();
  }

  calculateDefaultPosition() {
    if (!this.container) return { left: 80, top: 120 };
    const layerRect = this.container.getBoundingClientRect();
    const offset = (this.registry.size % 6) * 40;

    return {
      left: Math.round(layerRect.width / 4 + offset),
      top: Math.round(layerRect.height / 4 + offset)
    };
  }

  handleResize(entries) {
    entries.forEach((entry) => {
      const element = entry.target;
      const noteId = element.dataset.noteId;
      if (noteId) {
        const { width, height } = entry.contentRect;
        this.registry.update(noteId, { width, height }, { silent: true });
      }
    });
  }

  handleZoomChange() {
    this.registry.forEach((note) => {
      this.visibilityManager.updateNotePosition(note);
    });
  }

  restoreNotes() {
    const stored = this.editor.config.get('modules.notes.initialNotes');
    if (Array.isArray(stored)) {
      stored.forEach((note) => {
        const normalized = createEnhancedNote(note);
        this.registry.set(normalized.id, normalized, { silent: true });
        this.instantiateNote(normalized);
      });
    }
  }

  exportData() {
    return {
      notes: Array.from(this.registry.values()),
      hidden: this.state.get('notes.hidden')
    };
  }

  importData(data) {
    if (!data) return;
    this.registry.clear({ silent: true });
    this.noteComponents.forEach((component) => component.destroy());
    this.noteComponents.clear();

    if (Array.isArray(data.notes)) {
      data.notes.forEach((noteData) => {
        const normalized = createEnhancedNote(noteData);
        this.registry.set(normalized.id, normalized, { silent: true });
        this.instantiateNote(normalized);
      });
    }

    if (typeof data.hidden === 'boolean') {
      this.state.set('notes.hidden', data.hidden, { addToHistory: false });
    }

    this.visibilityManager.updateVisibility();
  }

  handleRegistryChange() {
    this.editor.modules?.persistence?.startAutosave?.();
  }

  destroy() {
    this.noteComponents.forEach((component) => component.destroy());
    this.noteComponents.clear();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    super.destroy();
  }
}
