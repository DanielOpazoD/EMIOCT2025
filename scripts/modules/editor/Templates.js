import { createElement, bindEvent } from '../../utils/dom.js';

const TEMPLATES = [
  {
    id: 'highlight',
    label: 'Caja destacada',
    html: '<div class="box note-style-classic"><p><strong>Idea principal:</strong> completa el contenido.</p></div>'
  },
  {
    id: 'definition',
    label: 'Definición',
    html: '<div class="box note-style-rose"><p><strong>Definición:</strong> describe el concepto aquí.</p></div>'
  },
  {
    id: 'list',
    label: 'Lista rápida',
    html: '<ul><li>Punto clave 1</li><li>Punto clave 2</li><li>Punto clave 3</li></ul>'
  }
];

export class TemplateLibrary {
  constructor({ modal, onSelect }) {
    this.modal = modal;
    this.onSelect = onSelect;
  }

  open() {
    if (!this.modal) return;
    const container = createElement('div', { className: 'template-picker' });
    TEMPLATES.forEach((template) => {
      const button = createElement('button', {
        className: 'template-picker-btn',
        textContent: template.label,
        attrs: { type: 'button' }
      });
      bindEvent(button, 'click', () => {
        this.onSelect?.(template.html);
        this.modal.close();
      });
      container.append(button);
    });
    this.modal.open(container);
  }
}
