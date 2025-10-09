export class NoteRegistry {
  constructor() {
    this.notes = new Map();
    this.observers = new Set();
  }

  add(noteData) {
    this.notes.set(noteData.id, noteData);
    this.#notify('added', noteData);
  }

  update(noteData) {
    this.notes.set(noteData.id, noteData);
    this.#notify('updated', noteData);
  }

  remove(id) {
    const data = this.notes.get(id);
    this.notes.delete(id);
    if (data) {
      this.#notify('removed', data);
    }
  }

  find(id) {
    return this.notes.get(id) || null;
  }

  values() {
    return Array.from(this.notes.values());
  }

  clear() {
    this.notes.clear();
    this.#notify('cleared');
  }

  size() {
    return this.notes.size;
  }

  observe(observer) {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  #notify(type, payload = null) {
    this.observers.forEach((observer) => {
      observer({ type, payload, registry: this });
    });
  }
}
