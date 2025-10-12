import { Component } from './Component.js';

export class NoteBody extends Component {
  constructor(noteComponent) {
    super();
    this.noteComponent = noteComponent;
    this.element = document.createElement('div');
    this.element.className = 'floating-note__body';
    this.render();
  }

  render() {
    const { html, content } = this.noteComponent.data;
    if (html) {
      this.element.innerHTML = html;
    } else {
      this.element.textContent = content || '';
    }
  }
}
