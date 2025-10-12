export class PanelController {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.editor = uiModule.editor;
    this.panelElement = document.querySelector('[data-topbar]');
  }

  initialize() {
    if (!this.panelElement) return;

    const menuButton = this.panelElement.querySelector('.topbar-plus');
    if (menuButton) {
      this.uiModule.addDomListener(menuButton, 'click', () => {
        const isOpen = this.editor.state.get('ui.panelOpen');
        this.editor.state.set('ui.panelOpen', !isOpen);
        this.panelElement.classList.toggle('topbar--open', !isOpen);
      });
    }
  }

  close() {
    if (!this.panelElement) return;
    this.panelElement.classList.remove('topbar--open');
    this.editor.state.set('ui.panelOpen', false);
  }
}
