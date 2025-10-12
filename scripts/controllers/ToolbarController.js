export class ToolbarController {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.notesModule = uiModule.editor.modules.notes;
    this.toolbarElement = document.getElementById('editToolbar');
  }

  initialize() {
    if (!this.toolbarElement) {
      return;
    }

    const addNoteBtn = this.toolbarElement.querySelector('#addFloatingNoteBtn');
    if (addNoteBtn) {
      addNoteBtn.addEventListener('click', () => {
        this.notesModule.create({ content: '<p>Nueva nota</p>' });
      });
    }

    const toggleNotesBtn = this.toolbarElement.querySelector('#toggleNotesBtn');
    if (toggleNotesBtn) {
      toggleNotesBtn.addEventListener('click', () => {
        this.uiModule.editor.emit('notes:toggle-visibility');
      });
    }
  }
}
