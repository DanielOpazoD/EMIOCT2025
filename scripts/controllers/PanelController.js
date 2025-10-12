export class PanelController {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.editor = uiModule.editor;
    this.state = this.editor.state;

    this.topbarElement = document.querySelector('[data-topbar]');
    this.panelElement = document.getElementById('topic-panel');
    this.backdropElement = document.getElementById('panel-backdrop');

    this.menuButton = this.topbarElement?.querySelector('.topbar-plus') ?? null;
  }

  initialize() {
    if (!this.panelElement) {
      return;
    }

    if (this.menuButton) {
      this.menuButton.setAttribute('aria-expanded', 'false');
      this.menuButton.setAttribute('aria-controls', this.panelElement.id);
      this.menuButton.setAttribute('aria-haspopup', 'true');

      this.uiModule.addDomListener(this.menuButton, 'click', () => {
        this.toggle();
      });
    }

    const closeButtons = Array.from(this.panelElement.querySelectorAll('.panel-close'));
    closeButtons.forEach((button) => {
      this.uiModule.addDomListener(button, 'click', () => this.toggle(false));
    });

    if (this.backdropElement) {
      this.uiModule.addDomListener(this.backdropElement, 'click', () => this.toggle(false));
    }

    this.uiModule.subscribeToState('ui.panelOpen', ({ value }) => {
      this.reflectPanelState(value);
    });

    this.reflectPanelState(!!this.state.get('ui.panelOpen'));
  }

  close() {
    this.toggle(false);
  }

  toggle(forceValue) {
    const current = !!this.state.get('ui.panelOpen');
    const next = typeof forceValue === 'boolean' ? forceValue : !current;
    if (next !== current) {
      this.state.set('ui.panelOpen', next);
    } else {
      // Even if state is unchanged we ensure UI reflects the desired value
      this.reflectPanelState(next);
    }
  }

  reflectPanelState(isOpen) {
    const active = !!isOpen;

    if (this.panelElement) {
      this.panelElement.classList.toggle('open', active);
      this.panelElement.setAttribute('aria-hidden', active ? 'false' : 'true');
    }

    if (this.backdropElement) {
      this.backdropElement.classList.toggle('show', active);
    }

    if (this.menuButton) {
      this.menuButton.classList.toggle('active', active);
      this.menuButton.setAttribute('aria-expanded', active ? 'true' : 'false');
    }

    if (this.topbarElement) {
      this.topbarElement.classList.toggle('topbar--panel-open', active);
    }

    if (document.body) {
      document.body.classList.toggle('panel-open', active);
    }
  }
}
