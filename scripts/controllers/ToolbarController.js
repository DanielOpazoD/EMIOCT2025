export class ToolbarController {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.editor = uiModule.editor;
  }

  initialize() {
    const toolbar = document.getElementById('editToolbar');
    if (!toolbar) return;

    const addNoteBtn = document.getElementById('addFloatingNoteBtn');
    if (addNoteBtn) {
      this.uiModule.addDomListener(addNoteBtn, 'click', () => {
        this.editor.createNote({ content: 'Nueva nota' });
      });
    }

    const toggleNotesBtn = document.getElementById('toggleNotesBtn');
    if (toggleNotesBtn) {
      this.uiModule.addDomListener(toggleNotesBtn, 'click', () => {
        this.editor.modules.notes?.toggleVisibility();
      });
    }
  }
}
