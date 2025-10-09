import { AppState } from './AppState.js';
import { TextEditor } from '../editor/TextEditor.js';
import { Toolbar } from '../editor/Toolbar.js';
import { TemplateLibrary } from '../editor/Templates.js';
import { TableMenu } from '../tables/TableMenu.js';
import { NotesViewController } from '../notes/NotesViewController.js';
import { Modal } from '../ui/Modal.js';
import { ZoomController } from '../ui/Zoom.js';
import { PanelManager } from '../ui/Panels.js';
import { HTMLExporter } from '../export/HTMLExporter.js';
import { JSONExporter } from '../export/JSONExporter.js';
import { MarkdownExporter } from '../export/MarkdownExporter.js';
import { qs, qsa, toggleClass } from '../../utils/dom.js';
import { save, load, remove } from '../../utils/storage.js';

const CACHE_KEY = 'emi-editor-cache-v2';

export class EditorApp {
  constructor() {
    this.state = new AppState();
    this.dom = {};
  }

  init() {
    this.#cacheDom();
    this.#initModal();
    this.#initEditor();
    this.#initNotes();
    this.#initToolbar();
    this.#initPanels();
    this.#initZoom();
    this.#initExports();
    this.#restoreCache();
    this.#bindTopbarActions();
  }

  #cacheDom() {
    this.dom = {
      pagesContainer: qs('#pagesRoot'),
      themeSelect: qs('#themeSelect'),
      readingModeBtn: qs('#readingModeBtn'),
      readingModeExit: qs('#readingModeExit'),
      notesLayer: qs('#floatingNotesLayer'),
      addNoteBtn: qs('#addFloatingNoteBtn'),
      toggleNotesBtn: qs('#toggleNotesBtn'),
      notesViewBtn: qs('#notesViewBtn'),
      zoomValue: qs('#zoomValue'),
      zoomInBtn: qs('#zoomInBtn'),
      zoomOutBtn: qs('#zoomOutBtn'),
      plusBtn: qs('.topbar-plus'),
      tocBtn: qs('#tocBtn'),
      panelBackdrop: qs('#panel-backdrop'),
      topicPanel: qs('#topic-panel'),
      tocPanel: qs('#toc-panel'),
      topicPanelClosers: qsa('#topic-panel .panel-close'),
      tocClose: qs('#tocClose'),
      notesViewPanel: qs('#notesViewPanel'),
      editPanelBtn: qs('#editPanelBtn'),
      addSectionBtn: qs('#addSectionBtn'),
      clearAllBtn: qs('#clearAllBtn'),
      exportDataBtn: qs('#exportDataBtn'),
      exportMarkdownBtn: qs('#exportMarkdownBtn'),
      saveHtmlBtn: qs('#saveHtmlBtn'),
      cacheSaveBtn: qs('#cacheSaveBtn'),
      importDataBtn: qs('#importDataBtn'),
      importDataInput: qs('#importDataInput'),
      notesSummaryBtn: qs('#notesViewBtn')
    };
  }

  #initModal() {
    this.modal = new Modal({
      overlay: qs('#modalOverlay'),
      content: qs('#modalContent')
    });
    this.modal.init();
  }

  #initEditor() {
    this.textEditor = new TextEditor({
      container: this.dom.pagesContainer,
      themeSelect: this.dom.themeSelect
    });
    this.textEditor.init();
  }

  #initNotes() {
    this.notes = new NotesViewController({
      layer: this.dom.notesLayer,
      addButton: this.dom.addNoteBtn,
      toggleButton: this.dom.toggleNotesBtn,
      summaryButton: this.dom.notesSummaryBtn,
      focusLayerCallback: () => this.#focusNotesLayer()
    });
    this.notes.init();
  }

  #initToolbar() {
    const templateLibrary = new TemplateLibrary({
      modal: this.modal,
      onSelect: (html) => this.textEditor.insertTemplate(html)
    });
    const tableMenu = new TableMenu({ textEditor: this.textEditor });
    this.toolbar = new Toolbar({
      textEditor: this.textEditor,
      templateLibrary,
      tableMenu
    });
    this.toolbar.init();
  }

  #initPanels() {
    this.panels = new PanelManager({ backdrop: this.dom.panelBackdrop });
    this.panels.registerPanel('topics', {
      element: this.dom.topicPanel,
      openButtons: [this.dom.plusBtn],
      closeButtons: this.dom.topicPanelClosers
    });
    this.panels.registerPanel('toc', {
      element: this.dom.tocPanel,
      openButtons: [this.dom.tocBtn],
      closeButtons: [this.dom.tocClose]
    });

    this.dom.panelBackdrop?.addEventListener('click', () => this.panels.closeAll());
  }

  #initZoom() {
    this.zoom = new ZoomController({
      valueLabel: this.dom.zoomValue,
      zoomInButton: this.dom.zoomInBtn,
      zoomOutButton: this.dom.zoomOutBtn,
      target: this.textEditor.container
    });
    this.zoom.init();
  }

  #initExports() {
    this.htmlExporter = new HTMLExporter({ textEditor: this.textEditor });
    this.jsonExporter = new JSONExporter({ textEditor: this.textEditor });
    this.markdownExporter = new MarkdownExporter({ textEditor: this.textEditor });
  }

  #bindTopbarActions() {
    const {
      readingModeBtn,
      readingModeExit,
      notesViewBtn,
      clearAllBtn,
      exportDataBtn,
      exportMarkdownBtn,
      saveHtmlBtn,
      cacheSaveBtn,
      importDataBtn,
      importDataInput
    } = this.dom;

    readingModeBtn?.addEventListener('click', () => this.#toggleReadingMode(true));
    readingModeExit?.addEventListener('click', () => this.#toggleReadingMode(false));
    notesViewBtn?.addEventListener('click', () => this.notes.showSummary());
    clearAllBtn?.addEventListener('click', () => this.#confirmClear());
    exportDataBtn?.addEventListener('click', () => this.jsonExporter.export());
    exportMarkdownBtn?.addEventListener('click', () => this.markdownExporter.export());
    saveHtmlBtn?.addEventListener('click', () => this.htmlExporter.export());
    cacheSaveBtn?.addEventListener('click', () => this.#saveCache());
    importDataBtn?.addEventListener('click', () => importDataInput?.click());
    importDataInput?.addEventListener('change', (event) => this.#handleImport(event));
  }

  #toggleReadingMode(force) {
    const enabled = typeof force === 'boolean' ? force : !this.state.isReadingMode;
    this.state.isReadingMode = enabled;
    toggleClass(document.body, 'reading-mode', enabled);
  }

  #focusNotesLayer() {
    if (!this.dom.notesLayer) return;
    this.dom.notesLayer.classList.add('active');
    setTimeout(() => this.dom.notesLayer.classList.remove('active'), 600);
  }

  #confirmClear() {
    if (!window.confirm('¿Deseas eliminar todas las páginas?')) {
      return;
    }
    this.notes.clear();
    this.textEditor.loadFromData([]);
    this.textEditor.createPage({ title: 'Nuevo tema', focus: false });
    remove(CACHE_KEY);
  }

  #saveCache() {
    const payload = {
      pages: this.textEditor.getExportData(),
      notes: this.notes.registry.values()
    };
    save(CACHE_KEY, payload);
    if (this.dom.cacheSaveBtn) {
      this.dom.cacheSaveBtn.classList.add('saved');
      this.dom.cacheSaveBtn.setAttribute('data-status', 'saved');
      setTimeout(() => {
        this.dom.cacheSaveBtn.classList.remove('saved');
        this.dom.cacheSaveBtn.removeAttribute('data-status');
      }, 1500);
    }
  }

  #restoreCache() {
    const cached = load(CACHE_KEY);
    if (!cached) return;
    if (Array.isArray(cached.pages)) {
      this.textEditor.loadFromData(cached.pages);
    }
    if (Array.isArray(cached.notes)) {
      cached.notes.forEach((note) => {
        const instance = this.notes.createNote(note);
        if (instance) {
          this.notes.registry.update(instance.serialize());
        }
      });
    }
  }

  #handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        this.textEditor.loadFromData(data.pages || []);
      } catch (error) {
        window.alert('No se pudo importar el archivo seleccionado.');
        console.error(error);
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }
}
