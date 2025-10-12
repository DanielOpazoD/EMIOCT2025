export class PanelController {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.panelElement = document.querySelector('[data-panel]');
  }

  initialize() {
    if (!this.panelElement) {
      return;
    }

    const closeButton = this.panelElement.querySelector('[data-panel-close]');
    if (closeButton) {
      closeButton.addEventListener('click', () => this.close());
    }
  }

  open() {
    if (!this.panelElement) return;
    this.panelElement.hidden = false;
    this.uiModule.state.set('ui.panelOpen', true);
  }

  close() {
    if (!this.panelElement) return;
    this.panelElement.hidden = true;
    this.uiModule.state.set('ui.panelOpen', false);
  }
}
