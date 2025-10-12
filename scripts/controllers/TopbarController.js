import { clamp } from '../utils/math.js';

const TOPBAR_THEME_STORAGE_KEY = 'emi-editor-topbar-theme';
const AVAILABLE_TOPBAR_THEMES = [
  'topbar-color-default',
  'topbar-color-slate',
  'topbar-color-night',
  'topbar-color-navy',
  'topbar-color-sky',
  'topbar-color-emerald'
];

const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

const DOCUMENT_SHIFT_STEP = 80;
const DOCUMENT_SHIFT_MIN = -1500;
const DOCUMENT_SHIFT_MAX = 1500;

export class TopbarController {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.editor = uiModule.editor;
    this.state = this.editor.state;

    this.topbar = null;
    this.activeDropdown = null;

    this.zoomInBtn = null;
    this.zoomOutBtn = null;
    this.shiftLeftBtn = null;
    this.shiftRightBtn = null;
    this.readingModeBtn = null;
    this.readingModeExit = null;
    this.notesViewBtn = null;
    this.toolsToggle = null;
    this.toolsDropdown = null;
    this.themeToggle = null;
    this.themeDropdown = null;
    this.themeButtons = [];
    this.cacheSaveBtn = null;

    this.importInput = document.getElementById('importDataInput');
    this.loadHtmlInput = document.getElementById('loadHtmlInput');
  }

  initialize() {
    this.topbar = document.querySelector('[data-topbar]');
    if (!this.topbar) {
      return;
    }

    this.readingModeExit = document.getElementById('readingModeExit');
    if (this.readingModeExit) {
      this.uiModule.addDomListener(this.readingModeExit, 'click', () => this.toggleReadingMode(false));
    }

    this.toolsToggle = document.getElementById('topbarToolsToggle');
    this.toolsDropdown = document.getElementById('topbarToolsDropdown');
    this.themeToggle = document.getElementById('topbarThemeToggle');
    this.themeDropdown = document.getElementById('topbarThemeDropdown');
    this.themeButtons = Array.from(this.themeDropdown?.querySelectorAll('[data-theme]') || []);

    this.zoomInBtn = this.bindButton('zoomInBtn', () => this.adjustZoom(ZOOM_STEP));
    this.zoomOutBtn = this.bindButton('zoomOutBtn', () => this.adjustZoom(-ZOOM_STEP));
    this.shiftLeftBtn = this.bindButton('shiftLeftBtn', () => this.adjustDocumentShift(-DOCUMENT_SHIFT_STEP));
    this.shiftRightBtn = this.bindButton('shiftRightBtn', () => this.adjustDocumentShift(DOCUMENT_SHIFT_STEP));
    this.readingModeBtn = this.bindButton('readingModeBtn', () => this.toggleReadingMode());
    this.notesViewBtn = this.bindButton('notesViewBtn', () => this.toggleNotesVisibility());
    this.cacheSaveBtn = this.bindButton('cacheSaveBtn', () => this.handleManualSave());
    this.bindButton('loadHtmlBtn', () => this.triggerInput(this.loadHtmlInput));
    this.bindButton('importDataBtn', () => this.triggerInput(this.importInput));
    this.bindButton('exportDataBtn', () => this.exportSnapshot());
    this.bindButton('printCurrentBtn', () => window.print());

    this.bindButton('topbarToolsToggle', (event) => {
      event?.stopPropagation();
      this.toggleDropdown(this.toolsToggle, this.toolsDropdown);
    });

    this.bindButton('topbarThemeToggle', (event) => {
      event?.stopPropagation();
      this.toggleDropdown(this.themeToggle, this.themeDropdown);
    });

    if (this.toolsDropdown) {
      this.uiModule.addDomListener(this.toolsDropdown, 'click', (event) => event.stopPropagation());
    }

    if (this.themeDropdown) {
      this.uiModule.addDomListener(this.themeDropdown, 'click', (event) => event.stopPropagation());
    }

    this.themeButtons.forEach((btn) => {
      this.uiModule.addDomListener(btn, 'click', () => {
        const { theme } = btn.dataset;
        this.applyTopbarTheme(theme, { persist: true });
        this.closeDropdowns();
      });
    });

    this.uiModule.addDomListener(document, 'click', () => this.closeDropdowns());

    if (this.importInput) {
      this.uiModule.addDomListener(this.importInput, 'change', (event) => {
        const input = event.target;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        this.importSnapshot(file);
        input.value = '';
      });
    }

    if (this.loadHtmlInput) {
      this.uiModule.addDomListener(this.loadHtmlInput, 'change', (event) => {
        const input = event.target;
        const files = input.files ? Array.from(input.files) : [];
        if (files.length > 0) {
          this.editor.emit('ui:load-html', files);
          this.uiModule.showMessage('Archivos listos para importar', 'info');
        }
        input.value = '';
      });
    }

    this.bindButton('statsBtn', () => this.showQuickStats());
    this.bindButton('exportMarkdownBtn', () => this.exportMarkdown());
    this.bindButton('copyHtmlBtn', () => this.copyDocumentHtml());
    this.bindButton('clearAllBtn', () => this.clearDocument());

    this.uiModule.subscribeToState('zoom', ({ value }) => this.updateZoomUi(value));
    this.uiModule.subscribeToState('documentShift', ({ value }) => this.updateShiftUi(value));
    this.uiModule.subscribeToState('ui.readingMode', ({ value }) => this.reflectReadingMode(value));
    this.uiModule.subscribeToState('notes.hidden', ({ value }) => this.reflectNotesVisibility(value));

    const initialZoom = this.state.get('zoom') ?? DEFAULT_ZOOM;
    this.updateZoomUi(initialZoom);
    this.updateShiftUi(this.state.get('documentShift') ?? 0);
    this.reflectReadingMode(this.state.get('ui.readingMode'));
    this.reflectNotesVisibility(this.state.get('notes.hidden'));

    this.restoreTopbarTheme();
  }

  bindButton(id, handler) {
    const element = document.getElementById(id);
    if (!element) {
      return null;
    }
    this.uiModule.addDomListener(element, 'click', (event) => {
      event.preventDefault();
      handler(event);
    });
    return element;
  }

  adjustZoom(delta) {
    const current = Number(this.state.get('zoom') ?? DEFAULT_ZOOM);
    const next = clamp(Number((current + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM);
    if (next !== current) {
      this.state.set('zoom', next);
    }
  }

  adjustDocumentShift(delta) {
    const current = Number(this.state.get('documentShift') ?? 0);
    const next = clamp(current + delta, DOCUMENT_SHIFT_MIN, DOCUMENT_SHIFT_MAX);
    if (next !== current) {
      this.state.set('documentShift', next);
    }
  }

  toggleReadingMode(forceValue) {
    const current = !!this.state.get('ui.readingMode');
    const next = typeof forceValue === 'boolean' ? forceValue : !current;
    this.state.set('ui.readingMode', next);
    if (next) {
      this.closeDropdowns();
    }
  }

  reflectReadingMode(isActive) {
    if (this.readingModeBtn) {
      this.readingModeBtn.classList.toggle('active', !!isActive);
    }
    if (this.readingModeExit) {
      const active = !!isActive;
      this.readingModeExit.hidden = !active;
      this.readingModeExit.setAttribute('aria-hidden', active ? 'false' : 'true');
    }
  }

  toggleNotesVisibility() {
    const notesModule = this.editor.modules?.notes;
    if (notesModule?.toggleVisibility) {
      notesModule.toggleVisibility();
    } else {
      this.editor.emit('notes:toggle-visibility');
    }
    this.closeDropdowns();
  }

  reflectNotesVisibility(hidden) {
    if (this.notesViewBtn) {
      this.notesViewBtn.classList.toggle('active', !hidden);
      this.notesViewBtn.setAttribute('aria-pressed', hidden ? 'false' : 'true');
    }
  }

  updateZoomUi(value) {
    const numeric = Number(value ?? DEFAULT_ZOOM);
    if (this.zoomInBtn) {
      this.zoomInBtn.disabled = numeric >= MAX_ZOOM;
    }
    if (this.zoomOutBtn) {
      this.zoomOutBtn.disabled = numeric <= MIN_ZOOM;
    }
  }

  updateShiftUi(value) {
    const numeric = Number(value ?? 0);
    if (this.shiftLeftBtn) {
      this.shiftLeftBtn.disabled = numeric <= DOCUMENT_SHIFT_MIN;
    }
    if (this.shiftRightBtn) {
      this.shiftRightBtn.disabled = numeric >= DOCUMENT_SHIFT_MAX;
    }
  }

  toggleDropdown(trigger, dropdown) {
    if (!trigger || !dropdown) {
      return;
    }
    const isCurrent = this.activeDropdown?.dropdown === dropdown;
    if (isCurrent) {
      this.closeDropdowns();
      return;
    }
    this.closeDropdowns();
    dropdown.classList.add('open');
    trigger.classList.add('active');
    trigger.setAttribute('aria-expanded', 'true');
    this.activeDropdown = { trigger, dropdown };
  }

  closeDropdowns() {
    if (!this.activeDropdown) {
      return;
    }
    const { trigger, dropdown } = this.activeDropdown;
    dropdown.classList.remove('open');
    trigger.classList.remove('active');
    trigger.setAttribute('aria-expanded', 'false');
    this.activeDropdown = null;
  }

  applyTopbarTheme(theme, { persist = false } = {}) {
    if (!this.topbar) {
      return;
    }
    const resolved = AVAILABLE_TOPBAR_THEMES.includes(theme)
      ? theme
      : AVAILABLE_TOPBAR_THEMES[0];

    AVAILABLE_TOPBAR_THEMES.forEach((cls) => this.topbar.classList.remove(cls));
    this.topbar.classList.add(resolved);

    this.themeButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === resolved);
    });

    if (persist) {
      try {
        window.localStorage?.setItem(TOPBAR_THEME_STORAGE_KEY, resolved);
      } catch (error) {
        console.warn('No se pudo guardar la preferencia de la barra superior', error);
      }
    }
  }

  restoreTopbarTheme() {
    let storedTheme = null;
    try {
      storedTheme = window.localStorage?.getItem(TOPBAR_THEME_STORAGE_KEY) || null;
    } catch (error) {
      console.warn('No se pudo leer la preferencia de la barra superior', error);
    }
    const initialTheme = storedTheme && AVAILABLE_TOPBAR_THEMES.includes(storedTheme)
      ? storedTheme
      : AVAILABLE_TOPBAR_THEMES.find((theme) => this.topbar?.classList.contains(theme))
        || AVAILABLE_TOPBAR_THEMES[0];
    this.applyTopbarTheme(initialTheme, { persist: false });
  }

  triggerInput(input) {
    if (!input) {
      return;
    }
    input.click();
  }

  async exportSnapshot() {
    try {
      const payload = await this.editor.modules?.persistence?.save();
      if (!payload) {
        this.uiModule.showMessage('No hay datos para exportar', 'warning');
        return;
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const documentTitle = document.getElementById('specialtyTitle')?.textContent?.trim() || 'editor';
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `${documentTitle || 'editor'}-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.uiModule.showMessage('Datos exportados correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar los datos del editor', error);
      this.uiModule.showMessage('No se pudieron exportar los datos', 'error');
    } finally {
      this.closeDropdowns();
    }
  }

  async importSnapshot(file) {
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      if (payload.notes && this.editor.modules?.notes) {
        this.editor.modules.notes.importData(payload.notes);
      }

      if (payload.state && typeof payload.state === 'object') {
        Object.entries(payload.state).forEach(([path, value]) => {
          this.state.set(path, value, { addToHistory: false });
        });
      }

      this.uiModule.showMessage('Datos importados correctamente', 'success');
      await this.editor.modules?.persistence?.save();
    } catch (error) {
      console.error('Error al importar datos del editor', error);
      this.uiModule.showMessage('No se pudieron importar los datos', 'error');
    } finally {
      this.closeDropdowns();
    }
  }

  async handleManualSave() {
    try {
      await this.editor.save();
      this.uiModule.showMessage('Contenido guardado en caché', 'success');
    } catch (error) {
      console.error('Error al guardar el contenido', error);
      this.uiModule.showMessage('No se pudo guardar en caché', 'error');
    }
    this.closeDropdowns();
  }

  showQuickStats() {
    const root = this.getDocumentRoot();
    if (!root) {
      this.uiModule.showMessage('No se encontró contenido para analizar', 'warning');
      return;
    }

    const pages = root.querySelectorAll('.page');
    const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const paragraphs = root.querySelectorAll('p');
    const noteCount = this.editor.modules?.notes?.registry?.size ?? 0;

    const summary = [
      `Secciones: ${pages.length}`,
      `Encabezados: ${headings.length}`,
      `Párrafos: ${paragraphs.length}`,
      `Notas: ${noteCount}`
    ].join(' · ');

    this.uiModule.showMessage(summary, 'info', 5000);
    this.closeDropdowns();
  }

  async exportMarkdown() {
    const root = this.getDocumentRoot();
    if (!root) {
      this.uiModule.showMessage('No hay contenido para exportar', 'warning');
      return;
    }

    const markdown = this.convertHtmlToMarkdown(root.innerHTML);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const documentTitle = document.getElementById('specialtyTitle')?.textContent?.trim() || 'documento';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `${documentTitle}-${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.uiModule.showMessage('Markdown exportado correctamente', 'success');
    this.closeDropdowns();
  }

  async copyDocumentHtml() {
    const root = this.getDocumentRoot();
    if (!root) {
      this.uiModule.showMessage('No se encontró contenido para copiar', 'warning');
      return;
    }

    try {
      const html = root.innerHTML;
      await navigator.clipboard.writeText(html);
      this.uiModule.showMessage('HTML copiado al portapapeles', 'success');
    } catch (error) {
      console.error('No se pudo copiar el HTML', error);
      this.uiModule.showMessage('No se pudo copiar el HTML', 'error');
    }
    this.closeDropdowns();
  }

  clearDocument() {
    const root = this.getDocumentRoot();
    if (!root) {
      this.uiModule.showMessage('No hay contenido para eliminar', 'warning');
      return;
    }

    const confirmed = window.confirm('¿Seguro que deseas eliminar todo el contenido? Esta acción no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    root.innerHTML = '';
    if (this.editor.modules?.notes) {
      this.editor.modules.notes.importData({ notes: [], hidden: false });
    }
    this.editor.state.update({
      'currentSection': null,
      'currentPage': null
    }, { silent: true });
    this.editor.emit('document:cleared');
    this.editor.modules?.persistence?.save();
    this.uiModule.showMessage('Documento limpiado', 'success');
    this.closeDropdowns();
  }

  getDocumentRoot() {
    const explicit = document.querySelector('[data-document]');
    if (explicit) {
      return explicit;
    }
    if (this.editor.container?.querySelector) {
      const scoped = this.editor.container.querySelector('[data-document-root]');
      if (scoped) {
        return scoped;
      }
    }
    return this.editor.container || document.body;
  }

  convertHtmlToMarkdown(html) {
    let md = html || '';
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
    md = md.replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gi, '**$2**');
    md = md.replace(/<(em|i)[^>]*>(.*?)<\/\1>/gi, '*$2*');
    md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');
    md = md.replace(/<br\s*\/>/gi, '\n');
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    md = md.replace(/<ul[^>]*>/gi, '\n');
    md = md.replace(/<\/ul>/gi, '\n');
    md = md.replace(/<ol[^>]*>/gi, '\n');
    md = md.replace(/<\/ol>/gi, '\n');
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    md = md.replace(/<table[^>]*>|<\/table>/gi, '\n');
    md = md.replace(/<tr[^>]*>|<\/tr>/gi, '\n');
    md = md.replace(/<th[^>]*>(.*?)<\/th>/gi, '**$1**\t');
    md = md.replace(/<td[^>]*>(.*?)<\/td>/gi, '$1\t');
    md = md.replace(/<[^>]+>/g, '');
    md = md.replace(/&nbsp;/g, ' ');
    md = md.replace(/&amp;/g, '&');
    md = md.replace(/&lt;/g, '<');
    md = md.replace(/&gt;/g, '>');
    md = md.replace(/\n{3,}/g, '\n\n');
    return md.trim();
  }
}
