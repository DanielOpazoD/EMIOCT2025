export class ModalController {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.editor = uiModule.editor;
    this.modals = new Set();
  }

  initialize() {}

  register(modalElement) {
    if (modalElement) {
      this.modals.add(modalElement);
    }
  }

  closeAll() {
    this.modals.forEach((modal) => {
      if (modal && typeof modal.close === 'function') {
        modal.close();
      } else if (modal && modal.classList) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }
}
