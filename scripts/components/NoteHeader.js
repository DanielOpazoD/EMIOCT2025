import { Component } from './Component.js';
import { getNoteDisplayTitle } from '../modules/notes/noteUtils.js';

export class NoteHeader extends Component {
  constructor(noteComponent) {
    super();
    this.noteComponent = noteComponent;
    this.element = this.createElement();
    this.titleElement = this.element.querySelector('.floating-note__title');
    this.closeButton = this.element.querySelector('.floating-note__close');
    this.bindEvents();
  }

  createElement() {
    const header = document.createElement('header');
    header.className = 'floating-note__header';
    header.innerHTML = `
      <span class="floating-note__title"></span>
      <button type="button" class="floating-note__close" aria-label="Eliminar nota">×</button>
    `;
    return header;
  }

  bindEvents() {
    this.element.addEventListener('pointerdown', (event) => {
      if (event.target === this.closeButton) {
        return;
      }
      this.emit('drag:start', { originalEvent: event });
    });

    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => {
        this.noteComponent.notesModule.delete(this.noteComponent.data.id);
      });
    }
  }

  render() {
    if (!this.titleElement) {
      return;
    }

    const data = this.noteComponent.data;
    const displayTitle = getNoteDisplayTitle(data.title, 'Nota sin título');
    this.titleElement.textContent = displayTitle;
  }
}
