import { Component } from './Component.js';
import { NoteHeader } from './NoteHeader.js';
import { NoteBody } from './NoteBody.js';
import { NoteFooter } from './NoteFooter.js';

export class FloatingNote extends Component {
  constructor(noteData, notesModule) {
    super();
    this.data = noteData;
    this.notesModule = notesModule;
    this.editor = notesModule.editor;

    this.element = this.createElement();
    this.components = {
      header: new NoteHeader(this),
      body: new NoteBody(this),
      footer: new NoteFooter(this)
    };

    this.setupElement();
    this.bindEvents();
    this.render();
  }

  createElement() {
    const element = document.createElement('article');
    element.className = 'floating-note enhanced-note';
    element.dataset.noteId = this.data.id;
    element.tabIndex = 0;
    return element;
  }

  setupElement() {
    this.element.appendChild(this.components.header.element);
    this.element.appendChild(this.components.body.element);
    this.element.appendChild(this.components.footer.element);
    this.updatePosition();
    this.updateDimensions();
    this.updateStyle();
  }

  bindEvents() {
    this.components.header.on('drag:start', ({ originalEvent }) => {
      this.notesModule.dragManager.startDrag(this, originalEvent);
    });

    this.element.addEventListener('pointerdown', () => {
      this.bringToFront();
      this.notesModule.state.set('notes.selected', this.data.id, { addToHistory: false });
    });
  }

  updateData(newData) {
    this.data = newData;
    this.render();
  }

  render() {
    Object.values(this.components).forEach((component) => {
      component.render();
    });

    this.updatePosition();
    this.updateDimensions();
    this.updateStyle();
    this.updateVisibility();
  }

  updatePosition() {
    if (typeof this.data.left === 'number') {
      this.element.style.left = `${this.data.left}px`;
    }
    if (typeof this.data.top === 'number') {
      this.element.style.top = `${this.data.top}px`;
    }
  }

  updateDimensions() {
    if (typeof this.data.width === 'number') {
      this.element.style.width = `${this.data.width}px`;
    } else {
      this.element.style.width = '';
    }

    if (typeof this.data.height === 'number') {
      this.element.style.height = `${this.data.height}px`;
    } else {
      this.element.style.height = '';
    }
  }

  updateStyle() {
    const classList = Array.from(this.element.classList);
    classList
      .filter((className) => className.startsWith('floating-note-style-'))
      .forEach((className) => this.element.classList.remove(className));

    if (this.data.style) {
      this.element.classList.add(`floating-note-style-${this.data.style}`);
    }

    if (this.data.borderColor) {
      this.element.style.setProperty('--floating-note-border-color', this.data.borderColor);
    } else {
      this.element.style.removeProperty('--floating-note-border-color');
    }
  }

  updateVisibility() {
    const shouldShow = this.notesModule.visibilityManager.shouldNoteBeVisible(this.data);
    this.element.hidden = !shouldShow;
    this.element.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  }

  bringToFront() {
    const siblings = Array.from(this.notesModule.container?.children || []);
    const maxZ = siblings.reduce((acc, el) => {
      const current = Number.parseInt(globalThis.getComputedStyle(el).zIndex || '0', 10);
      return Number.isFinite(current) ? Math.max(acc, current) : acc;
    }, 0);

    this.element.style.zIndex = String(maxZ + 1);
    this.notesModule.editor.emit('note:focused', this.data);
  }

  setPosition(left, top) {
    this.data = {
      ...this.data,
      left,
      top
    };
    this.updatePosition();
    this.notesModule.update(this.data.id, { left, top });
  }

  destroy() {
    Object.values(this.components).forEach((component) => {
      if (typeof component.destroy === 'function') {
        component.destroy();
      }
    });

    super.destroy();
  }
}
