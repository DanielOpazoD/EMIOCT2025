import { qs, toggleClass, bindEvent } from '../../utils/dom.js';

export class Modal {
  constructor({ overlay, content }) {
    this.overlay = overlay || qs('#modalOverlay');
    this.content = content || qs('#modalContent', this.overlay);
    this.handleKeyDown = this.#handleKeyDown.bind(this);
  }

  init() {
    if (!this.overlay) return;
    bindEvent(this.overlay, 'click', (event) => {
      if (event.target === this.overlay) {
        this.close();
      }
    });
  }

  open(node) {
    if (!this.overlay || !this.content) return;
    this.content.innerHTML = '';
    if (typeof node === 'string') {
      this.content.innerHTML = node;
    } else if (node instanceof HTMLElement) {
      this.content.append(node);
    }
    toggleClass(this.overlay, 'show', true);
    document.addEventListener('keydown', this.handleKeyDown);
  }

  close() {
    if (!this.overlay) return;
    toggleClass(this.overlay, 'show', false);
    this.content.innerHTML = '';
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  #handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}
