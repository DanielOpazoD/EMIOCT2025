import { BaseModule } from './BaseModule.js';
import { clamp } from '../utils/math.js';

const MIN_FONT_SIZE = 1;
const MAX_FONT_SIZE = 7;
const DEFAULT_FONT_SIZE = 3;

const HIGHLIGHT_COLORS = [
  '#fff3cd',
  '#ffe69c',
  '#ffd43b',
  '#ffec99',
  '#ffd8a8',
  '#c0eb75',
  '#a5d8ff',
  '#d0bfff',
  '#fbcfe8',
  '#ffe5ec'
];

const TEXT_COLORS = [
  '#111827',
  '#1f2937',
  '#334155',
  '#4338ca',
  '#2563eb',
  '#0ea5e9',
  '#16a34a',
  '#b91c1c',
  '#f97316',
  '#f59e0b',
  '#14b8a6',
  '#6366f1',
  '#f43f5e',
  '#6b7280',
  '#f1f5f9'
];

export class ToolbarModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.toolbarElement = document.getElementById('editToolbar');
    this.highlightPalette = document.getElementById('highlightPalette');
    this.textColorPalette = document.getElementById('textColorPalette');
    this.activePalette = null;
    this.activePaletteTrigger = null;
    this.copiedFormat = null;
    this.sectionsModule = this.editor.modules?.sections ?? null;
  }

  setup() {
    if (!this.toolbarElement) return;

    this.subscribeToState('editMode', ({ value }) => {
      this.reflectEditMode(value);
    });

    this.reflectEditMode(this.state.get('editMode'));

    this.preventButtonBlur();
    this.setupUndoRedo();
    this.setupFontControls();
    this.setupInlineFormatting();
    this.setupIndentAndLists();
    this.setupColorControls();
    this.setupStructureTools();
    this.setupClipboardTools();
    this.setupFindReplace();
    this.setupThemeTools();
    this.setupExportTools();

    this.addDomListener(document, 'selectionchange', () => this.updateFontSizeSelect());
    this.addDomListener(window, 'scroll', () => this.hidePalettes());
    this.addDomListener(window, 'resize', () => this.hidePalettes());
    this.addDomListener(document, 'click', (event) => {
      if (!this.activePalette) {
        return;
      }
      const target = event.target;
      if (
        this.activePalette.contains(target) ||
        this.activePaletteTrigger?.contains?.(target)
      ) {
        return;
      }
      this.hidePalettes();
    });

    this.subscribeToState('currentPage', () => {
      this.syncThemeSelect();
    });

    this.syncThemeSelect();
  }

  reflectEditMode(isEditing) {
    if (!this.toolbarElement) {
      return;
    }

    const active = !!isEditing;
    this.toolbarElement.classList.toggle('show', active);
    this.toolbarElement.setAttribute('aria-hidden', active ? 'false' : 'true');
  }

  preventButtonBlur() {
    const buttons = Array.from(this.toolbarElement.querySelectorAll('button'));
    buttons.forEach((button) => {
      this.addDomListener(button, 'mousedown', (event) => {
        event.preventDefault();
      });
    });
  }

  setupUndoRedo() {
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
      this.addDomListener(undoBtn, 'click', () => {
        if (!this.state.undo()) {
          this.notify('No hay más acciones para deshacer', 'warning');
        }
      });
    }

    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) {
      this.addDomListener(redoBtn, 'click', () => {
        if (!this.state.redo()) {
          this.notify('No hay más acciones para rehacer', 'warning');
        }
      });
    }
  }

  setupFontControls() {
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) {
      this.addDomListener(fontSizeSelect, 'change', (event) => {
        const value = Number(event.target.value);
        if (!Number.isFinite(value)) {
          return;
        }
        this.applyFontSize(value);
      });
    }

    const decreaseBtn = document.getElementById('fontSizeDecreaseBtn');
    if (decreaseBtn) {
      this.addDomListener(decreaseBtn, 'click', () => {
        const current = this.getCurrentFontSize();
        const next = clamp(current - 1, MIN_FONT_SIZE, MAX_FONT_SIZE);
        this.applyFontSize(next);
      });
    }

    const increaseBtn = document.getElementById('fontSizeIncreaseBtn');
    if (increaseBtn) {
      this.addDomListener(increaseBtn, 'click', () => {
        const current = this.getCurrentFontSize();
        const next = clamp(current + 1, MIN_FONT_SIZE, MAX_FONT_SIZE);
        this.applyFontSize(next);
      });
    }
  }

  setupInlineFormatting() {
    this.bindCommandButton('boldBtn', () => this.exec('bold'));
    this.bindCommandButton('italicBtn', () => this.exec('italic'));
    this.bindCommandButton('underlineBtn', () => this.exec('underline'));
    this.bindCommandButton('highlightBtn', (event) => {
      if (this.highlightPalette) {
        this.togglePalette(this.highlightPalette, event.currentTarget);
      } else {
        this.applyHighlight('#fff3cd');
      }
    });
    this.bindCommandButton('textColorBtn', (event) => {
      if (this.textColorPalette) {
        this.togglePalette(this.textColorPalette, event.currentTarget);
      } else {
        this.applyTextColor('#111827');
      }
    });

    if (this.highlightPalette) {
      this.populatePalette(this.highlightPalette, HIGHLIGHT_COLORS, (color) => {
        this.applyHighlight(color);
      }, { allowClear: true });
    }

    if (this.textColorPalette) {
      this.populatePalette(this.textColorPalette, TEXT_COLORS, (color) => {
        this.applyTextColor(color);
      }, { allowClear: true });
    }
  }

  setupIndentAndLists() {
    this.bindCommandButton('indentBtn', () => this.exec('indent'));
    this.bindCommandButton('outdentBtn', () => this.exec('outdent'));
    this.bindCommandButton('insertUlBtn', () => this.exec('insertUnorderedList'));
    this.bindCommandButton('insertOlBtn', () => this.exec('insertOrderedList'));
  }

  setupColorControls() {
    // The palettes are initialised in setupInlineFormatting; this hook ensures clear swatches work.
  }

  setupStructureTools() {
    this.bindCommandButton('insertTableBtn', () => {
      const tableHtml = `
        <table class="editor-table">
          <thead>
            <tr>
              <th>Cabecera 1</th>
              <th>Cabecera 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dato 1</td>
              <td>Dato 2</td>
            </tr>
            <tr>
              <td>Dato 3</td>
              <td>Dato 4</td>
            </tr>
          </tbody>
        </table>`;
      this.insertHtml(tableHtml);
    });

    this.bindCommandButton('insertHtmlBtn', () => {
      const html = window.prompt('Inserta el HTML personalizado:');
      if (html) {
        this.insertHtml(html);
      }
    });

    this.bindCommandButton('symbolPickerBtn', () => {
      const symbol = window.prompt('Escribe el símbolo que quieres insertar:', '•');
      if (symbol) {
        this.insertText(symbol);
      }
    });

    this.bindCommandButton('insertTemplateBtn', () => {
      const template = `
        <section class="callout">
          <header><strong>Título de la tarjeta</strong></header>
          <div><p>Contenido destacado...</p></div>
        </section>`;
      this.insertHtml(template);
    });

    this.bindCommandButton('insertCollapseCardBtn', () => {
      const collapse = `
        <details class="collapse-card" open>
          <summary>Resumen</summary>
          <div><p>Contenido plegable.</p></div>
        </details>`;
      this.insertHtml(collapse);
    });
  }

  setupClipboardTools() {
    this.bindCommandButton('copyFormatBtn', () => {
      const format = this.captureSelectionFormat();
      if (!format) {
        this.notify('Selecciona texto con formato para copiar.', 'warning');
        return;
      }
      this.copiedFormat = format;
      this.notify('Formato copiado. Usa pegar formato para aplicarlo.', 'success');
    });

    this.bindCommandButton('pasteFormatBtn', () => {
      if (!this.copiedFormat) {
        this.notify('No hay formato copiado.', 'warning');
        return;
      }
      if (this.applyStoredFormat()) {
        this.notify('Formato aplicado.', 'success');
      } else {
        this.notify('Selecciona el texto al que quieres aplicar el formato.', 'warning');
      }
    });

    this.bindCommandButton('copyHtmlSelectionBtn', async () => {
      const html = this.getSelectionHtml();
      if (!html) {
        this.notify('Selecciona contenido para copiar.', 'warning');
        return;
      }
      const success = await this.copyHtmlToClipboard(html);
      if (success) {
        this.notify('HTML copiado al portapapeles.', 'success');
      } else {
        this.notify('No se pudo copiar el HTML.', 'warning');
      }
    });

    this.bindCommandButton('removeFormatBtn', () => {
      this.exec('removeFormat');
    });
  }

  setupFindReplace() {
    this.bindCommandButton('findReplaceBtn', () => {
      const editable = this.focusActiveEditable();
      if (!editable) {
        this.notify('Activa el modo edición y selecciona un tema.', 'warning');
        return;
      }

      const search = window.prompt('Texto a buscar:');
      if (!search) {
        return;
      }

      const replace = window.prompt('Reemplazar con (deja vacío para solo resaltar):', '');
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');

      if (replace === null) {
        return;
      }

      if (replace === '') {
        // Solo resaltar coincidencias
        editable.innerHTML = editable.innerHTML.replace(regex, (match) => `<mark>${match}</mark>`);
      } else {
        editable.innerHTML = editable.innerHTML.replace(regex, replace);
      }

      this.sectionsModule?.updateTopicFromPage?.(editable, { updateTitle: true });
    });
  }

  setupThemeTools() {
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      this.addDomListener(themeSelect, 'change', (event) => {
        const theme = event.target.value;
        if (!theme) {
          return;
        }
        const updated = this.sectionsModule?.applyThemeToActiveTopic?.(theme, { updateSection: true });
        if (!updated) {
          this.notify('Selecciona un tema para aplicar el estilo.', 'warning');
        }
      });
    }
  }

  setupExportTools() {
    this.bindCommandButton('exportTopicBtn', () => {
      const data = this.sectionsModule?.exportActiveTopic?.();
      if (!data) {
        this.notify('No hay un tema activo para exportar.', 'warning');
        return;
      }

      const fileName = this.slugify(`${data.section.name}-${data.topic.title || 'tema'}`) || 'tema';
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.json`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        link.remove();
      }, 0);
      this.notify('Tema exportado como JSON.', 'success');
    });
  }

  bindCommandButton(id, handler) {
    const element = document.getElementById(id);
    if (!element) {
      return null;
    }
    this.addDomListener(element, 'click', (event) => {
      event.preventDefault();
      handler(event);
      this.hidePalettes();
    });
    return element;
  }

  applyFontSize(size) {
    const normalized = clamp(size, MIN_FONT_SIZE, MAX_FONT_SIZE);
    this.exec('fontSize', normalized);
    this.setFontSizeSelect(normalized);
  }

  getCurrentFontSize() {
    const value = Number(document.queryCommandValue('fontSize'));
    if (!Number.isFinite(value)) {
      return DEFAULT_FONT_SIZE;
    }
    return clamp(value, MIN_FONT_SIZE, MAX_FONT_SIZE);
  }

  setFontSizeSelect(value) {
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) {
      fontSizeSelect.value = String(value);
    }
  }

  updateFontSizeSelect() {
    if (!this.state.get('editMode')) {
      return;
    }
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (!fontSizeSelect) {
      return;
    }
    const size = this.getCurrentFontSize();
    fontSizeSelect.value = String(size);
  }

  applyHighlight(color) {
    if (!color) {
      this.exec('hiliteColor', 'transparent');
      return;
    }
    if (!document.queryCommandSupported || document.queryCommandSupported('hiliteColor')) {
      this.exec('hiliteColor', color);
    } else {
      this.exec('backColor', color);
    }
  }

  applyTextColor(color) {
    const target = color || '#212529';
    this.exec('foreColor', target);
  }

  insertHtml(html) {
    if (!html) {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      const editable = this.focusActiveEditable();
      if (!editable) {
        return;
      }
      editable.focus();
    }

    const range = window.getSelection()?.getRangeAt(0);
    if (!range) {
      return;
    }

    range.deleteContents();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const fragment = document.createDocumentFragment();
    while (wrapper.firstChild) {
      fragment.appendChild(wrapper.firstChild);
    }
    range.insertNode(fragment);
  }

  insertText(text) {
    if (!text) {
      return;
    }
    const range = window.getSelection()?.getRangeAt(0);
    if (!range) {
      return;
    }
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
  }

  captureSelectionFormat() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement;
    }
    if (!element || !element.style) {
      return null;
    }
    return {
      style: element.getAttribute('style') || '',
      tagName: element.tagName ? element.tagName.toLowerCase() : 'span'
    };
  }

  applyStoredFormat() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }
    const range = selection.getRangeAt(0);
    const fragment = range.extractContents();
    const wrapper = document.createElement('span');
    if (this.copiedFormat?.style) {
      wrapper.setAttribute('style', this.copiedFormat.style);
    }
    wrapper.appendChild(fragment);
    range.insertNode(wrapper);
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);
    return true;
  }

  getSelectionHtml() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return '';
    }
    const container = document.createElement('div');
    for (let i = 0; i < selection.rangeCount; i += 1) {
      container.appendChild(selection.getRangeAt(i).cloneContents());
    }
    return container.innerHTML.trim();
  }

  async copyHtmlToClipboard(html) {
    if (!html) {
      return false;
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(html);
        return true;
      } catch (error) {
        console.warn('Clipboard write failed', error);
      }
    }

    const textarea = document.createElement('textarea');
    textarea.value = html;
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    textarea.remove();
    return result;
  }

  focusActiveEditable() {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.isContentEditable) {
      return activeElement;
    }

    const page = this.sectionsModule?.getActiveTopicContext?.()?.pageElement;
    if (page) {
      page.focus();
      return page;
    }
    return null;
  }

  exec(command, value) {
    if (!this.state.get('editMode')) {
      this.notify('Activa el modo edición para usar las herramientas.', 'warning');
      return;
    }
    this.focusActiveEditable();
    try {
      document.execCommand(command, false, value);
    } catch (error) {
      console.warn(`No se pudo ejecutar el comando ${command}`, error);
      this.notify('Esta acción no es compatible con tu navegador.', 'warning');
    }
  }

  populatePalette(palette, colors, handler, { allowClear = false } = {}) {
    if (!palette) {
      return;
    }
    palette.innerHTML = '';

    const createSwatch = (color, { isClear = false } = {}) => {
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = `color-swatch${isClear ? ' color-swatch-clear' : ''}`;
      if (!isClear) {
        swatch.style.backgroundColor = color;
        swatch.title = color;
      } else {
        swatch.title = 'Sin color';
      }
      this.addDomListener(swatch, 'mousedown', (event) => event.preventDefault());
      this.addDomListener(swatch, 'click', (event) => {
        event.preventDefault();
        handler(isClear ? null : color);
        this.hidePalettes();
      });
      palette.appendChild(swatch);
    };

    colors.forEach((color) => createSwatch(color));

    if (allowClear) {
      createSwatch(null, { isClear: true });
    }
  }

  togglePalette(palette, trigger) {
    if (!palette || !trigger) {
      return;
    }
    const isSame = this.activePalette === palette && palette.classList.contains('show');
    this.hidePalettes();
    if (isSame) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    palette.style.top = `${rect.bottom + window.scrollY + 8}px`;
    palette.style.left = `${rect.left + window.scrollX}px`;
    palette.classList.add('show');
    this.activePalette = palette;
    this.activePaletteTrigger = trigger;
  }

  hidePalettes() {
    if (this.activePalette) {
      this.activePalette.classList.remove('show');
    }
    this.activePalette = null;
    this.activePaletteTrigger = null;
  }

  syncThemeSelect() {
    const themeSelect = document.getElementById('themeSelect');
    if (!themeSelect || !this.sectionsModule?.getActiveTopicContext) {
      return;
    }
    const context = this.sectionsModule.getActiveTopicContext();
    if (!context) {
      return;
    }
    const theme = context.topic.theme || context.section.theme || '';
    themeSelect.value = theme;
  }

  slugify(value) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  notify(message, type = 'info') {
    const ui = this.editor.modules?.ui;
    if (ui?.showMessage) {
      ui.showMessage(message, type);
    } else {
      console.info(`[${type}] ${message}`);
    }
  }
}
