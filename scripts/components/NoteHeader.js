import { Component } from './Component.js';

export class NoteHeader extends Component {
  constructor(noteComponent) {
    super();
    this.noteComponent = noteComponent;
    this.element = document.createElement('header');
    this.element.className = 'floating-note__header';

    this.dragHandle = document.createElement('div');
    this.dragHandle.className = 'floating-note__drag-handle';
    this.dragHandle.title = 'Mover nota';

    this.titleElement = document.createElement('span');
    this.titleElement.className = 'floating-note__title';

    this.closeButton = document.createElement('button');
    this.closeButton.type = 'button';
    this.closeButton.className = 'floating-note__close';
    this.closeButton.title = 'Eliminar nota';
    this.closeButton.textContent = '✕';

    this.element.appendChild(this.dragHandle);
    this.element.appendChild(this.titleElement);
    this.element.appendChild(this.closeButton);

    this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.dragHandle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.emit('drag:start', event);
    });

    this.closeButton.addEventListener('click', () => {
      this.noteComponent.notesModule.delete(this.noteComponent.data.id);
    });
  }

  render() {
    const title = this.noteComponent.data.title || this.noteComponent.data.content || 'Nota';
    this.titleElement.textContent = title.trim() || 'Nota';
  }
}
