import { FloatingNote } from './FloatingNote.js';
import { NoteRegistry } from './NoteRegistry.js';
import { computeInitialPosition } from './noteUtils.js';
import { save, load } from '../../utils/storage.js';
import { toggleClass, bindEvent } from '../../utils/dom.js';

const CACHE_KEY = 'emi-notes-cache-v1';

export class NotesViewController {
  constructor({
    layer,
    addButton,
    toggleButton,
    summaryButton,
    focusLayerCallback = () => {}
  }) {
    this.layer = layer;
    this.addButton = addButton;
    this.toggleButton = toggleButton;
    this.summaryButton = summaryButton;
    this.focusLayerCallback = focusLayerCallback;

    this.registry = new NoteRegistry();
    this.notes = new Map();
    this.offset = 0;
    this.hidden = false;
  }

  init() {
    if (!this.layer) {
      console.warn('No se encontró el contenedor de notas flotantes');
      return;
    }
    this.#attachEvents();
    this.#restoreFromCache();
  }

  #attachEvents() {
    if (this.addButton) {
      bindEvent(this.addButton, 'click', () => this.createNote());
    }
    if (this.toggleButton) {
      bindEvent(this.toggleButton, 'click', () => this.toggleVisibility());
    }
    if (this.summaryButton) {
      bindEvent(this.summaryButton, 'click', () => this.showSummary());
    }

    this.registry.observe(() => {
      this.#saveToCache();
      this.updateCounters();
    });
  }

  createNote(data = {}) {
    if (!this.layer) return null;
    const position = data.left === undefined || data.top === undefined
      ? computeInitialPosition(this.layer, this.offset += 40)
      : { left: data.left, top: data.top };

    const note = new FloatingNote({
      ...data,
      left: position.left,
      top: position.top,
      onUpdate: (payload) => this.#handleNoteUpdate(payload),
      onDelete: (id) => this.removeNote(id),
      onFocus: (instance) => this.focusNote(instance)
    });

    this.notes.set(note.id, note);
    this.layer.appendChild(note.element);
    this.registry.add(note.serialize());
    this.focusNote(note);
    return note;
  }

  removeNote(id) {
    const note = this.notes.get(id);
    if (!note) return;
    note.element.remove();
    this.notes.delete(id);
    this.registry.remove(id);
  }

  focusNote(note) {
    this.focusLayerCallback();
    this.layer.querySelectorAll('.floating-note').forEach((element) => {
      element.style.zIndex = element === note.element ? '100' : '1';
    });
  }

  toggleVisibility(force) {
    this.hidden = force ?? !this.hidden;
    toggleClass(document.body, 'notes-hidden', this.hidden);
    if (this.toggleButton) {
      this.toggleButton.setAttribute('aria-pressed', String(!this.hidden));
    }
  }

  clear() {
    this.notes.forEach((note) => note.element.remove());
    this.notes.clear();
    this.registry.clear();
  }

  updateCounters() {
    if (this.summaryButton) {
      this.summaryButton.dataset.count = String(this.registry.size());
    }
  }

  showSummary() {
    const lines = this.registry.values().map((note) => `• ${note.title}`);
    const message = lines.length ? lines.join('\n') : 'No hay notas registradas.';
    window.alert(message);
  }

  #handleNoteUpdate(payload) {
    this.registry.update(payload);
  }

  #saveToCache() {
    const serialized = this.registry.values();
    save(CACHE_KEY, serialized);
  }

  #restoreFromCache() {
    const cached = load(CACHE_KEY, []);
    cached.forEach((noteData) => {
      const note = this.createNote(noteData);
      if (note) {
        this.registry.update(note.serialize());
      }
    });
    this.updateCounters();
  }
}
