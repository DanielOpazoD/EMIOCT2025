import { createElement, qs, qsa, toggleClass, focusElement } from '../../utils/dom.js';
import { clampNumber } from '../../utils/validation.js';

const DEFAULT_THEME = 'theme-blue';

export class TextEditor {
  constructor({
    container,
    themeSelect
  }) {
    this.container = container;
    this.themeSelect = themeSelect;
    this.pages = [];
    this.isEditMode = false;
    this.currentTheme = DEFAULT_THEME;
  }

  init() {
    this.#ensureContainer();
    this.refreshPages();
    if (!this.pages.length) {
      this.createPage({ title: 'Nuevo tema', focus: false });
    }
    this.setTheme(this.currentTheme);
    this.setEditMode(false);
    this.#attachThemeListener();
  }

  #ensureContainer() {
    if (this.container) {
      return;
    }
    const existing = qs('#pagesRoot');
    if (existing) {
      this.container = existing;
      return;
    }
    const reference = qs('#floatingNotesLayer') || document.body.lastElementChild;
    const wrapper = createElement('main', { className: 'pages-root', attrs: { id: 'pagesRoot' } });
    document.body.insertBefore(wrapper, reference);
    this.container = wrapper;
  }

  refreshPages() {
    this.pages = qsa('.page', this.container);
  }

  setEditMode(enabled) {
    this.isEditMode = Boolean(enabled);
    toggleClass(document.body, 'edit-mode', this.isEditMode);
    this.pages.forEach((page) => {
      page.contentEditable = this.isEditMode ? 'true' : 'false';
      qsa('[contenteditable="true"]', page).forEach((editable) => {
        editable.contentEditable = this.isEditMode ? 'true' : 'false';
      });
    });
    if (!this.isEditMode) {
      window.getSelection().removeAllRanges();
    }
  }

  toggleEditMode() {
    this.setEditMode(!this.isEditMode);
    return this.isEditMode;
  }

  setTheme(theme) {
    const nextTheme = theme || DEFAULT_THEME;
    this.currentTheme = nextTheme;
    this.pages.forEach((page) => {
      page.classList.remove(...Array.from(page.classList).filter((className) => className.startsWith('theme-')));
      page.classList.add(nextTheme);
    });
    if (this.themeSelect && this.themeSelect.value !== nextTheme) {
      this.themeSelect.value = nextTheme;
    }
  }

  #attachThemeListener() {
    if (!this.themeSelect) return;
    this.themeSelect.addEventListener('change', (event) => {
      this.setTheme(event.target.value);
    });
  }

  addPageAfter(targetPage, options = {}) {
    const index = this.pages.indexOf(targetPage);
    const page = this.createPage(options);
    if (index >= 0) {
      targetPage.after(page);
    } else {
      this.container.append(page);
    }
    this.refreshPages();
    return page;
  }

  createPage({ title = 'Nuevo tema', focus = true, html = '<p>Escribe aquí…</p>' } = {}) {
    const topicIndex = this.pages.length + 1;
    const page = createElement('article', {
      className: `page ${this.currentTheme}`,
      dataset: {
        topicId: `topic-${topicIndex}`
      }
    });

    const header = createElement('header', { className: 'page-header' });
    const heading = createElement('h1');
    const span = createElement('span', {
      className: 'topic-title-text',
      textContent: title
    });
    heading.append(span);
    header.append(heading);

    const body = createElement('div', {
      className: 'page-body',
      attrs: { contentEditable: 'true' }
    });
    body.innerHTML = html;

    page.append(header, body);
    this.container.append(page);
    this.refreshPages();
    if (focus && this.isEditMode) {
      focusElement(body);
    }
    return page;
  }

  removePage(page) {
    if (!page) return;
    const index = this.pages.indexOf(page);
    page.remove();
    this.refreshPages();
    if (this.pages.length === 0) {
      this.createPage({ focus: false });
    }
    const next = this.pages[Math.max(0, index - 1)] || this.pages[0];
    if (next && this.isEditMode) {
      const body = qs('.page-body', next);
      focusElement(body);
    }
  }

  applyCommand(command, value = null) {
    if (!this.isEditMode) return;
    document.execCommand(command, false, value);
  }

  wrapSelection(before, after) {
    if (!this.isEditMode) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    const fragment = document.createElement('span');
    fragment.innerHTML = `${before}${selectedText}${after}`;
    range.deleteContents();
    range.insertNode(fragment);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  insertList(type) {
    if (!this.isEditMode) return;
    const command = type === 'ol' ? 'insertOrderedList' : 'insertUnorderedList';
    document.execCommand(command);
  }

  insertTable({ rows = 2, cols = 2 } = {}) {
    const clampedRows = clampNumber(rows, 1, 12, 2);
    const clampedCols = clampNumber(cols, 1, 6, 2);
    const table = document.createElement('table');
    table.className = 'editor-table';
    for (let row = 0; row < clampedRows; row += 1) {
      const tr = document.createElement('tr');
      for (let col = 0; col < clampedCols; col += 1) {
        const cell = document.createElement('td');
        cell.innerHTML = '<p>&nbsp;</p>';
        tr.append(cell);
      }
      table.append(tr);
    }
    this.insertHTML(table.outerHTML);
  }

  insertTemplate(html) {
    this.insertHTML(html);
  }

  insertHTML(html) {
    if (!this.isEditMode) return;
    document.execCommand('insertHTML', false, html);
  }

  getExportData() {
    return this.pages.map((page) => {
      const titleEl = qs('h1 .topic-title-text', page);
      const body = qs('.page-body', page);
      return {
        id: page.dataset.topicId,
        title: titleEl ? titleEl.textContent : 'Tema',
        html: body ? body.innerHTML : '',
        theme: this.currentTheme
      };
    });
  }

  loadFromData(pages = []) {
    this.container.innerHTML = '';
    if (pages.length > 0) {
      this.currentTheme = pages[0].theme || this.currentTheme;
    }
    pages.forEach((pageData) => {
      this.createPage({
        title: pageData.title,
        html: pageData.html,
        focus: false
      });
    });
    this.refreshPages();
    this.setTheme(this.currentTheme);
  }

  getCurrentPage() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return this.pages[0] || null;
    }
    const anchor = selection.anchorNode instanceof Element
      ? selection.anchorNode
      : selection.anchorNode?.parentElement;
    if (!anchor) return this.pages[0] || null;
    return anchor.closest('.page');
  }
}
