import { Component } from './Component.js';

export class NoteBody extends Component {
  constructor(floatingNote) {
    super();
    this.floatingNote = floatingNote;
    this.element = document.createElement('section');
    this.element.className = 'floating-note__body';
  }

  render() {
    const { data } = this.floatingNote;
    const content = data.content || data.html || '';
    this.element.innerHTML = content || '<p class="floating-note__placeholder">Sin contenido</p>';
  }
}
