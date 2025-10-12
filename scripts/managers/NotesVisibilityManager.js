export class NotesVisibilityManager {
  constructor(notesModule) {
    this.notesModule = notesModule;
  }

  shouldNoteBeVisible(note) {
    if (this.notesModule.state.get('notes.hidden')) {
      return false;
    }

    const currentSection = this.notesModule.state.get('currentSection');
    if (note.sectionId && currentSection && note.sectionId !== currentSection) {
      return false;
    }

    return true;
  }

  updateVisibility() {
    if (!this.notesModule.container) return;
    this.notesModule.viewController.noteComponents.forEach((component) => {
      component.updateVisibility();
    });
  }

  refresh() {
    this.updateVisibility();
  }

  updateNotePosition(note) {
    const component = this.notesModule.viewController.getComponent(note.id);
    if (component) {
      component.updatePosition();
    }
  }
}
