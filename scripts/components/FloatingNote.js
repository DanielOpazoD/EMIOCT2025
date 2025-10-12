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
    element.style.position = 'absolute';
    element.style.left = `${this.data.left ?? this.data.position?.left ?? 0}px`;
    element.style.top = `${this.data.top ?? this.data.position?.top ?? 0}px`;
    element.style.width = `${this.data.width ?? this.notesModule.config.get('modules.notes.defaultWidth')}px`;
    element.tabIndex = 0;

    if (this.data.style) {
      element.classList.add(`floating-note-style-${this.data.style}`);
    }

    return element;
  }

  setupElement() {
    this.element.innerHTML = '';
    this.element.appendChild(this.components.header.element);
    this.element.appendChild(this.components.body.element);
    this.element.appendChild(this.components.footer.element);
  }

  bindEvents() {
    this.element.addEventListener('pointerdown', () => {
      this.bringToFront();
    });
  }

  render() {
    Object.values(this.components).forEach(component => component.render?.());
    this.updatePosition();
    this.updateStyle();
    this.updateVisibility();
  }

  updatePosition() {
    const left = this.data.left ?? this.data.position?.left ?? 0;
    const top = this.data.top ?? this.data.position?.top ?? 0;
    this.element.style.left = `${left}px`;
    this.element.style.top = `${top}px`;
  }

  updateStyle() {
    const classList = [...this.element.classList].filter(cls => !cls.startsWith('floating-note-style-'));
    this.element.className = classList.join(' ') || 'floating-note';
    if (this.data.style) {
      this.element.classList.add(`floating-note-style-${this.data.style}`);
    }
  }

  updateVisibility() {
    const shouldShow = this.notesModule.visibilityManager.shouldNoteBeVisible(this.data);
    this.element.hidden = !shouldShow;
    this.element.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  }

  bringToFront() {
    const siblings = Array.from(this.notesModule.container.children);
    const maxZ = siblings.reduce((max, node) => {
      const value = Number.parseInt(node.style.zIndex || '0', 10);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    this.element.style.zIndex = String(maxZ + 1);
    this.notesModule.emit('note:focused', this.data);
    this.editor.emit('note:focused', this.data);
  }

  setPosition(left, top) {
    this.data.left = left;
    this.data.top = top;
    this.data.position = { left, top };
    this.updatePosition();
    this.notesModule.update(this.data.id, {
      left,
      top,
      position: { left, top }
    });
  }

  destroy() {
    Object.values(this.components).forEach(component => component.destroy?.());
    super.destroy();
  }
}
