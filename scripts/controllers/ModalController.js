export class ModalController {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.modals = new Set();
  }

  initialize() {
    document.querySelectorAll('[data-modal]').forEach(modal => {
      this.modals.add(modal);
      const closeButton = modal.querySelector('[data-modal-close]');
      if (closeButton) {
        closeButton.addEventListener('click', () => this.close(modal));
      }
    });
  }

  open(modal) {
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }

  close(modal) {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }

  closeAll() {
    this.modals.forEach(modal => this.close(modal));
  }
}
