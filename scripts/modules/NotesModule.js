import { BaseModule } from './BaseModule.js';
import { FloatingNote } from '../components/FloatingNote.js';
import { NoteRegistry, createEnhancedNote } from './notes/NoteRegistry.js';
import { NotesViewController } from '../controllers/NotesViewController.js';

class NotesVisibilityManager {
  constructor(notesModule) {
    this.notesModule = notesModule;
  }

  shouldNoteBeVisible(noteData) {
    if (this.notesModule.state.get('notes.hidden')) {
      return false;
    }

    const maxVisible = this.notesModule.config.get('modules.notes.maxVisible');
    if (Number.isFinite(maxVisible) && maxVisible > 0) {
      const index = Array.from(this.notesModule.noteComponents.keys()).indexOf(noteData.id);
      if (index >= maxVisible) {
        return false;
      }
    }

    return true;
  }

  updateNoteVisibility(component) {
    const visible = this.shouldNoteBeVisible(component.data);
    component.element.hidden = !visible;
    component.element.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  updateVisibility() {
    this.notesModule.noteComponents.forEach((component) => {
      this.updateNoteVisibility(component);
    });
  }

  refresh() {
    this.updateVisibility();
  }

  updateNotePosition(noteData) {
    const component = this.notesModule.noteComponents.get(noteData.id);
    if (component) {
      component.updatePosition();
    }
  }
}

class NotesDragManager {
  constructor(notesModule) {
    this.notesModule = notesModule;
    this.activeDrag = null;
    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
  }

  attach() {
    this.notesModule.listen(window, 'pointermove', this.handleMove);
    this.notesModule.listen(window, 'pointerup', this.handleEnd);
  }

  startDrag(component, event) {
    if (!this.notesModule.container) {
      return;
    }

    const containerRect = this.notesModule.container.getBoundingClientRect();
    const noteRect = component.element.getBoundingClientRect();

    this.activeDrag = {
      component,
      pointerId: event.pointerId,
      offsetX: event.clientX - noteRect.left,
      offsetY: event.clientY - noteRect.top,
      containerRect
    };

    component.element.classList.add('is-dragging');
    component.element.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  handleMove(event) {
    if (!this.activeDrag || event.pointerId !== this.activeDrag.pointerId) {
      return;
    }

    const { component, offsetX, offsetY } = this.activeDrag;
    const containerRect = this.notesModule.container.getBoundingClientRect();

    let nextLeft = event.clientX - containerRect.left - offsetX;
    let nextTop = event.clientY - containerRect.top - offsetY;

    nextLeft = Math.max(0, Math.min(nextLeft, containerRect.width - component.element.offsetWidth));
    nextTop = Math.max(0, Math.min(nextTop, containerRect.height - component.element.offsetHeight));

    component.setPosition(nextLeft, nextTop);
  }

  handleEnd(event) {
    if (!this.activeDrag || event.pointerId !== this.activeDrag.pointerId) {
      return;
    }

    this.activeDrag.component.element.classList.remove('is-dragging');
    this.activeDrag.component.element.releasePointerCapture?.(this.activeDrag.pointerId);
    this.activeDrag = null;
  }
}

export class NotesModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.registry = new NoteRegistry({
      onChange: () => this.handleRegistryChange()
    });
    this.viewController = new NotesViewController(this);
    this.visibilityManager = new NotesVisibilityManager(this);
    this.dragManager = new NotesDragManager(this);
    this.noteComponents = new Map();
    this.container = null;
    this.resizeObserver = null;
    this.isRestoring = false;
  }

  initialize(initialData = {}) {
    const data = Array.isArray(initialData)
      ? { notes: initialData }
      : (initialData || {});

    this.setupContainer();
    this.setupObservers();
    this.setupEventListeners();

    const hidden = typeof data.hidden === 'boolean' ? data.hidden : !!this.state.get('notes.hidden');
    this.state.set('notes.hidden', hidden, { silent: true, addToHistory: false });
    document.body.classList.toggle('notes-hidden', hidden);

    this.restoreNotes(data.notes || []);
    this.visibilityManager.updateVisibility();
  }

  setupContainer() {
    this.container = document.getElementById('floatingNotesLayer');
    if (!this.container) {
      throw new Error('Notes container not found');
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

    this.subscribeToState('notes.hidden', ({ value }) => {
      document.body.classList.toggle('notes-hidden', value);
      this.visibilityManager.updateVisibility();
    });

    this.subscribeToState('zoom', ({ value }) => {
      this.handleZoomChange(value);
    });
  }

  setupEventListeners() {
    this.dragManager.attach();
  }

  create(options = {}) {
    if (!this.container) {
      throw new Error('Notes container not initialized');
    }

    const notesConfig = this.config.get('modules.notes') || {};
    const defaultPosition = this.calculateDefaultPosition();

    const normalizedOptions = {
      type: options.type || 'floating',
      left: options.left ?? options.position?.left ?? defaultPosition.left,
      top: options.top ?? options.position?.top ?? defaultPosition.top,
      width: options.width ?? notesConfig.defaultWidth,
      topicId: options.topicId ?? this.state.get('currentPage')?.dataset?.topicId ?? null,
      ...options
    };

    const noteData = createEnhancedNote(normalizedOptions);
    this.registry.set(noteData.id, noteData, { silent: options.restoring });

    const component = new FloatingNote(noteData, this);
    this.noteComponents.set(noteData.id, component);
    this.container.appendChild(component.element);

    if (this.resizeObserver) {
      this.resizeObserver.observe(component.element);
    }

    this.visibilityManager.updateNoteVisibility(component);

    if (!options.restoring) {
      this.editor.emit('note:created', noteData);
      this.handleRegistryChange();
    }

    return noteData;
  }

  update(noteId, updates) {
    if (!noteId) {
      return null;
    }

    const updated = this.registry.update(noteId, updates, { silent: true });
    if (!updated) {
      return null;
    }

    const component = this.noteComponents.get(noteId);
    if (component) {
      component.updateData(updated);
    }

    this.editor.emit('note:updated', updated);
    this.handleRegistryChange();
    return updated;
  }

  delete(noteId, options = {}) {
    if (!noteId) {
      return false;
    }

    const component = this.noteComponents.get(noteId);
    if (component) {
      if (this.resizeObserver) {
        this.resizeObserver.unobserve(component.element);
      }
      component.destroy();
      this.noteComponents.delete(noteId);
    }

    const noteData = this.registry.get(noteId);
    const removed = this.registry.delete(noteId, { silent: options.restoring });

    if (!options.restoring && noteData) {
      this.editor.emit('note:deleted', noteData);
      this.handleRegistryChange();
    }

    return removed;
  }

  toggleVisibility() {
    const hidden = !!this.state.get('notes.hidden');
    this.state.set('notes.hidden', !hidden, { addToHistory: true });
  }

  calculateDefaultPosition() {
    if (!this.container) {
      return { left: 80, top: 120 };
    }

    const offset = this.registry.size * 24;
    const left = 80 + (offset % 160);
    const top = 120 + (offset % 240);
    return { left, top };
  }

  handleResize(entries) {
    entries.forEach((entry) => {
      const element = entry.target;
      const noteId = element.dataset.noteId;
      if (!noteId) {
        return;
      }
      const { width, height } = entry.contentRect;
      this.registry.update(noteId, { width, height }, { silent: true });
      this.handleRegistryChange();
    });
  }

  handleZoomChange() {
    this.noteComponents.forEach((component) => {
      component.updatePosition();
    });
  }

  restoreNotes(notes = []) {
    if (!Array.isArray(notes) || notes.length === 0) {
      return;
    }

    this.isRestoring = true;
    notes.forEach((noteData) => {
      this.create({ ...noteData, restoring: true });
    });
    this.isRestoring = false;
  }

  exportData() {
    const notes = Array.from(this.registry.values()).map((note) => {
      const { element, ...rest } = note;
      return { ...rest };
    });

    return {
      notes,
      hidden: !!this.state.get('notes.hidden')
    };
  }

  importData(data = {}) {
    const payload = Array.isArray(data) ? { notes: data } : data;

    this.noteComponents.forEach((component) => {
      if (this.resizeObserver) {
        this.resizeObserver.unobserve(component.element);
      }
      component.destroy();
    });
    this.noteComponents.clear();
    this.registry.clear({ silent: true });

    const hidden = typeof payload.hidden === 'boolean' ? payload.hidden : false;
    this.state.set('notes.hidden', hidden, { silent: true, addToHistory: false });
    document.body.classList.toggle('notes-hidden', hidden);

    this.restoreNotes(payload.notes || []);
    this.handleRegistryChange();
  }

  handleRegistryChange() {
    if (this.isRestoring) {
      return;
    }
    this.visibilityManager.updateVisibility();
    const exportData = this.exportData();
    this.emit('notes:change', exportData);
    this.editor.emit('notes:change', exportData);
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.noteComponents.forEach((component) => {
      component.destroy();
    });
    this.noteComponents.clear();

    super.destroy();
  }
}
