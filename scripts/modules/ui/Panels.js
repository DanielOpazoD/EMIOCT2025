import { toggleClass, bindEvent } from '../../utils/dom.js';

export class PanelManager {
  constructor({ backdrop }) {
    this.backdrop = backdrop;
    this.panels = new Map();
  }

  registerPanel(id, { element, openButtons = [], closeButtons = [], activeClass = 'show' }) {
    if (!element) return;
    this.panels.set(id, { element, activeClass });
    openButtons.forEach((btn) => bindEvent(btn, 'click', () => this.open(id)));
    closeButtons.forEach((btn) => bindEvent(btn, 'click', () => this.close(id)));
  }

  open(id) {
    const panel = this.panels.get(id);
    if (!panel) return;
    toggleClass(panel.element, panel.activeClass, true);
    this.#updateBackdrop();
  }

  close(id) {
    const panel = this.panels.get(id);
    if (!panel) return;
    toggleClass(panel.element, panel.activeClass, false);
    this.#updateBackdrop();
  }

  toggle(id) {
    const panel = this.panels.get(id);
    if (!panel) return;
    const isActive = panel.element.classList.toggle(panel.activeClass);
    this.#updateBackdrop();
    return isActive;
  }

  closeAll() {
    this.panels.forEach((panel) => {
      toggleClass(panel.element, panel.activeClass, false);
    });
    this.#updateBackdrop();
  }

  #updateBackdrop() {
    if (!this.backdrop) return;
    const anyActive = Array.from(this.panels.values()).some(({ element, activeClass }) => element.classList.contains(activeClass));
    toggleClass(this.backdrop, 'show', anyActive);
  }
}
