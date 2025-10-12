export class LayoutManager {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.editor = uiModule.editor;
    this.zoomDisplay = document.getElementById('zoomValue');
    this.readingModeExit = document.getElementById('readingModeExit');
    this.documentElement = document.documentElement;
  }

  initialize() {
    const zoom = this.editor.state.get('zoom') ?? 1;
    this.updateZoom(zoom);
    const shift = this.editor.state.get('documentShift') ?? 0;
    this.updateDocumentShift(shift);
    this.toggleReadingMode(this.editor.state.get('ui.readingMode'));
  }

  updateZoom(value) {
    if (this.zoomDisplay) {
      this.zoomDisplay.textContent = `${Math.round(value * 100)}%`;
    }
    const container = document.querySelector('[data-document]')
      || (this.editor.container instanceof HTMLElement ? this.editor.container : null);
    if (container) {
      container.style.setProperty('--editor-zoom', value);
    }
  }

  toggleReadingMode(enabled) {
    document.body.classList.toggle('reading-mode', !!enabled);
    if (this.readingModeExit) {
      const active = !!enabled;
      this.readingModeExit.hidden = !active;
      this.readingModeExit.setAttribute('aria-hidden', active ? 'false' : 'true');
    }
  }

  handleResize() {
    this.editor.emit('layout:resized');
  }

  updateDocumentShift(value) {
    if (!this.documentElement) return;
    this.documentElement.style.setProperty('--document-horizontal-shift', `${value}px`);
  }
}
