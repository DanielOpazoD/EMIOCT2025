import { BaseModule } from './BaseModule.js';
import { FloatingNote } from '../components/FloatingNote.js';
import { NoteRegistry } from '../data/NotesRegistry.js';
import { NotesViewController } from '../controllers/NotesViewController.js';
import { NotesVisibilityManager } from './notes/NotesVisibilityManager.js';
import { NotesDragManager } from './notes/NotesDragManager.js';

export class NotesModule extends BaseModule {
  constructor(editor) {
    super(editor);

    this.registry = new NoteRegistry({
      onChange: () => this.visibilityManager?.updateVisibility()
    });

    this.viewController = new NotesViewController(this);
    this.visibilityManager = new NotesVisibilityManager(this);
    this.dragManager = new NotesDragManager(this);

    this.container = null;
    this.resizeObserver = null;
  }

  initialize(snapshot) {
    this.setupContainer();
    this.setupObservers();
    this.setupEventListeners();

    if (snapshot) {
      this.importData(snapshot);
    }

    this.restoreNotes();
    this.visibilityManager.updateVisibility();
  }

  setupContainer() {
    this.container = document.getElementById('floatingNotesLayer');

    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'floatingNotesLayer';
      this.container.className = 'floating-notes-layer';
      this.editor.container.appendChild(this.container);
    }
  }

  setupObservers() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(entries => {
        this.handleResize(entries);
      });
      this.addObserver(this.resizeObserver);
    }

    this.subscribeToState('currentSection', () => {
      this.visibilityManager.refresh();
    });

    this.subscribeToState('zoom', ({ value }) => {
      this.handleZoomChange(value);
    });
  }

  setupEventListeners() {
    this.dragManager.attach();

    this.addDomListener(document, 'pointermove', event => {
      this.dragManager.handleMove(event);
    });

    this.addDomListener(document, 'pointerup', event => {
      this.dragManager.handleEnd(event);
    });

    this.subscribe('notes:toggle-visibility', () => {
      this.toggleVisibility();
    });
  }

  create(options = {}) {
    const defaultPosition = this.calculateDefaultPosition();
    const basePosition = {
      left: options.left ?? defaultPosition.left,
      top: options.top ?? defaultPosition.top
    };
    const position = options.position
      ? { ...basePosition, ...options.position }
      : basePosition;

    const noteData = this.registry.ensure(options.id, {
      type: options.type || 'floating',
      content: options.content || '',
      topicId: options.topicId || this.state.get('currentPage')?.dataset?.topicId || null,
      left: position.left,
      top: position.top,
      position,
      style: options.style,
      width: options.width ?? this.config.get('modules.notes.defaultWidth')
    });

    noteData.position = {
      left: noteData.left ?? position.left,
      top: noteData.top ?? position.top
    };

    const noteElement = new FloatingNote(noteData, this);
    this.viewController.mount(noteElement);

    if (this.resizeObserver) {
      this.resizeObserver.observe(noteElement.element);
    }

    this.emit('note:created', noteData);
    this.editor.emit('note:created', noteData);
    return noteData;
  }

  update(noteId, updates) {
    const updated = this.registry.update(noteId, updates);
    this.viewController.update(noteId, updated);
    this.emit('note:updated', updated);
    this.editor.emit('note:updated', updated);
    return updated;
  }

  delete(noteId) {
    const noteData = this.registry.get(noteId);
    if (!noteData) return false;

    const element = this.container.querySelector(`[data-note-id="${noteId}"]`);
    if (element && this.resizeObserver) {
      this.resizeObserver.unobserve(element);
    }

    this.viewController.remove(noteId);

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
    const layerRect = this.container.getBoundingClientRect();
    const offset = this.registry.size * 40;

    return {
      left: Math.round((layerRect.width / 2) - 120 + (offset % 160)),
      top: Math.round(120 + (offset % 240))
    };
  }

  handleResize(entries) {
    entries.forEach(entry => {
      const element = entry.target;
      const noteId = element.dataset.noteId;
      if (noteId) {
        const { width, height } = entry.contentRect;
        this.registry.update(noteId, { width, height }, { silent: true });
      }
    });
  }

  handleZoomChange(newZoom) {
    this.registry.forEach(note => {
      this.visibilityManager.updateNotePosition(note, newZoom);
    });
  }

  restoreNotes() {
    // Placeholder for future integration with persistence snapshots
  }

  exportData() {
    const notes = Array.from(this.registry.values()).map(note => {
      const { element, ...rest } = note || {};
      return { ...rest };
    });

    return {
      notes,
      hidden: this.state.get('notes.hidden')
    };
  }

  importData(data = {}) {
    this.registry.clear({ silent: true });
    this.container.innerHTML = '';
    this.viewController.components.clear();

    if (Array.isArray(data.notes)) {
      data.notes.forEach(noteData => {
        this.create({ ...noteData, focus: false });
      });
    }

    if (typeof data.hidden === 'boolean') {
      this.state.set('notes.hidden', data.hidden, { addToHistory: false });
    }
  }

  destroy() {
    super.destroy();

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.container?.querySelectorAll('[data-note-id]').forEach(node => node.remove());
    this.registry.clear({ silent: true });
    this.viewController.components.clear();
  }
}
