import { Component } from './Component.js';

export class NoteFooter extends Component {
  constructor(floatingNote) {
    super();
    this.floatingNote = floatingNote;
    this.element = document.createElement('footer');
    this.element.className = 'floating-note__footer';
    this.actionsContainer = document.createElement('div');
    this.actionsContainer.className = 'floating-note__actions';
    this.deleteButton = document.createElement('button');
    this.deleteButton.type = 'button';
    this.deleteButton.className = 'floating-note__delete';
    this.deleteButton.textContent = 'Eliminar';
    this.actionsContainer.appendChild(this.deleteButton);
    this.element.appendChild(this.actionsContainer);

    this.deleteButton.addEventListener('click', () => {
      this.floatingNote.notesModule.delete(this.floatingNote.data.id);
    });
  }

  render() {
    // Footer currently static
  }
}
