export class NotesViewController {
  constructor(notesModule) {
    this.notesModule = notesModule;
    this.components = new Map();
  }

  mount(noteComponent) {
    this.notesModule.container.appendChild(noteComponent.element);
    noteComponent.render();
    this.components.set(noteComponent.data.id, noteComponent);
  }

  refresh() {
    this.notesModule.container.querySelectorAll('[data-note-id]').forEach(element => {
      const noteId = element.dataset.noteId;
      const note = this.notesModule.registry.get(noteId);
      if (!note) {
        element.remove();
        this.components.delete(noteId);
        return;
      }

      element.style.left = `${note.left ?? 0}px`;
      element.style.top = `${note.top ?? 0}px`;
    });
  }

  update(noteId, data) {
    const component = this.components.get(noteId);
    if (!component) {
      return;
    }

    component.data = data;
    component.render();
  }

  remove(noteId) {
    const component = this.components.get(noteId);
    if (component) {
      component.destroy();
      this.components.delete(noteId);
    }
  }
}
