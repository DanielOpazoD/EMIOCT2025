import { BaseModule } from './BaseModule.js';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.1;

export class ToolbarModule extends BaseModule {
  setup() {
    this.bindButtons();
    this.subscribeToState('zoom', ({ value }) => {
      this.updateZoomDisplay(value);
    });
    this.updateZoomDisplay(this.state.get('zoom'));
  }

  bindButtons() {
    const addNoteBtn = document.getElementById('addFloatingNoteBtn');
    if (addNoteBtn) {
      this.listen(addNoteBtn, 'click', () => {
        this.editor.createNote();
      });
    }

    const toggleNotesBtn = document.getElementById('toggleNotesBtn');
    if (toggleNotesBtn) {
      this.listen(toggleNotesBtn, 'click', () => {
        this.editor.modules.notes.toggleVisibility();
      });
    }

    const saveBtn = document.getElementById('cacheSaveBtn');
    if (saveBtn) {
      this.listen(saveBtn, 'click', async () => {
        await this.editor.save();
        this.editor.modules.ui?.showMessage?.('Guardado en caché', 'success');
      });
    }

    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
      this.listen(undoBtn, 'click', () => {
        if (!this.state.undo()) {
          this.editor.modules.ui?.showMessage?.('Nada que deshacer', 'info', 1500);
        }
      });
    }

    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) {
      this.listen(redoBtn, 'click', () => {
        if (!this.state.redo()) {
          this.editor.modules.ui?.showMessage?.('Nada que rehacer', 'info', 1500);
        }
      });
    }

    const zoomInBtn = document.getElementById('zoomInBtn');
    if (zoomInBtn) {
      this.listen(zoomInBtn, 'click', () => {
        this.adjustZoom(ZOOM_STEP);
      });
    }

    const zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomOutBtn) {
      this.listen(zoomOutBtn, 'click', () => {
        this.adjustZoom(-ZOOM_STEP);
      });
    }
  }

  adjustZoom(delta) {
    const current = Number(this.state.get('zoom')) || 1;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2))));
    this.state.set('zoom', next, { addToHistory: true });
    this.editor.emit('zoom:changed', next);
  }

  updateZoomDisplay(zoom) {
    const zoomValueEl = document.getElementById('zoomValue');
    if (zoomValueEl) {
      const percentage = Math.round((Number(zoom) || 1) * 100);
      zoomValueEl.textContent = `${percentage}%`;
    }
  }
}
