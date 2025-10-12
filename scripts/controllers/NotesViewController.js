export class NotesViewController {
  constructor(notesModule) {
    this.notesModule = notesModule;
    this.noteComponents = new Map();
  }

  registerComponent(noteComponent) {
    this.noteComponents.set(noteComponent.data.id, noteComponent);
  }

  unregisterComponent(noteId) {
    this.noteComponents.delete(noteId);
  }

  getComponent(noteId) {
    return this.noteComponents.get(noteId) || null;
  }
}
