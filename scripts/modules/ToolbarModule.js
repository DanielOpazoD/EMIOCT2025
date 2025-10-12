import { BaseModule } from './BaseModule.js';

export class ToolbarModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.toolbarElement = document.getElementById('editToolbar');
  }

  setup() {
    if (!this.toolbarElement) return;

    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
      this.addDomListener(undoBtn, 'click', () => this.editor.state.undo());
    }

    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) {
      this.addDomListener(redoBtn, 'click', () => this.editor.state.redo());
    }

    const zoomInBtn = document.getElementById('zoomInBtn');
    if (zoomInBtn) {
      this.addDomListener(zoomInBtn, 'click', () => {
        const current = this.state.get('zoom') || 1;
        this.state.set('zoom', Math.min(current + 0.1, 2));
      });
    }

    const zoomOutBtn = document.getElementById('zoomOutBtn');
    if (zoomOutBtn) {
      this.addDomListener(zoomOutBtn, 'click', () => {
        const current = this.state.get('zoom') || 1;
        this.state.set('zoom', Math.max(current - 0.1, 0.5));
      });
    }
  }
}
