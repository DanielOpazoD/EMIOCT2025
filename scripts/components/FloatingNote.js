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
  }

  createElement() {
    const element = document.createElement('article');
    element.className = 'floating-note enhanced-note';
    element.dataset.noteId = this.data.id;
    element.style.left = `${this.data.left ?? 0}px`;
    element.style.top = `${this.data.top ?? 0}px`;
    element.style.width = `${this.data.width ?? this.notesModule.defaultWidth}px`;
    element.tabIndex = 0;
    return element;
  }

  setupElement() {
    this.element.appendChild(this.components.header.element);
    this.element.appendChild(this.components.body.element);
    this.element.appendChild(this.components.footer.element);
  }

  bindEvents() {
    this.components.header.on('drag:start', (event) => {
      this.notesModule.dragManager.startDrag(this, event);
    });

    this.element.addEventListener('pointerdown', () => {
      this.bringToFront();
    });

    this.on('data:update', (newData) => {
      this.data = newData;
      this.render();
    });
  }

  render() {
    Object.values(this.components).forEach((component) => {
      if (typeof component.render === 'function') {
        component.render();
      }
    });

    this.updatePosition();
    this.updateVisibility();
  }

  updatePosition() {
    if (this.data.left !== undefined) {
      this.element.style.left = `${this.data.left}px`;
    }
    if (this.data.top !== undefined) {
      this.element.style.top = `${this.data.top}px`;
    }
    if (this.data.width) {
      this.element.style.width = `${this.data.width}px`;
    }
  }

  updateVisibility() {
    const shouldShow = this.notesModule.visibilityManager.shouldNoteBeVisible(this.data);
    this.element.hidden = !shouldShow;
    this.element.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  }

  bringToFront() {
    const siblings = Array.from(this.notesModule.container.children);
    const maxZ = siblings.reduce((acc, node) => {
      const current = parseInt(node.style.zIndex || '0', 10);
      return Number.isNaN(current) ? acc : Math.max(acc, current);
    }, 0);
    this.element.style.zIndex = String(maxZ + 1);
    this.notesModule.emit('note:focused', this.data);
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
      component.destroy?.();
    });
    super.destroy();
  }
}
