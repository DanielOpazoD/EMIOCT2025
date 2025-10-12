import { Component } from './Component.js';
import { getNoteCategoryInfo } from '../modules/notes/noteUtils.js';

export class NoteFooter extends Component {
  constructor(noteComponent) {
    super();
    this.noteComponent = noteComponent;
    this.element = this.createElement();
    this.statusElement = this.element.querySelector('.floating-note__status');
  }

  createElement() {
    const footer = document.createElement('footer');
    footer.className = 'floating-note__footer';
    footer.innerHTML = `
      <span class="floating-note__status"></span>
    `;
    return footer;
  }

  render() {
    if (!this.statusElement) {
      return;
    }

    const { data } = this.noteComponent;
    const categoryInfo = getNoteCategoryInfo(data.category);
    const updatedAt = data.updatedAt ? new Date(data.updatedAt) : null;

    const parts = [];
    if (categoryInfo?.label) {
      parts.push(categoryInfo.label);
    }
    if (updatedAt && !Number.isNaN(updatedAt.getTime())) {
      parts.push(`Actualizada ${updatedAt.toLocaleString()}`);
    }

    this.statusElement.textContent = parts.join(' • ');
  }
}
