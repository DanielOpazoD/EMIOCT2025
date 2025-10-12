import { Component } from './Component.js';

export class NoteHeader extends Component {
  constructor(floatingNote) {
    super();
    this.floatingNote = floatingNote;
    this.element = document.createElement('header');
    this.element.className = 'floating-note__header';
    this.titleElement = document.createElement('h3');
    this.titleElement.className = 'floating-note__title';
    this.element.appendChild(this.titleElement);
  }

  render() {
    const { data } = this.floatingNote;
    if (data.titleHtml) {
      this.titleElement.innerHTML = data.titleHtml;
    } else {
      const title = data.title || 'Nota';
      this.titleElement.textContent = title;
    }
  }
}
