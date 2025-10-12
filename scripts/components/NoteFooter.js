import { Component } from './Component.js';

export class NoteFooter extends Component {
  constructor(noteComponent) {
    super();
    this.noteComponent = noteComponent;
    this.element = document.createElement('footer');
    this.element.className = 'floating-note__footer';

    this.timestampElement = document.createElement('span');
    this.timestampElement.className = 'floating-note__timestamp';
    this.element.appendChild(this.timestampElement);

    this.render();
  }

  render() {
    const { updatedAt } = this.noteComponent.data;
    if (updatedAt) {
      const date = new Date(updatedAt);
      const formatted = date.toLocaleString();
      this.timestampElement.textContent = `Actualizado: ${formatted}`;
    } else {
      this.timestampElement.textContent = '';
    }
  }
}
