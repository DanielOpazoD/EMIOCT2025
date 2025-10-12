export class ModalController {
  constructor(uiModule) {
    this.ui = uiModule;
    this.activeModals = new Set();
  }

  initialize() {
    document.querySelectorAll('[data-modal-close]').forEach((button) => {
      this.ui.listen(button, 'click', () => {
        const modal = button.closest('.modal');
        if (modal) {
          this.close(modal.id);
        }
      });
    });
  }

  register(modalElement) {
    if (modalElement?.id) {
      this.activeModals.add(modalElement.id);
    }
  }

  open(id) {
    const modal = document.getElementById(id);
    if (!modal) {
      return;
    }
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    this.activeModals.add(id);
  }

  close(id) {
    const modal = document.getElementById(id);
    if (!modal) {
      return;
    }
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    this.activeModals.delete(id);
  }

  closeAll() {
    [...this.activeModals].forEach((id) => this.close(id));
  }
}
