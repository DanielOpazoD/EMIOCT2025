export class LayoutManager {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.editor = uiModule.editor;
    this.zoomDisplay = document.getElementById('zoomValue');
  }

  initialize() {
    this.updateZoom(this.editor.state.get('zoom'));
  }

  updateZoom(value) {
    if (this.zoomDisplay) {
      this.zoomDisplay.textContent = `${Math.round(value * 100)}%`;
    }
    const container = document.querySelector('[data-document]');
    if (container) {
      container.style.setProperty('--editor-zoom', value);
    }
  }

  toggleReadingMode(enabled) {
    document.body.classList.toggle('reading-mode', !!enabled);
  }

  handleResize() {
    this.editor.emit('layout:resized');
  }
}
