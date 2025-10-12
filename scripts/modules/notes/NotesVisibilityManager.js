export class NotesVisibilityManager {
  constructor(notesModule) {
    this.notesModule = notesModule;
  }

  shouldNoteBeVisible(note) {
    if (!note) return false;
    const notesHidden = this.notesModule.state.get('notes.hidden');
    if (notesHidden) {
      return false;
    }

    const currentSection = this.notesModule.state.get('currentSection');
    if (!currentSection || !note.sectionId) {
      return true;
    }

    return String(note.sectionId) === String(currentSection?.id || currentSection);
  }

  updateVisibility() {
    const hidden = this.notesModule.state.get('notes.hidden');
    this.notesModule.container?.classList.toggle('notes-hidden', hidden);
    document.body.classList.toggle('notes-hidden', hidden);

    this.notesModule.container?.querySelectorAll('[data-note-id]').forEach(element => {
      const noteId = element.dataset.noteId;
      const note = this.notesModule.registry.get(noteId);
      const visible = this.shouldNoteBeVisible(note);
      element.hidden = !visible;
      element.setAttribute('aria-hidden', visible ? 'false' : 'true');
    });
  }

  refresh() {
    this.updateVisibility();
  }

  updateNotePosition(note, zoom) {
    if (!note) {
      return;
    }

    const factor = zoom || this.notesModule.state.get('zoom') || 1;
    const baseLeft = note.position?.left ?? note.left ?? 0;
    const baseTop = note.position?.top ?? note.top ?? 0;
    const left = baseLeft * factor;
    const top = baseTop * factor;
    const element = this.notesModule.container?.querySelector(`[data-note-id="${note.id}"]`);
    if (element) {
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
    }
  }
}
