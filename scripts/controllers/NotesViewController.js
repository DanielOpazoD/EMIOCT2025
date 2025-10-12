export class NotesViewController {
  constructor(notesModule) {
    this.notesModule = notesModule;
  }

  focusNote(noteId) {
    const component = this.notesModule.noteComponents.get(noteId);
    if (component) {
      component.bringToFront();
      component.element.focus();
    }
  }

  refreshVisibility() {
    this.notesModule.visibilityManager.updateVisibility();
  }
}
