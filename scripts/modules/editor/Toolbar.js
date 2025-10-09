import { qs, bindEvent } from '../../utils/dom.js';

export class Toolbar {
  constructor({ textEditor, templateLibrary, tableMenu }) {
    this.textEditor = textEditor;
    this.templateLibrary = templateLibrary;
    this.tableMenu = tableMenu;
  }

  init() {
    this.#cacheElements();
    this.#bindEvents();
  }

  #cacheElements() {
    this.elements = {
      editBtn: qs('#editBtn'),
      boldBtn: qs('#boldBtn'),
      italicBtn: qs('#italicBtn'),
      underlineBtn: qs('#underlineBtn'),
      fontSizeSelect: qs('#fontSizeSelect'),
      highlightBtn: qs('#highlightBtn'),
      textColorBtn: qs('#textColorBtn'),
      indentBtn: qs('#indentBtn'),
      outdentBtn: qs('#outdentBtn'),
      insertTableBtn: qs('#insertTableBtn'),
      insertUlBtn: qs('#insertUlBtn'),
      insertOlBtn: qs('#insertOlBtn'),
      insertTemplateBtn: qs('#insertTemplateBtn'),
      removeFormatBtn: qs('#removeFormatBtn'),
      copyHtmlBtn: qs('#copyHtmlSelectionBtn')
    };
  }

  #bindEvents() {
    const { editBtn, boldBtn, italicBtn, underlineBtn, fontSizeSelect, highlightBtn, textColorBtn, indentBtn, outdentBtn, insertTableBtn, insertUlBtn, insertOlBtn, insertTemplateBtn, removeFormatBtn, copyHtmlBtn } = this.elements;

    bindEvent(editBtn, 'click', () => {
      const enabled = this.textEditor.toggleEditMode();
      editBtn?.setAttribute('aria-pressed', String(enabled));
    });

    bindEvent(boldBtn, 'click', () => this.textEditor.applyCommand('bold'));
    bindEvent(italicBtn, 'click', () => this.textEditor.applyCommand('italic'));
    bindEvent(underlineBtn, 'click', () => this.textEditor.applyCommand('underline'));

    bindEvent(fontSizeSelect, 'change', (event) => {
      if (!event.target.value) return;
      this.textEditor.applyCommand('fontSize', event.target.value);
      event.target.selectedIndex = 0;
    });

    bindEvent(highlightBtn, 'click', () => {
      const color = window.prompt('Color de resaltado (ej. #fff3cd)', '#fff3cd');
      if (color) {
        this.textEditor.wrapSelection(`<span style="background:${color}">`, '</span>');
      }
    });

    bindEvent(textColorBtn, 'click', () => {
      const color = window.prompt('Color de texto', '#212529');
      if (color) {
        this.textEditor.applyCommand('foreColor', color);
      }
    });

    bindEvent(indentBtn, 'click', () => this.textEditor.applyCommand('indent'));
    bindEvent(outdentBtn, 'click', () => this.textEditor.applyCommand('outdent'));

    bindEvent(insertTableBtn, 'click', () => this.tableMenu?.open());
    bindEvent(insertUlBtn, 'click', () => this.textEditor.insertList('ul'));
    bindEvent(insertOlBtn, 'click', () => this.textEditor.insertList('ol'));

    bindEvent(insertTemplateBtn, 'click', () => this.templateLibrary?.open());

    bindEvent(removeFormatBtn, 'click', () => this.textEditor.applyCommand('removeFormat'));

    bindEvent(copyHtmlBtn, 'click', () => {
      const page = this.textEditor.getCurrentPage();
      if (!page) return;
      const body = page.querySelector('.page-body');
      if (!body) return;
      navigator.clipboard.writeText(body.innerHTML).then(() => {
        copyHtmlBtn.textContent = '✔ Copiado';
        setTimeout(() => {
          copyHtmlBtn.textContent = '<>';
        }, 1500);
      });
    });
  }
}
