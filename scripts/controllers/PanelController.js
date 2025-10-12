export class PanelController {
  constructor(uiModule) {
    this.ui = uiModule;
    this.panelElement = document.querySelector('[data-navigation-panel]');
  }

  initialize() {
    const menuButton = document.querySelector('[data-topbar] .topbar-plus');
    if (menuButton && this.panelElement) {
      this.ui.listen(menuButton, 'click', () => {
        this.toggle();
      });
    }
  }

  toggle(force) {
    if (!this.panelElement) {
      return;
    }

    const shouldOpen = force ?? !this.panelElement.classList.contains('is-open');
    this.panelElement.classList.toggle('is-open', shouldOpen);
    this.ui.state.set('ui.panelOpen', shouldOpen, { addToHistory: false });
  }

  close() {
    if (!this.panelElement) {
      return;
    }
    this.panelElement.classList.remove('is-open');
    this.ui.state.set('ui.panelOpen', false, { addToHistory: false });
  }
}
