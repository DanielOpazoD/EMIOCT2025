import { createElement, bindEvent, clamp } from '../../utils/dom.js';

const DEFAULT_WIDTH = 240;
const DEFAULT_HEIGHT = 180;
const NOTE_STYLES = new Map([
  ['default', 'floating-note-style-default'],
  ['sky', 'floating-note-style-sky'],
  ['mint', 'floating-note-style-mint'],
  ['rose', 'floating-note-style-rose'],
  ['lilac', 'floating-note-style-lilac'],
  ['slate', 'floating-note-style-slate']
]);

let idCounter = 0;

function nextId() {
  idCounter += 1;
  return `floating-note-${idCounter}`;
}

export class FloatingNote {
  constructor(options = {}) {
    this.id = options.id || nextId();
    this.title = options.title || 'Nota';
    this.category = options.category || 'general';
    this.position = {
      left: options.left ?? 40,
      top: options.top ?? 40
    };
    this.size = {
      width: clamp(options.width ?? DEFAULT_WIDTH, 160, 420),
      height: clamp(options.height ?? DEFAULT_HEIGHT, 120, 520)
    };
    this.styleId = NOTE_STYLES.has(options.styleId) ? options.styleId : 'default';
    this.html = options.html || '';
    this.reviewed = Boolean(options.reviewed);
    this.onUpdate = options.onUpdate ?? (() => {});
    this.onDelete = options.onDelete ?? (() => {});
    this.onFocus = options.onFocus ?? (() => {});

    this.element = this.#createElement();
    this.#applyInitialState();
    this.#attachEvents();
  }

  #createElement() {
    const note = createElement('div', {
      className: `floating-note enhanced-note ${NOTE_STYLES.get(this.styleId)}`,
      dataset: { noteId: this.id }
    });

    const header = createElement('header', { className: 'floating-note-header' });
    const title = createElement('span', {
      className: 'floating-note-title',
      textContent: this.title
    });
    const actions = createElement('div', { className: 'floating-note-actions' });
    const deleteBtn = createElement('button', {
      className: 'floating-note-action',
      attrs: { type: 'button', 'aria-label': 'Eliminar nota' },
      textContent: '✕'
    });
    const styleBtn = createElement('button', {
      className: 'floating-note-action',
      attrs: { type: 'button', 'aria-label': 'Cambiar estilo' },
      textContent: '🎨'
    });

    const body = createElement('section', {
      className: 'floating-note-body',
      attrs: { contentEditable: 'true', role: 'textbox' }
    });
    body.innerHTML = this.html || '<p>Escribe algo…</p>';

    const footer = createElement('footer', { className: 'floating-note-footer' });
    const resizeHandle = createElement('span', {
      className: 'floating-note-resize-handle',
      attrs: { title: 'Cambiar tamaño' }
    });

    actions.append(styleBtn, deleteBtn);
    header.append(title, actions);
    footer.append(resizeHandle);
    note.append(header, body, footer);

    this.refs = {
      header,
      title,
      actions,
      deleteBtn,
      styleBtn,
      body,
      resizeHandle
    };

    return note;
  }

  #applyInitialState() {
    this.setPosition(this.position.left, this.position.top);
    this.setSize(this.size.width, this.size.height);
    this.updateTitle(this.title);
    this.toggleReviewed(this.reviewed);
  }

  #attachEvents() {
    const { header, body, deleteBtn, styleBtn, resizeHandle } = this.refs;

    let pointerId = null;
    let dragOffset = { x: 0, y: 0 };

    const startDrag = (event) => {
      if (event.button !== 0) return;
      pointerId = event.pointerId;
      const rect = this.element.getBoundingClientRect();
      dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      this.element.classList.add('dragging');
      this.onFocus(this);
      this.element.setPointerCapture(pointerId);
    };

    const handleMove = (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const layer = this.element.offsetParent;
      if (!layer) return;
      const layerRect = layer.getBoundingClientRect();
      const left = event.clientX - layerRect.left - dragOffset.x;
      const top = event.clientY - layerRect.top - dragOffset.y;
      this.setPosition(left, top, { notify: true });
    };

    const endDrag = (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      this.element.classList.remove('dragging');
      this.element.releasePointerCapture(pointerId);
      pointerId = null;
    };

    const startResize = (event) => {
      event.preventDefault();
      event.stopPropagation();
      pointerId = event.pointerId;
      const rect = this.element.getBoundingClientRect();
      dragOffset = {
        width: rect.width,
        height: rect.height,
        startX: event.clientX,
        startY: event.clientY
      };
      this.element.classList.add('resizing');
      this.element.setPointerCapture(pointerId);
    };

    const handleResize = (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const deltaX = event.clientX - dragOffset.startX;
      const deltaY = event.clientY - dragOffset.startY;
      const width = clamp(dragOffset.width + deltaX, 160, 520);
      const height = clamp(dragOffset.height + deltaY, 120, 520);
      this.setSize(width, height, { notify: true });
    };

    const endResize = (event) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      this.element.classList.remove('resizing');
      this.element.releasePointerCapture(pointerId);
      pointerId = null;
    };

    bindEvent(header, 'pointerdown', startDrag);
    bindEvent(this.element, 'pointermove', handleMove);
    bindEvent(this.element, 'pointerup', endDrag);
    bindEvent(this.element, 'pointercancel', endDrag);

    bindEvent(resizeHandle, 'pointerdown', startResize);
    bindEvent(this.element, 'pointermove', handleResize);
    bindEvent(this.element, 'pointerup', endResize);
    bindEvent(this.element, 'pointercancel', endResize);

    bindEvent(body, 'input', () => {
      this.html = body.innerHTML;
      this.onUpdate(this.serialize());
    });

    bindEvent(deleteBtn, 'click', () => {
      this.onDelete(this.id);
    });

    bindEvent(styleBtn, 'click', () => {
      const styles = Array.from(NOTE_STYLES.keys());
      const index = styles.indexOf(this.styleId);
      const nextStyle = styles[(index + 1) % styles.length];
      this.setStyle(nextStyle, { notify: true });
    });

    bindEvent(header, 'dblclick', () => {
      const next = window.prompt('Título de la nota', this.title);
      if (next !== null) {
        this.updateTitle(next.trim());
        this.onUpdate(this.serialize());
      }
    });

    bindEvent(body, 'focus', () => {
      this.onFocus(this);
    });
  }

  focus() {
    this.refs.body.focus();
  }

  updateTitle(title) {
    this.title = title || 'Nota';
    this.refs.title.textContent = this.title;
    this.element.setAttribute('aria-label', this.title);
  }

  setStyle(styleId, { notify = false } = {}) {
    if (!NOTE_STYLES.has(styleId)) return;
    this.element.classList.remove(NOTE_STYLES.get(this.styleId));
    this.styleId = styleId;
    this.element.classList.add(NOTE_STYLES.get(styleId));
    if (notify) {
      this.onUpdate(this.serialize());
    }
  }

  setPosition(left, top, { notify = false } = {}) {
    this.position.left = Math.round(left);
    this.position.top = Math.round(top);
    this.element.style.left = `${this.position.left}px`;
    this.element.style.top = `${this.position.top}px`;
    if (notify) {
      this.onUpdate(this.serialize());
    }
  }

  setSize(width, height, { notify = false } = {}) {
    this.size.width = Math.round(width);
    this.size.height = Math.round(height);
    this.element.style.width = `${this.size.width}px`;
    this.element.style.height = `${this.size.height}px`;
    if (notify) {
      this.onUpdate(this.serialize());
    }
  }

  toggleReviewed(reviewed = !this.reviewed) {
    this.reviewed = reviewed;
    this.element.classList.toggle('floating-note-reviewed', reviewed);
  }

  serialize() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      left: this.position.left,
      top: this.position.top,
      width: this.size.width,
      height: this.size.height,
      styleId: this.styleId,
      html: this.html,
      reviewed: this.reviewed
    };
  }
}

export { NOTE_STYLES };
