import { BaseModule } from './BaseModule.js';

export class ToolbarModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.toolbarElement = null;
  }

  setup() {
    this.toolbarElement = document.getElementById('editToolbar');
    if (!this.toolbarElement) {
      return;
    }

    const undoButton = this.toolbarElement.querySelector('#undoBtn');
    if (undoButton) {
      this.addDomListener(undoButton, 'click', () => {
        this.editor.state.undo();
      });
    }

    const redoButton = this.toolbarElement.querySelector('#redoBtn');
    if (redoButton) {
      this.addDomListener(redoButton, 'click', () => {
        this.editor.state.redo();
      });
    }

    const editToggle = document.getElementById('editBtn');
    if (editToggle) {
      this.addDomListener(editToggle, 'click', () => {
        const isEditMode = !this.state.get('editMode');
        this.state.set('editMode', isEditMode);
        editToggle.classList.toggle('is-active', isEditMode);
        this.editor.emit('editor:mode-change', { editMode: isEditMode });
      });
    }

    const readingModeBtn = document.getElementById('readingModeBtn');
    if (readingModeBtn) {
      this.addDomListener(readingModeBtn, 'click', () => {
        const current = !!this.state.get('ui.readingMode');
        this.state.set('ui.readingMode', !current);
      });
    }

    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomInBtn) {
      this.addDomListener(zoomInBtn, 'click', () => this.adjustZoom(0.1));
    }
    if (zoomOutBtn) {
      this.addDomListener(zoomOutBtn, 'click', () => this.adjustZoom(-0.1));
    }
  }

  adjustZoom(delta) {
    const currentZoom = this.state.get('zoom') || 1;
    const nextZoom = Math.max(0.3, Math.min(2.5, currentZoom + delta));
    this.state.set('zoom', Number(nextZoom.toFixed(2)));
  }
}
