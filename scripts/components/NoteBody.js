import { Component } from './Component.js';

export class NoteBody extends Component {
  constructor(noteComponent) {
    super();
    this.noteComponent = noteComponent;
    this.element = this.createElement();
    this.bindEvents();
  }

  createElement() {
    const body = document.createElement('div');
    body.className = 'floating-note__body';
    body.contentEditable = 'true';
    body.setAttribute('role', 'textbox');
    body.setAttribute('aria-multiline', 'true');
    return body;
  }

  bindEvents() {
    this.element.addEventListener('input', () => {
      const html = this.element.innerHTML;
      const text = this.element.textContent || '';
      this.noteComponent.notesModule.update(this.noteComponent.data.id, {
        html,
        content: text,
        updatedAt: new Date().toISOString()
      });
    });
  }

  render() {
    const { data } = this.noteComponent;
    if (!this.element) {
      return;
    }

    if (typeof data.html === 'string' && data.html.length > 0) {
      this.element.innerHTML = data.html;
    } else {
      this.element.textContent = data.content || '';
    }
  }
}
