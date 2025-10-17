import { generateUniqueId } from './utils/id.js';
import {
  NoteRegistry,
  NOTE_TYPES,
  NOTE_CATEGORIES,
  NOTE_PRIORITY_SEQUENCE,
  DEFAULT_NOTE_PRIORITY,
  DEFAULT_NOTE_CATEGORY,
  DEFAULT_NOTE_TYPE,
  DEFAULT_NOTE_STYLE
} from './modules/notes/NoteRegistry.js';
import {
  SUPER_NOTE_DEFAULT_TAB_COLOR,
  SUPER_NOTE_TAB_TITLE_MAX_LENGTH,
  SUPER_NOTE_PRESET_COLORS
} from './modules/notes/noteConstants.js';
import {
  sanitizeTags,
  escapeHtml,
  getNotePlainTextFromHtml,
  getNoteCategoryInfo,
  getNoteDisplayTitle,
  sanitizeNoteTitleHtml,
  getNoteTitlePlainText
} from './modules/notes/noteUtils.js';

export async function initializeEditor() {
      const APP_NAME = 'Cora Notes';
      let isEditMode = false;
      let isPanelEditMode = false;
      let isReadingMode = false;
      let pages = [...document.querySelectorAll('.page')];
      let globalTopicCounter = 1;
      let selectedImage = null;
      let selectedTemplateBlock = null;
      let currentZoom = 1;
      let lastRegularZoom = 1;
      let zoomBeforeMagic = null;
      let isMagicViewActive = false;
      let activeMagicSource = null;
      let activeMagicWrapper = null;
      let activeMagicPage = null;
      let allSectionsExpanded = true;
      let savedSelection = null;
      let pendingToolbarInsertionSnapshot = null;
      let tableMenuAPI = null;
      let cachedToolbarHeight = 0;
      let iconPickerRebindTimer = null;
      const cropState = {
        image: null,
        isSelecting: false,
        startX: 0,
        startY: 0,
        currentRect: null,
        scaleX: 1,
        scaleY: 1
      };

      const IMAGE_MIN_WIDTH = 60;
      const IMAGE_MAX_WIDTH = 1600;
      const IMAGE_RESIZE_STEP = 0.1;

      const NOTE_STYLE_PRESETS = [
        { id: 'blank', name: 'Blanca', className: 'floating-note-style-blank' },
        { id: 'default', name: 'Clásica', className: 'floating-note-style-default' },
        { id: 'sky', name: 'Cielo', className: 'floating-note-style-sky' },
        { id: 'mint', name: 'Menta', className: 'floating-note-style-mint' },
        { id: 'rose', name: 'Pétalo', className: 'floating-note-style-rose' },
        { id: 'lilac', name: 'Lavanda', className: 'floating-note-style-lilac' },
        { id: 'slate', name: 'Pizarra', className: 'floating-note-style-slate' },
        { id: 'citrus', name: 'Cítrica', className: 'floating-note-style-citrus' },
        { id: 'midnight', name: 'Nocturna', className: 'floating-note-style-midnight' },
        { id: 'dawn', name: 'Aurora', className: 'floating-note-style-dawn' },
        { id: 'forest', name: 'Bosque', className: 'floating-note-style-forest' },
        { id: 'sand', name: 'Arena', className: 'floating-note-style-sand' },
        { id: 'peach', name: 'Durazno', className: 'floating-note-style-peach' },
        { id: 'ice', name: 'Hielo', className: 'floating-note-style-ice' },
        { id: 'sage', name: 'Salvia', className: 'floating-note-style-sage' },
        { id: 'morning', name: 'Matinal', className: 'floating-note-style-morning' },
        { id: 'breeze', name: 'Brisa', className: 'floating-note-style-breeze' },
        { id: 'mist', name: 'Niebla', className: 'floating-note-style-mist' },
        { id: 'spring', name: 'Primavera', className: 'floating-note-style-spring' }
      ];

      const FLOATING_NOTE_BORDER_DEFAULT_COLOR = '#94a3b8';
      const FLOATING_NOTE_BORDER_DEFAULT_WIDTH = 1;
      const FLOATING_NOTE_BORDER_COLORS = [
        '#000000',
        '#1f2937',
        '#475569',
        '#94a3b8',
        '#fecaca',
        '#fde68a',
        '#bbf7d0',
        '#bae6fd',
        '#ddd6fe',
        '#fbcfe8',
        '#fef3c7'
      ];

      const NOTE_ICON_SYMBOLS = [
        '📌', '🔑', '⭐', '✔️', '💊', '📝', '📂', '🩻', '🩺', '📍', '📊', '⚠️', '✍️'
      ];

      const ICON_FEATURE_ENABLED = true;
      const IMAGE_VIEWER_DEFAULT_CONTEXT_KEY = 'global';
      const IMAGE_VIEWER_STORAGE_KEY = 'emi2025-image-viewer';
      const IMAGE_VIEWER_ZOOM_MIN = 0.25;
      const IMAGE_VIEWER_ZOOM_MAX = 4;
      const IMAGE_VIEWER_ZOOM_STEP = 0.25;

      let imageViewerState = getDefaultImageViewerState();
      let imageViewerPreviousShift = null;
      let imageViewerActiveShift = null;
      let imageViewerNotesSaveTimer = null;
      let imageViewerZoom = 1;
      let imageViewerPreviewSource = null;
      let imageViewerCurrentToken = null;
      let imageViewerContextExternalImages = [];
      let imageViewerRuntimeSelectionId = null;
      let imageViewerContextKey = IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;

      let floatingNotesHidden = false;
      let mainContentHidden = false;
      let boldInfiniteMode = false;
      let boldInfiniteApplying = false;
      let autoTableResizeController = null;
      let autoTableResizeTable = null;
      const spacingToolState = {
        isOpen: false,
        targets: [],
        originalStyles: new Map()
      };
      let spacingToolSelectionSync = null;
      let floatingNoteZIndex = 10;
      let floatingNoteCreationOffset = 0;
      const floatingNoteDragState = { note: null, pointerId: null, offsetX: 0, offsetY: 0 };
      const floatingNoteResizeState = {
        note: null,
        pointerId: null,
        orientation: null,
        edge: null,
        corner: null,
        startWidth: 0,
        startHeight: 0,
        startLeft: 0,
        startTop: 0,
        startRight: 0,
        startBottom: 0,
        startX: 0,
        startY: 0
      };
      const FLOATING_NOTE_DEFAULT_WIDTH = 240;
      const FLOATING_NOTE_MIN_WIDTH = 0;
      const FLOATING_NOTE_MIN_HEIGHT = 0;
      let activeFloatingNoteStyleMenu = null;
      let floatingNoteResizeObserver = null;
      let floatingNotesViewportRelaxedMatching = false;
      let pendingFloatingNotesViewportSync = false;
      let pendingFloatingNoteViewportRefresh = false;
      let pendingTopicNoteIndicatorUpdate = false;
      let cachedActiveTopicViewportState = null;
      let documentHorizontalShift = 0;
      const DOCUMENT_SHIFT_STEP = 80;
      const DOCUMENT_SHIFT_MIN = -1500;
      const DOCUMENT_SHIFT_MAX = 1500;

      const CACHE_STORAGE_KEY = 'emi2025-editor-cache-v1';
      let cachedStylesheetForExport = null;
      const EXTENDED_CACHE_DB_NAME = 'emi2025-editor-cache';
      const EXTENDED_CACHE_STORE_NAME = 'snapshots';
      let extendedCacheDbPromise = null;
      let usingExtendedCache = false;

      function isQuotaExceededError(error) {
        if (!error) {
          return false;
        }
        const quotaNames = ['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'];
        if (quotaNames.includes(error.name)) {
          return true;
        }
        if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
          return quotaNames.includes(error.name);
        }
        return false;
      }

      function openExtendedCacheDb() {
        if (!('indexedDB' in window)) {
          return Promise.reject(new Error('IndexedDB no está disponible'));
        }
        if (extendedCacheDbPromise) {
          return extendedCacheDbPromise;
        }
        extendedCacheDbPromise = new Promise((resolve, reject) => {
          const request = window.indexedDB.open(EXTENDED_CACHE_DB_NAME, 1);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(EXTENDED_CACHE_STORE_NAME)) {
              db.createObjectStore(EXTENDED_CACHE_STORE_NAME);
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = () => {
              db.close();
            };
            resolve(db);
          };
          request.onerror = () => {
            const err = request.error || new Error('No se pudo abrir IndexedDB');
            extendedCacheDbPromise = null;
            reject(err);
          };
          request.onblocked = () => {
            console.warn('Actualización de la caché extendida bloqueada por otra pestaña.');
          };
        });
        return extendedCacheDbPromise;
      }

      async function writeExtendedCacheValue(value) {
        try {
          const db = await openExtendedCacheDb();
          return await new Promise((resolve, reject) => {
            const tx = db.transaction(EXTENDED_CACHE_STORE_NAME, 'readwrite');
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error || new Error('No se pudo guardar en almacenamiento extendido'));
            tx.onabort = () => reject(tx.error || new Error('Se canceló el guardado en almacenamiento extendido'));
            const store = tx.objectStore(EXTENDED_CACHE_STORE_NAME);
            store.put(value, CACHE_STORAGE_KEY);
          });
        } catch (error) {
          console.error('Error al escribir en la caché extendida:', error);
          throw error;
        }
      }

      async function readExtendedCacheValue() {
        try {
          const db = await openExtendedCacheDb();
          return await new Promise((resolve, reject) => {
            const tx = db.transaction(EXTENDED_CACHE_STORE_NAME, 'readonly');
            tx.onerror = () => reject(tx.error || new Error('No se pudo leer la caché extendida'));
            const store = tx.objectStore(EXTENDED_CACHE_STORE_NAME);
            const request = store.get(CACHE_STORAGE_KEY);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error('Error leyendo la caché extendida'));
          });
        } catch (error) {
          console.error('Error al leer la caché extendida:', error);
          return null;
        }
      }

      async function clearExtendedCacheValue() {
        if (!('indexedDB' in window)) {
          return;
        }
        try {
          const db = await openExtendedCacheDb();
          await new Promise((resolve, reject) => {
            const tx = db.transaction(EXTENDED_CACHE_STORE_NAME, 'readwrite');
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error || new Error('No se pudo limpiar la caché extendida'));
            tx.onabort = () => reject(tx.error || new Error('Se canceló la limpieza de la caché extendida'));
            const store = tx.objectStore(EXTENDED_CACHE_STORE_NAME);
            store.delete(CACHE_STORAGE_KEY);
          });
        } catch (error) {
          console.error('Error al limpiar la caché extendida:', error);
        }
      }

      async function getStylesheetTextForExport() {
        if (cachedStylesheetForExport !== null) {
          return cachedStylesheetForExport;
        }

        const linkEl = document.querySelector('link[rel="stylesheet"][href]');
        if (!linkEl) {
          cachedStylesheetForExport = '';
          return cachedStylesheetForExport;
        }

        const href = linkEl.href || linkEl.getAttribute('href');

        try {
          const response = await fetch(href);
          if (!response.ok) {
            throw new Error(`No se pudo cargar estilos: ${response.status}`);
          }
          cachedStylesheetForExport = await response.text();
          return cachedStylesheetForExport;
        } catch (error) {
          console.error('Error cargando estilos para exportación:', error);
          try {
            const targetSheet = Array.from(document.styleSheets || []).find(sheet => sheet.ownerNode === linkEl);
            if (targetSheet?.cssRules) {
              cachedStylesheetForExport = Array.from(targetSheet.cssRules).map(rule => rule.cssText).join('\n');
              return cachedStylesheetForExport;
            }
          } catch (cssError) {
            console.warn('No se pudo leer reglas CSS para exportación:', cssError);
          }
          cachedStylesheetForExport = '';
          return cachedStylesheetForExport;
        }
      }


      let sections = [];
      const AVAILABLE_THEMES = ['theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-teal', 'theme-rose', 'theme-sand', 'theme-slate'];
      const DEFAULT_THEME = 'theme-blue';
      let sectionThemes = new Map();
      let currentSectionId = '';
      let currentPageRef = null;
      let visibleSectionId = '';
      let panelFilterTerm = '';
      let panelFilterNormalized = '';
      
      const panel = document.getElementById('topic-panel');
      const sectionsContainer = document.getElementById('sectionsContainer');
      const panelTopicCount = document.getElementById('panelTopicCount');
      const panelSearchInput = document.getElementById('panelSearchInput');
      const panelSearchClear = document.getElementById('panelSearchClear');
      const plusBtn = document.querySelector('.topbar-plus');
      const panelClose = document.querySelectorAll('.panel-close');
      const panelBackdrop = document.getElementById('panel-backdrop');
      const magic = document.getElementById('magic-view');
      const specialtySpan = document.getElementById('specialtyTitle');
      const modalOverlay = document.getElementById('modalOverlay');
      const modalContent = document.getElementById('modalContent');
      const floatingNotesLayer = document.getElementById('floatingNotesLayer');
      const addFloatingNoteBtn = document.getElementById('addFloatingNoteBtn');
      const toggleNotesBtn = document.getElementById('toggleNotesBtn');
      const toggleMainContentBtn = document.getElementById('toggleMainContentBtn');
      const printFloatingNotesViewBtn = document.getElementById('printFloatingNotesViewBtn');
      const notesViewBtn = document.getElementById('notesViewBtn');
      const topbar = document.querySelector('.topbar');
      const topbarToolsToggle = document.getElementById('topbarToolsToggle');
      const topbarToolsDropdown = document.getElementById('topbarToolsDropdown');
      const topbarThemeToggle = document.getElementById('topbarThemeToggle');
      const topbarThemeDropdown = document.getElementById('topbarThemeDropdown');
      const topbarThemeButtons = topbarThemeDropdown ? Array.from(topbarThemeDropdown.querySelectorAll('[data-theme]')) : [];
      const magicBackFloating = document.getElementById('magicBackFloating');
      const AVAILABLE_TOPBAR_THEMES = [
        'topbar-color-default',
        'topbar-color-slate',
        'topbar-color-night',
        'topbar-color-navy',
        'topbar-color-sky',
        'topbar-color-emerald'
      ];
      const TOPBAR_THEME_STORAGE_KEY = 'emi2025-topbar-theme';
      let activeTopbarDropdown = null;
      let currentTopbarTheme = AVAILABLE_TOPBAR_THEMES[0];

      if (typeof ResizeObserver === 'function') {
        floatingNoteResizeObserver = new ResizeObserver((entries) => {
          entries.forEach((entry) => {
            const target = entry.target;
            if (!(target instanceof HTMLElement) || !target.classList.contains('floating-note')) {
              return;
            }
            updateFloatingNoteSizeDataset(target);
            const currentLeft = Number.parseFloat(target.dataset.left || target.style.left || '0');
            const currentTop = Number.parseFloat(target.dataset.top || target.style.top || '0');
            positionFloatingNote(target, currentLeft, currentTop);
          });
        });
      }

      const editBtn = document.getElementById('editBtn');
      const saveHtmlBtn = document.getElementById('saveHtmlBtn');
      const loadHtmlBtn = document.getElementById('loadHtmlBtn');
      const loadHtmlInput = document.getElementById('loadHtmlInput');
      const editToolbar = document.getElementById('editToolbar');
      const statsBtn = document.getElementById('statsBtn');
      const clearAllBtn = document.getElementById('clearAllBtn');
      const exportDataBtn = document.getElementById('exportDataBtn');
      const importDataBtn = document.getElementById('importDataBtn');
      const importDataInput = document.getElementById('importDataInput');
      const cacheSaveBtn = document.getElementById('cacheSaveBtn');
      const editPanelBtn = document.getElementById('editPanelBtn');
      const readingModeBtn = document.getElementById('readingModeBtn');
      const readingModeExit = document.getElementById('readingModeExit');
      const exportMarkdownBtn = document.getElementById('exportMarkdownBtn');
      const imageToolbar = document.getElementById('imageToolbar');
      const imageAltInput = document.getElementById('imageAltInput');
      const applyAltBtn = document.getElementById('applyAltBtn');
      const imageFrameToggle = document.getElementById('imageFrameToggle');
      const wrapFigureBtn = document.getElementById('wrapFigureBtn');
      const unwrapFigureBtn = document.getElementById('unwrapFigureBtn');
      const cropImageBtn = document.getElementById('cropImageBtn');
      const imageWidthIncreaseBtn = document.getElementById('imageWidthIncrease');
      const imageWidthDecreaseBtn = document.getElementById('imageWidthDecrease');
      const widthDisplay = document.getElementById('widthDisplay');
      const imageCropModal = document.getElementById('imageCropModal');
      const imageCropStage = document.getElementById('imageCropStage');
      const imageCropPreview = document.getElementById('imageCropPreview');
      const imageCropSelection = document.getElementById('imageCropSelection');
      const imageCropApplyBtn = document.getElementById('imageCropApplyBtn');
      const imageCropCancelBtn = document.getElementById('imageCropCancelBtn');
      const imageCropCloseBtn = document.getElementById('imageCropCloseBtn');
      const imageCropSizeLabel = document.getElementById('imageCropSizeLabel');
      const imageViewerBtn = document.getElementById('imageViewerBtn');
      const imageViewerPanel = document.getElementById('imageViewerPanel');
      const imageViewerAddImageBtn = document.getElementById('imageViewerAddImageBtn');
      const imageViewerDownloadBtn = document.getElementById('imageViewerDownloadBtn');
      const imageViewerCloseBtn = document.getElementById('imageViewerCloseBtn');
      const imageViewerUploadInput = document.getElementById('imageViewerUploadInput');
      const imageViewerActiveImage = document.getElementById('imageViewerActiveImage');
      const imageViewerStageSurface = document.getElementById('imageViewerStageSurface');
      const imageViewerEmptyState = document.getElementById('imageViewerEmptyState');
      const imageViewerFileName = document.getElementById('imageViewerFileName');
      const imageViewerMeta = document.getElementById('imageViewerMeta');
      const imageViewerNotes = document.getElementById('imageViewerNotes');
      const imageViewerGallery = document.getElementById('imageViewerGallery');
      const imageViewerRemoveBtn = document.getElementById('imageViewerRemoveBtn');
      const imageViewerPrevBtn = document.getElementById('imageViewerPrevBtn');
      const imageViewerNextBtn = document.getElementById('imageViewerNextBtn');
      const imageViewerZoomOutBtn = document.getElementById('imageViewerZoomOutBtn');
      const imageViewerZoomInBtn = document.getElementById('imageViewerZoomInBtn');
      const imageViewerZoomResetBtn = document.getElementById('imageViewerZoomResetBtn');
      const imageViewerZoomValue = document.getElementById('imageViewerZoomValue');
      const imageViewerNotesDefaultPlaceholder = imageViewerNotes ? imageViewerNotes.getAttribute('placeholder') || '' : '';
      const imageViewerNotesPreviewPlaceholder = 'Selecciona una imagen para escribir una nota.';
      const templateToolbar = document.getElementById('templateToolbar');
      const templateBgColorInput = document.getElementById('templateBgColor');
      const templateClearBgBtn = document.getElementById('templateClearBgBtn');
      const templateTextColorInput = document.getElementById('templateTextColor');
      const templateResetTextColorBtn = document.getElementById('templateResetTextColorBtn');
      const templateBgPalette = document.getElementById('templateBgPalette');
      const templateTextPalette = document.getElementById('templateTextPalette');
      const templateBorderPalette = document.getElementById('templateBorderPalette');
      const templateAccentPalette = document.getElementById('templateAccentPalette');
      const templateBorderColorInput = document.getElementById('templateBorderColor');
      const templateAccentColorInput = document.getElementById('templateAccentColor');
      const templateBorderColorRow = document.getElementById('templateBorderColorRow');
      const templateAccentColorRow = document.getElementById('templateAccentColorRow');
      const templateFontSizeSlider = document.getElementById('templateFontSize');
      const templateFontSizeDisplay = document.getElementById('templateFontSizeDisplay');
      const templateMarginTopSlider = document.getElementById('templateMarginTop');
      const templateMarginTopDisplay = document.getElementById('templateMarginTopDisplay');
      const templateMarginBottomSlider = document.getElementById('templateMarginBottom');
      const templateMarginBottomDisplay = document.getElementById('templateMarginBottomDisplay');
      const templateBorderWidthSlider = document.getElementById('templateBorderWidth');
      const templateBorderWidthDisplay = document.getElementById('templateBorderWidthDisplay');
      const templateDeleteBtn = document.getElementById('templateDeleteBtn');
      const templateNoteStyleRow = document.getElementById('templateNoteStyleRow');
      const templateNoteStyleSelect = document.getElementById('templateNoteStyle');
      const templateSpacingRow = document.getElementById('templateSpacingRow');
      const templateAddSpaceTopBtn = document.getElementById('templateAddSpaceTopBtn');
      const templateAddSpaceBottomBtn = document.getElementById('templateAddSpaceBottomBtn');
      const themeSelect = document.getElementById('themeSelect');

      const templateBackgroundPaletteColors = ['#ffffff', '#f8f9fa', '#fef9e7', '#fff3cd', '#fde2e4', '#f8d7da', '#e7f3ff', '#d1e7dd', '#e9ecef'];
      const templateTextPaletteColors = ['#212529', '#343a40', '#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1', '#6c757d', '#ffffff'];
      const templateBorderPaletteColors = ['#ced4da', '#adb5bd', '#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1', '#0dcaf0', '#6c757d', '#212529'];
      const templateAccentPaletteColors = ['#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1', '#ffc107', '#20c997', '#0dcaf0', '#6c757d'];
      const noteStylePresets = [
        { id: 'classic', className: 'note-style-classic', extraClasses: [] },
        { id: 'sky', className: 'note-style-sky', extraClasses: [] },
        { id: 'forest', className: 'note-style-forest', extraClasses: [] },
        { id: 'sunrise', className: 'note-style-sunrise', extraClasses: [] },
        { id: 'rose', className: 'note-style-rose', extraClasses: [] },
        { id: 'lilac', className: 'note-style-lilac', extraClasses: [] },
        { id: 'slate', className: 'note-style-slate', extraClasses: [] },
        { id: 'pearl', className: 'note-style-pearl', extraClasses: ['pearl'] }
      ];
      const NOTE_STYLE_CLASSES = noteStylePresets.map(p => p.className);
      const noteStylePresetMap = new Map(noteStylePresets.map(p => [p.id, p]));

      const notesRegistry = new NoteRegistry();
      let notesViewController = null;
      let pendingNotesViewUpdate = false;
      function ensureNoteData(noteId, overrides = {}) {
        return notesRegistry.ensure(noteId, overrides);
      }

      function updateNoteData(noteId, updates = {}, { silent = false } = {}) {
        return notesRegistry.update(noteId, updates, { silent });
      }

      function removeNoteData(noteId) {
        if (!noteId) return;
        notesRegistry.remove(noteId);
      }

      function isFloatingFamilyNote(note) {
        if (!note) return false;
        const type = note.type || NOTE_TYPES.FLOATING;
        return type === NOTE_TYPES.FLOATING || type === NOTE_TYPES.SUPER;
      }

      function scheduleNotesViewRefresh() {
        scheduleTopicNoteIndicatorRefresh();
        if (!notesViewController) return;
        if (pendingNotesViewUpdate) return;
        pendingNotesViewUpdate = true;
        requestAnimationFrame(() => {
          pendingNotesViewUpdate = false;
          notesViewController.notifyNotesUpdated();
        });
      }

      notesRegistry.setChangeListener(() => {
        scheduleNotesViewRefresh();
      });

      function getPageTheme(page) {
        if (!page) return DEFAULT_THEME;
        const classTheme = Array.from(page.classList || []).find(cls => AVAILABLE_THEMES.includes(cls));
        if (classTheme) return classTheme;
        const stored = page.dataset.theme;
        if (stored && AVAILABLE_THEMES.includes(stored)) return stored;
        return DEFAULT_THEME;
      }

      function applyThemeToPage(page, themeClass) {
        if (!page) return;
        const validTheme = AVAILABLE_THEMES.includes(themeClass) ? themeClass : DEFAULT_THEME;
        AVAILABLE_THEMES.forEach(cls => page.classList.remove(cls));
        page.classList.add(validTheme);
        page.dataset.theme = validTheme;
      }

      function syncBodyTheme(themeClass) {
        const validTheme = AVAILABLE_THEMES.includes(themeClass) ? themeClass : DEFAULT_THEME;
        AVAILABLE_THEMES.forEach(cls => document.body.classList.remove(cls));
        document.body.classList.add(validTheme);
        if (isReadingMode) {
          document.body.classList.add('reading-mode');
        }
      }

      function updateThemeSelectControl(themeClass) {
        if (!themeSelect) return;
        const validTheme = AVAILABLE_THEMES.includes(themeClass) ? themeClass : DEFAULT_THEME;
        if (themeSelect.value !== validTheme) {
          themeSelect.value = validTheme;
        }
      }

      function updateSectionIndicator(page) {
        if (!specialtySpan) return;
        const sectionName = page ? (page.dataset.sectionName || '').trim() : '';
        specialtySpan.textContent = sectionName;
      }

      const normalizeSectionId = (value) => (value || '').trim();

      function getVisibleSectionId() {
        return normalizeSectionId(visibleSectionId);
      }

      function refreshSectionVisibility({ force = false } = {}) {
        const activeId = getVisibleSectionId();
        const showAll = !activeId;
        document.body.classList.toggle('section-locked-view', !showAll);
        if (!showAll) {
          document.body.dataset.visibleSectionId = activeId;
        } else {
          delete document.body.dataset.visibleSectionId;
        }

        pages.forEach((page) => {
          const pageSectionId = normalizeSectionId(page.dataset.sectionId || 'seccion-default');
          const shouldShow = showAll || pageSectionId === activeId;
          const isHidden = page.classList.contains('page-hidden-by-section');
          if (force || isHidden === shouldShow) {
            page.classList.toggle('page-hidden-by-section', !shouldShow);
            page.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
          }
        });

        scheduleFloatingNotesViewportRefresh();
      }

      function updateSectionsPanelActiveState() {
        if (!sectionsContainer) return;
        const activeId = getVisibleSectionId();
        sectionsContainer.querySelectorAll('.section-item').forEach((item) => {
          const itemId = normalizeSectionId(item.dataset.sectionId || '');
          const isActive = Boolean(activeId) && itemId === activeId;
          item.classList.toggle('active', isActive);
          item.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
      }

      function setActiveTopicListHighlight(topicId) {
        if (!sectionsContainer) return;
        const normalizedTopicId = (topicId || '').trim();
        sectionsContainer.querySelectorAll('.topic-list li').forEach((item) => {
          const itemTopicId = (item.dataset.topicId || '').trim();
          const isActive = normalizedTopicId && itemTopicId === normalizedTopicId;
          item.classList.toggle('active', isActive);
          if (isActive) {
            item.setAttribute('aria-current', 'true');
          } else if (item.hasAttribute('aria-current')) {
            item.removeAttribute('aria-current');
          }
        });
      }

      function ensureVisibleSection({ force = false } = {}) {
        const availableIds = sections.map((section) => normalizeSectionId(section.id));
        let targetId = getVisibleSectionId();
        if (availableIds.length === 0) {
          targetId = '';
        } else if (!targetId || !availableIds.includes(targetId)) {
          targetId = availableIds[0];
        }
        if (visibleSectionId !== targetId) {
          visibleSectionId = targetId;
          force = true;
        }
        refreshSectionVisibility({ force });
        updateSectionsPanelActiveState();
      }

      function setVisibleSection(sectionId, { force = false } = {}) {
        const normalizedId = normalizeSectionId(sectionId);
        if (!normalizedId) {
          ensureVisibleSection({ force });
          return;
        }
        if (visibleSectionId !== normalizedId) {
          visibleSectionId = normalizedId;
          force = true;
        }
        refreshSectionVisibility({ force });
        updateSectionsPanelActiveState();
      }

      function setActivePage(page) {
        if (!page) {
          closeTopicNotesPopover();
          currentPageRef = null;
          currentSectionId = '';
          updateSectionIndicator(null);
          updateThemeSelectControl(DEFAULT_THEME);
          syncBodyTheme(DEFAULT_THEME);
          invalidateActiveTopicViewportState();
          refreshFloatingNotesTopicVisibility();
          scheduleFloatingNotesViewportRefresh();
          ensureVisibleSection({ force: true });
          setActiveTopicListHighlight('');
          scheduleIconPickerRebind();
          return;
        }
        const nextTopicId = page.dataset.topicId || '';
        if (isTopicNotesPopoverOpen() && topicNotesPopoverTopicId && topicNotesPopoverTopicId !== nextTopicId) {
          closeTopicNotesPopover();
        }
        setActiveTopicListHighlight(nextTopicId);
        currentPageRef = page;
        const sectionId = page.dataset.sectionId || 'seccion-default';
        currentSectionId = sectionId;
        const themeClass = getPageTheme(page);
        sectionThemes.set(sectionId, themeClass);
        setVisibleSection(sectionId);
        updateSectionIndicator(page);
        updateThemeSelectControl(themeClass);
        syncBodyTheme(themeClass);
        invalidateActiveTopicViewportState();
        refreshFloatingNotesTopicVisibility();
        scheduleFloatingNotesViewportRefresh();
        scheduleIconPickerRebind();
      }

      function setSectionTheme(sectionId, themeClass) {
        const validTheme = AVAILABLE_THEMES.includes(themeClass) ? themeClass : DEFAULT_THEME;
        sectionThemes.set(sectionId, validTheme);
        pages.filter(page => page.dataset.sectionId === sectionId).forEach(page => applyThemeToPage(page, validTheme));
        if (currentSectionId === sectionId) {
          updateThemeSelectControl(validTheme);
          syncBodyTheme(validTheme);
        }
      }

      function getDocumentTitle() {
        return (specialtySpan?.dataset.documentTitle || '').trim();
      }

      function setDocumentTitle(value) {
        const trimmed = (value || '').trim();
        if (specialtySpan) {
          specialtySpan.dataset.documentTitle = trimmed;
        }
        document.title = APP_NAME;
      }

      function measureToolbarHeight() {
        if (!editToolbar) {
          return cachedToolbarHeight || 0;
        }

        if (editToolbar.classList.contains('show')) {
          const height = editToolbar.getBoundingClientRect().height || editToolbar.offsetHeight || 0;
          if (height) {
            cachedToolbarHeight = height;
          }
          return height;
        }

        if (cachedToolbarHeight) {
          return cachedToolbarHeight;
        }

        const previousDisplay = editToolbar.style.display;
        const previousVisibility = editToolbar.style.visibility;
        const previousPointerEvents = editToolbar.style.pointerEvents;

        editToolbar.style.visibility = 'hidden';
        editToolbar.style.pointerEvents = 'none';
        editToolbar.style.display = 'flex';

        const measured = editToolbar.getBoundingClientRect().height || editToolbar.scrollHeight || 0;

        if (previousDisplay) {
          editToolbar.style.display = previousDisplay;
        } else {
          editToolbar.style.removeProperty('display');
        }

        if (previousVisibility) {
          editToolbar.style.visibility = previousVisibility;
        } else {
          editToolbar.style.removeProperty('visibility');
        }

        if (previousPointerEvents) {
          editToolbar.style.pointerEvents = previousPointerEvents;
        } else {
          editToolbar.style.removeProperty('pointer-events');
        }

        cachedToolbarHeight = measured || 64;
        return cachedToolbarHeight;
      }

      function getToolbarOffset() {
        const topbarHeight = topbar ? (topbar.getBoundingClientRect().height || topbar.offsetHeight || 0) : 0;
        let toolbarHeight = measureToolbarHeight();
        if (!toolbarHeight) {
          toolbarHeight = cachedToolbarHeight || 64;
        }

        const padding = 24;
        return topbarHeight + toolbarHeight + padding;
      }

      function scrollPageIntoViewWithOffset(pageElement, behavior = 'smooth') {
        if (!pageElement) return;
        const offset = getToolbarOffset();
        const rect = pageElement.getBoundingClientRect();
        const targetTop = rect.top + window.scrollY;
        const scrollTop = Math.max(targetTop - offset, 0);
        window.scrollTo({ top: scrollTop, behavior });
      }

      initPalette(templateBgPalette, templateBackgroundPaletteColors, color => applyTemplateBackground(color));
      initPalette(templateTextPalette, templateTextPaletteColors, color => applyTemplateTextColor(color));
      initPalette(templateBorderPalette, templateBorderPaletteColors, color => applyTemplateBorderColor(color));
      initPalette(templateAccentPalette, templateAccentPaletteColors, color => applyTemplateAccentColor(color));
      const alignButtons = {
        left: document.getElementById('alignLeftBtn'),
        center: document.getElementById('alignCenterBtn'),
        right: document.getElementById('alignRightBtn'),
        inline: document.getElementById('inlineBtn')
      };
      const floatClasses = ['float-left', 'float-right', 'center-block', 'inline-image'];
      const zoomInBtn = document.getElementById('zoomInBtn');
      const zoomOutBtn = document.getElementById('zoomOutBtn');
      const zoomValue = document.getElementById('zoomValue');
      const shiftLeftBtn = document.getElementById('shiftLeftBtn');
      const shiftRightBtn = document.getElementById('shiftRightBtn');
      const highlightPalette = document.getElementById('highlightPalette');
      const textColorPalette = document.getElementById('textColorPalette');
      const highlightBtn = document.getElementById('highlightBtn');
      const textColorBtn = document.getElementById('textColorBtn');
      const boldBtn = document.getElementById('boldBtn');
      const spacingToolBtn = document.getElementById('spacingToolBtn');
      const spacingTool = document.getElementById('spacingTool');
      const spacingToolClose = document.getElementById('spacingToolClose');
      const spacingToolReset = document.getElementById('spacingToolReset');
      const spacingToolDone = document.getElementById('spacingToolDone');
      const spacingMarginTop = document.getElementById('spacingMarginTop');
      const spacingMarginBottom = document.getElementById('spacingMarginBottom');
      const spacingBlockGap = document.getElementById('spacingBlockGap');
      const spacingLineHeight = document.getElementById('spacingLineHeight');
      const spacingMarginTopValue = document.getElementById('spacingMarginTopValue');
      const spacingMarginBottomValue = document.getElementById('spacingMarginBottomValue');
      const spacingBlockGapValue = document.getElementById('spacingBlockGapValue');
      const spacingLineHeightValue = document.getElementById('spacingLineHeightValue');
      const boldBtnDefaultTitle = boldBtn ? boldBtn.title : 'Negrita (Ctrl+B)';
      const fontSizeDecreaseBtn = document.getElementById('fontSizeDecreaseBtn');
      const fontSizeIncreaseBtn = document.getElementById('fontSizeIncreaseBtn');
      const insertTemplateBtn = document.getElementById('insertTemplateBtn');
      const insertHtmlBtn = document.getElementById('insertHtmlBtn');
      const insertTableBtn = document.getElementById('insertTableBtn');
      const insertCollapseCardBtn = document.getElementById('insertCollapseCardBtn');
      const tableMenu = document.getElementById('tableMenu');
      const tableMenuSize = document.getElementById('tableMenuSize');
      const tableResizeBtn = document.getElementById('tableResizeBtn');
      const tableMenuClose = document.getElementById('tableMenuClose');
      const tableMenuTabs = Array.from(document.querySelectorAll('.table-menu-tab'));
      const tableMenuPanels = Array.from(document.querySelectorAll('.table-menu-panel'));
      const tableThemeButtons = Array.from(document.querySelectorAll('.table-theme-option'));
      const tableLineHeightInput = document.getElementById('tableLineHeight');
      const tableLineHeightValue = document.getElementById('tableLineHeightValue');
      const tablePaddingYInput = document.getElementById('tablePaddingY');
      const tablePaddingYValue = document.getElementById('tablePaddingYValue');
      const tableMarginInput = document.getElementById('tableMargin');
      const tableMarginValue = document.getElementById('tableMarginValue');
      const tablePresetButtons = Array.from(document.querySelectorAll('[data-table-preset]'));
      const tableBorderColorButtons = Array.from(document.querySelectorAll('.table-border-color-btn'));
      const tableBorderColorCustom = document.getElementById('tableBorderColorCustom');
      const tableBorderWidthInput = document.getElementById('tableBorderWidth');
      const tableBorderWidthValue = document.getElementById('tableBorderWidthValue');
      const tableOuterBorderToggle = document.getElementById('toggleOuterBorder');
      const tableOuterBorderWidthInput = document.getElementById('tableOuterBorderWidth');
      const tableOuterBorderWidthValue = document.getElementById('tableOuterBorderWidthValue');
      const tableOuterBorderColorButtons = Array.from(document.querySelectorAll('.table-outer-border-color-btn'));
      const tableOuterBorderColorCustom = document.getElementById('tableOuterBorderColorCustom');
      const toggleVerticalBorders = document.getElementById('toggleVerticalBorders');
      const toggleHorizontalBorders = document.getElementById('toggleHorizontalBorders');
      const tableBorderResetBtn = document.querySelector('[data-border-reset]');
      const tableResizeOverlay = document.getElementById('tableResizeOverlay');

      const highlightColors = [
        '#ffffff', '#fff1f2', '#ffe4e6', '#ffdce5', '#ffd6e0', '#ffe5d3', '#ffe8c7', '#fef3c7', '#fef9c3',
        '#f1f8d7', '#e9fbdc', '#dcfce7', '#ccfbf1', '#cffafe', '#dbeafe', '#e0f2fe', '#e0f2ff',
        '#e0e7ff', '#ede9fe', '#f3e8ff', '#fae8ff', '#fde7f5', '#fde2ff', '#fce7f3', '#fdf2f8',
        '#f4f4f5', '#f3f4f6', '#eef2ff', '#e2e8f0', '#e7f0ff', '#e6fffa', '#f0fdf4', '#f8fafc'
      ];

      const textAccentColors = [
        '#1f2937', '#0f172a', '#334155', '#0b7285', '#9d174d', '#a16207', '#0f766e', '#000000'
      ];

      const textColors = [
        ...highlightColors,
        ...textAccentColors
      ];

      let persistentHighlight = { active: false, color: '' };
      let persistentHighlightTimer = null;
      let persistentHighlightResumeTimer = null;
      let suppressPersistentHighlight = false;

      let copiedFormat = null;

      const tableResizers = new WeakMap();

      let iconPicker = null;
      let iconPickerAnchor = null;
      let iconPickerTrigger = null;
      let iconPickerTriggerCleanup = null;
      let iconPickerSelectionSnapshot = null;
      let iconPickerGlobalHandlersBound = false;

      function stopIconPickerPropagation(event) {
        if (!event) {
          return;
        }

        if (event.type === 'pointerdown') {
          preventPointerFocusShift(event);
        }

        event.stopPropagation();
      }

      function resolveIconPickerTrigger() {
        const trigger = document.getElementById('symbolPickerBtn') || document.getElementById('insertIconBtn');
        if (trigger && trigger.id === 'insertIconBtn') {
          trigger.dataset.legacyIconTrigger = 'true';
        }
        return trigger;
      }

      function detachIconPickerTrigger() {
        if (iconPickerTriggerCleanup) {
          iconPickerTriggerCleanup();
          iconPickerTriggerCleanup = null;
        }
        if (iconPickerTrigger) {
          iconPickerTrigger.removeAttribute('data-icon-picker-bound');
        }
        iconPickerTrigger = null;
      }

      function scheduleIconPickerRebind(delay = 0) {
        if (iconPickerRebindTimer) {
          clearTimeout(iconPickerRebindTimer);
          iconPickerRebindTimer = null;
        }

        const waitTime = Number.isFinite(delay) ? Math.max(0, delay) : 0;

        iconPickerRebindTimer = setTimeout(() => {
          iconPickerRebindTimer = null;
          const raf = typeof requestAnimationFrame === 'function'
            ? requestAnimationFrame
            : (callback) => setTimeout(callback, 16);

          raf(() => {
            raf(() => {
              bindIconPickerTrigger();
            });
          });
        }, waitTime);
      }

      function preventPointerFocusShift(event) {
        if (!event) {
          return;
        }

        const pointerType = typeof event.pointerType === 'string'
          ? event.pointerType.toLowerCase()
          : '';

        const isMouseLike = pointerType === ''
          || pointerType === 'mouse'
          || pointerType === 'pen'
          || pointerType === 'touch';

        if (isMouseLike) {
          const button = typeof event.button === 'number' ? event.button : 0;
          if (button === 0) {
            event.preventDefault();
          }
        }
      }

      function buildIconPicker() {
        const existing = document.getElementById('iconPicker');
        const picker = existing || document.createElement('div');
        picker.id = 'iconPicker';
        picker.className = 'icon-picker';
        picker.setAttribute('role', 'menu');
        picker.setAttribute('aria-label', 'Insertar icono');

        picker.innerHTML = '';

        NOTE_ICON_SYMBOLS.forEach(symbol => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'icon-picker-btn';
          btn.textContent = symbol;
          btn.title = `Insertar ${symbol}`;
          btn.addEventListener('click', (event) => {
            event.preventDefault();
            const selection = restoreSelectionForIconInsertion();
            if (!selection || selection.rangeCount === 0) {
              alert('Selecciona un área editable antes de insertar iconos.');
              hideIconPicker();
              return;
            }
            const inserted = insertTextAtSelection(`${symbol} `, {
              preserveContextStyle: true,
              selectionOverride: selection
            });
            if (!inserted) {
              alert('Selecciona un área editable antes de insertar iconos.');
            } else {
              captureIconPickerSelectionSnapshot();
            }
            hideIconPicker();
          });
          picker.appendChild(btn);
        });

        if (!picker.dataset.stopPropagationAttached) {
          picker.addEventListener('pointerdown', stopIconPickerPropagation);
          picker.addEventListener('click', stopIconPickerPropagation);
          picker.dataset.stopPropagationAttached = 'true';
        }

        return picker;
      }

      function mountIconPicker(picker) {
        if (!picker || picker.isConnected) {
          return picker;
        }
        const appendTarget = document.body || document.documentElement;
        if (!appendTarget) {
          window.addEventListener('DOMContentLoaded', () => mountIconPicker(picker), { once: true });
          return picker;
        }
        appendTarget.appendChild(picker);
        return picker;
      }

      function ensureIconPicker() {
        if (!ICON_FEATURE_ENABLED) {
          return null;
        }

        const picker = buildIconPicker();
        iconPicker = mountIconPicker(picker);

        const trigger = iconPickerTrigger || resolveIconPickerTrigger();
        if (iconPicker && trigger) {
          trigger.setAttribute('aria-controls', iconPicker.id);
        }

        return iconPicker;
      }

      function restoreSelectionForIconInsertion() {
        if (iconPickerSelectionSnapshot) {
          if (restoreSelectionSnapshot(iconPickerSelectionSnapshot, { updateSnapshot: true })) {
            const restored = window.getSelection();
            if (isSelectionWithinEditable(restored)) {
              return restored;
            }
          } else {
            clearIconPickerSelectionSnapshot();
          }
        }

        if (restoreSelection()) {
          const restored = window.getSelection();
          if (isSelectionWithinEditable(restored)) {
            return restored;
          }
        }

        const liveSelection = window.getSelection();
        if (isSelectionWithinEditable(liveSelection)) {
          return liveSelection;
        }

        return null;
      }

      function hideIconPicker() {
        if (!ICON_FEATURE_ENABLED) {
          return;
        }
        const picker = iconPicker && iconPicker.isConnected ? iconPicker : null;
        if (!picker || !picker.classList.contains('show')) {
          return;
        }
        picker.classList.remove('show');
        if (iconPickerAnchor) {
          iconPickerAnchor.setAttribute('aria-expanded', 'false');
        }
        iconPickerAnchor = null;
        clearIconPickerSelectionSnapshot();
      }

      function getSavedSelectionRect() {
        if (!savedSelection || !savedSelection.range) {
          return null;
        }

        const { range, focusTarget, pageTarget } = savedSelection;
        if (!isNodeInDocument(range.startContainer) || !isNodeInDocument(range.endContainer)) {
          return null;
        }

        let rect = null;
        if (typeof range.getBoundingClientRect === 'function') {
          rect = range.getBoundingClientRect();
          if (rect && rect.width === 0 && rect.height === 0 && typeof range.getClientRects === 'function') {
            const rects = Array.from(range.getClientRects());
            rect = rects.find(candidate => candidate && (candidate.width > 0 || candidate.height > 0)) || rect;
          }
        }

        if (!rect || !Number.isFinite(rect.top) || !Number.isFinite(rect.left)) {
          const fallbackTarget = (focusTarget && document.contains(focusTarget))
            ? focusTarget
            : (pageTarget && document.contains(pageTarget))
              ? pageTarget
              : null;

          if (fallbackTarget && typeof fallbackTarget.getBoundingClientRect === 'function') {
            rect = fallbackTarget.getBoundingClientRect();
          }
        }

        if (!rect || !Number.isFinite(rect.top) || !Number.isFinite(rect.left)) {
          return null;
        }

        return rect;
      }

      function showIconPicker(anchor) {
        if (!ICON_FEATURE_ENABLED || !anchor) {
          return;
        }
        const picker = ensureIconPicker();
        if (!picker) {
          return;
        }
        iconPickerAnchor = anchor;
        if (!restoreSelection()) {
          const activeSelection = window.getSelection();
          if (!isSelectionWithinEditable(activeSelection)) {
            clearSavedSelection();
          } else {
            saveCurrentSelection();
          }
        }
        captureIconPickerSelectionSnapshot();

        const selectionRect = getSavedSelectionRect();
        const anchorRect = anchor.getBoundingClientRect();
        const referenceRect = selectionRect || anchorRect;

        const computedStyle = window.getComputedStyle(picker);
        const isFixedPosition = computedStyle && computedStyle.position === 'fixed';

        const scrollY = isFixedPosition ? 0 : Number.isFinite(window.scrollY) ? window.scrollY : window.pageYOffset || 0;
        const scrollX = isFixedPosition ? 0 : Number.isFinite(window.scrollX) ? window.scrollX : window.pageXOffset || 0;

        picker.style.visibility = 'hidden';
        picker.classList.add('show');

        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const pickerRect = picker.getBoundingClientRect();

        const baseTop = referenceRect.top + scrollY;
        const baseBottom = referenceRect.bottom + scrollY;

        let offsetTop = baseBottom + 6;
        let offsetLeft = referenceRect.left + scrollX;

        if (pickerRect && Number.isFinite(pickerRect.width)) {
          const minLeft = (isFixedPosition ? 12 : scrollX + 12);
          const maxLeft = (isFixedPosition ? viewportWidth - 12 : scrollX + viewportWidth - 12) - pickerRect.width;
          const clampedMaxLeft = Math.max(minLeft, maxLeft);
          offsetLeft = Math.min(Math.max(minLeft, offsetLeft), clampedMaxLeft);
        }

        if (pickerRect && Number.isFinite(pickerRect.height)) {
          const minTop = (isFixedPosition ? 12 : scrollY + 12);
          const maxBottom = (isFixedPosition ? viewportHeight : scrollY + viewportHeight) - 12;
          if (offsetTop + pickerRect.height > maxBottom && baseTop - pickerRect.height - 6 >= minTop) {
            offsetTop = baseTop - pickerRect.height - 6;
          }
          const clampedMaxTop = Math.max(minTop, maxBottom - pickerRect.height);
          offsetTop = Math.min(Math.max(minTop, offsetTop), clampedMaxTop);
        }

        picker.style.top = `${Math.round(offsetTop)}px`;
        picker.style.left = `${Math.round(offsetLeft)}px`;
        picker.style.visibility = '';
        anchor.setAttribute('aria-expanded', 'true');
      }

      function toggleIconPicker(anchor) {
        const picker = ensureIconPicker();
        if (!picker) {
          return;
        }
        if (picker.classList.contains('show') && iconPickerAnchor === anchor) {
          hideIconPicker();
          return;
        }
        showIconPicker(anchor);
      }

      function handleGlobalPointerDown(event) {
        const picker = iconPicker && iconPicker.isConnected ? iconPicker : null;
        if (!picker || !picker.classList.contains('show')) {
          return;
        }
        if (picker.contains(event.target)) {
          return;
        }
        const trigger = iconPickerTrigger || resolveIconPickerTrigger();
        if (trigger && trigger.contains(event.target)) {
          return;
        }
        hideIconPicker();
      }

      function bindIconPickerTrigger() {
        const trigger = resolveIconPickerTrigger();

        if (!ICON_FEATURE_ENABLED) {
          if (trigger) {
            trigger.disabled = true;
            trigger.setAttribute('aria-disabled', 'true');
            trigger.title = 'La inserción de iconos no está disponible en esta versión.';
          }
          detachIconPickerTrigger();
          return;
        }

        if (!trigger) {
          detachIconPickerTrigger();
          return;
        }

        trigger.disabled = false;
        trigger.removeAttribute('aria-disabled');
        if (!trigger.dataset.iconPickerBound) {
          const defaultTitle = trigger.dataset.legacyIconTrigger === 'true' ? 'Insertar iconos' : 'Insertar símbolos';
          trigger.title = trigger.title || defaultTitle;
        }

        if (iconPickerTrigger === trigger) {
          return;
        }

        detachIconPickerTrigger();

        trigger.setAttribute('aria-haspopup', 'menu');
        trigger.setAttribute('aria-expanded', 'false');

        const pointerHandler = (event) => {
          preventPointerFocusShift(event);
          saveCurrentSelection({ keepWhenEmpty: true });
          captureIconPickerSelectionSnapshot();
        };

        const clickHandler = (event) => {
          event.preventDefault();
          event.stopPropagation();
          saveCurrentSelection({ keepWhenEmpty: true });
          captureIconPickerSelectionSnapshot();
          const picker = ensureIconPicker();
          if (!picker) {
            return;
          }
          toggleIconPicker(trigger);
        };

        const keyHandler = (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            saveCurrentSelection({ keepWhenEmpty: true });
            captureIconPickerSelectionSnapshot();
            toggleIconPicker(trigger);
          }
        };

        trigger.addEventListener('pointerdown', pointerHandler);
        trigger.addEventListener('click', clickHandler);
        trigger.addEventListener('keydown', keyHandler);
        trigger.dataset.iconPickerBound = 'true';

        iconPickerTrigger = trigger;
        iconPickerTriggerCleanup = () => {
          trigger.removeEventListener('pointerdown', pointerHandler);
          trigger.removeEventListener('click', clickHandler);
          trigger.removeEventListener('keydown', keyHandler);
          trigger.removeAttribute('aria-expanded');
        };

        ensureIconPicker();

        if (!iconPickerGlobalHandlersBound) {
          document.addEventListener('pointerdown', handleGlobalPointerDown);
          window.addEventListener('resize', hideIconPicker);
          document.addEventListener('scroll', hideIconPicker, true);
          iconPickerGlobalHandlersBound = true;
        }
      }

      if (cropImageBtn) {
        cropImageBtn.disabled = true;
      }

      const topicMenu = document.createElement('div');
      topicMenu.id = 'topicContextMenu';
      topicMenu.className = 'topic-context-menu';
      topicMenu.innerHTML = `
        <button data-action="rename">Cambiar título</button>
        <button data-action="move">Mover tema</button>
        <button data-action="delete" class="danger">Eliminar tema</button>
      `;
      document.body.appendChild(topicMenu);

      let topicMenuContext = null;
      let topicMenuJustOpened = false;

      const topicNotesPopover = document.createElement('div');
      topicNotesPopover.id = 'topicNotesPopover';
      topicNotesPopover.className = 'topic-notes-popover';
      topicNotesPopover.setAttribute('aria-hidden', 'true');
      topicNotesPopover.innerHTML = `
        <div class="topic-notes-header">
          <span class="topic-notes-title" data-topic-notes-title></span>
          <button type="button" class="topic-notes-close" data-topic-notes-close aria-label="Cerrar panel de notas">✕</button>
        </div>
        <div class="topic-notes-actions">
          <button type="button" class="topic-notes-add" data-topic-notes-add>➕ Nueva nota</button>
          <button type="button" class="topic-notes-open-panel" data-topic-notes-open-panel>📚 Ver notas</button>
        </div>
        <div class="topic-notes-empty" data-topic-notes-empty>Este tema aún no tiene notas.</div>
        <div class="topic-notes-list" data-topic-notes-list role="list"></div>
      `;
      topicNotesPopover.setAttribute('role', 'dialog');
      topicNotesPopover.setAttribute('aria-modal', 'false');
      document.body.appendChild(topicNotesPopover);

      const topicNotesTitleEl = topicNotesPopover.querySelector('[data-topic-notes-title]');
      const topicNotesListEl = topicNotesPopover.querySelector('[data-topic-notes-list]');
      const topicNotesEmptyEl = topicNotesPopover.querySelector('[data-topic-notes-empty]');
      const topicNotesAddBtn = topicNotesPopover.querySelector('[data-topic-notes-add]');
      const topicNotesOpenPanelBtn = topicNotesPopover.querySelector('[data-topic-notes-open-panel]');
      const topicNotesCloseBtn = topicNotesPopover.querySelector('[data-topic-notes-close]');
      let topicNotesAnchor = null;
      let topicNotesPopoverTopicId = '';

      if (topicNotesTitleEl) {
        topicNotesTitleEl.id = 'topicNotesPopoverTitle';
        topicNotesPopover.setAttribute('aria-labelledby', topicNotesTitleEl.id);
      }

      function isTopicNotesPopoverOpen() {
        return topicNotesPopover.classList.contains('open');
      }

      function closeTopicNotesPopover() {
        if (topicNotesAnchor) {
          topicNotesAnchor.classList.remove('is-open');
          topicNotesAnchor.setAttribute('aria-expanded', 'false');
        }
        topicNotesAnchor = null;
        topicNotesPopoverTopicId = '';
        topicNotesPopover.classList.remove('open');
        topicNotesPopover.removeAttribute('data-topic-id');
        topicNotesPopover.setAttribute('aria-hidden', 'true');
      }

      function positionTopicNotesPopover(anchor) {
        if (!anchor || !isTopicNotesPopoverOpen()) return;
        const anchorRect = anchor.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const popRect = topicNotesPopover.getBoundingClientRect();
        let left = anchorRect.right + 12;
        let top = anchorRect.top - 6;
        if (left + popRect.width > viewportWidth - 12) {
          left = Math.max(12, anchorRect.left - popRect.width - 12);
        }
        if (left < 12) {
          left = 12;
        }
        if (top + popRect.height > viewportHeight - 12) {
          top = Math.max(12, viewportHeight - popRect.height - 12);
        }
        if (top < 12) {
          top = 12;
        }
        topicNotesPopover.style.left = `${Math.round(left)}px`;
        topicNotesPopover.style.top = `${Math.round(top)}px`;
      }

      function collectTopicNoteCounts() {
        const counts = new Map();
        notesRegistry.forEach(note => {
          if (!isFloatingFamilyNote(note)) return;
          const topicId = note.topicId ? String(note.topicId).trim() : '';
          if (!topicId) return;
          counts.set(topicId, (counts.get(topicId) || 0) + 1);
        });
        return counts;
      }

      function getTopicNotesForTopic(topicId) {
        if (!topicId) return [];
        const notes = [];
        notesRegistry.forEach(note => {
          if (!isFloatingFamilyNote(note)) return;
          const noteTopic = note.topicId ? String(note.topicId).trim() : '';
          if (noteTopic === topicId) {
            notes.push(note);
          }
        });
        notes.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        return notes;
      }

      function focusFloatingNoteById(noteId) {
        if (!noteId || !floatingNotesLayer) return;
        let element = floatingNotesLayer.querySelector(`.floating-note[data-note-id="${safeCssEscape(noteId)}"]`);
        const noteData = notesRegistry.get(noteId);
        if (!element && noteData) {
          element = createFloatingNote({ id: noteData.id, meta: noteData, focus: true });
        }
        if (!element) return;
        if (floatingNotesHidden) {
          setFloatingNotesVisibility(false);
        }
        bringNoteToFront(element);
        element.classList.add('pulse-highlight');
        setTimeout(() => element.classList.remove('pulse-highlight'), 1600);
      }

      function promptMoveNoteToTopic(noteData) {
        if (!noteData) return;
        const topics = [];
        sections.forEach(section => {
          section.temas.forEach(tema => {
            const label = `${section.nombre || 'Sección'} › ${tema.titulo || 'Tema'}`;
            topics.push({
              id: tema.id,
              label,
              sectionId: section.id
            });
          });
        });
        if (!topics.length) {
          alert('No hay temas disponibles para mover la nota.');
          return;
        }
        const currentTopic = topics.find(topic => topic.id === noteData.topicId);
        const options = topics.map((topic, index) => `${index + 1}. ${topic.label}`).join('\n');
        const response = prompt(
          `Mover nota a tema:\n${options}\nEscribe el número o el nombre del tema destino:`,
          currentTopic ? currentTopic.label : ''
        );
        if (response === null) {
          return;
        }
        const trimmed = response.trim();
        if (!trimmed) {
          return;
        }
        let target = null;
        const numeric = Number.parseInt(trimmed, 10);
        if (Number.isInteger(numeric) && numeric >= 1 && numeric <= topics.length) {
          target = topics[numeric - 1];
        }
        if (!target) {
          target = topics.find(topic => topic.label.toLowerCase() === trimmed.toLowerCase());
        }
        if (!target) {
          alert('No se encontró el tema especificado.');
          return;
        }
        if (target.id === noteData.topicId) {
          alert('La nota ya pertenece a ese tema.');
          return;
        }
        const updated = updateNoteData(noteData.id, { topicId: target.id, sectionId: target.sectionId });
        const element = floatingNotesLayer?.querySelector(`.floating-note[data-note-id="${safeCssEscape(noteData.id)}"]`);
        if (element) {
          syncNoteElementMeta(element, updated);
          applyFloatingNoteTopicVisibility(element);
        }
        scheduleFloatingNotesViewportRefresh();
        scheduleNotesViewRefresh();
        const targetPage = findPageByTopicId(target.id);
        if (targetPage) {
          const message = `Nota movida a "${target.label}".`;
          console.info(message);
        }
      }

      function createTopicNoteListItem(noteData) {
        const item = document.createElement('div');
        item.className = 'topic-notes-item';
        item.setAttribute('role', 'listitem');
        item.dataset.noteId = noteData.id;

        const text = document.createElement('div');
        text.className = 'topic-notes-item-text';

        const category = getNoteCategoryInfo(noteData.category);
        const displayTitle = getNoteDisplayTitle(noteData.title, '');
        const titleLine = document.createElement('div');
        titleLine.className = 'topic-notes-item-title';
        titleLine.textContent = displayTitle ? `${category.icon} ${displayTitle}` : category.icon;
        text.appendChild(titleLine);

        const snippetContent = getNotePlainTextFromHtml(noteData.html || noteData.content || '').replace(/[\s\u00A0]+/g, ' ').trim();
        if (snippetContent) {
          const snippet = document.createElement('div');
          snippet.className = 'topic-notes-item-snippet';
          snippet.textContent = snippetContent.length > 140 ? snippetContent.slice(0, 140) + '…' : snippetContent;
          text.appendChild(snippet);
        }

        item.appendChild(text);

        const actions = document.createElement('div');
        actions.className = 'topic-notes-item-actions';

        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'topic-notes-item-action';
        viewBtn.title = 'Mostrar nota';
        viewBtn.textContent = '👁️';
        viewBtn.addEventListener('click', () => {
          focusFloatingNoteById(noteData.id);
        });
        actions.appendChild(viewBtn);

        const moveBtn = document.createElement('button');
        moveBtn.type = 'button';
        moveBtn.className = 'topic-notes-item-action';
        moveBtn.title = 'Mover a otro tema';
        moveBtn.textContent = '↔️';
        moveBtn.addEventListener('click', () => {
          promptMoveNoteToTopic(noteData);
          if (topicNotesPopoverTopicId) {
            renderTopicNotesPopover(topicNotesPopoverTopicId);
          }
        });
        actions.appendChild(moveBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'topic-notes-item-action topic-notes-item-danger';
        deleteBtn.title = 'Eliminar nota';
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', () => {
          if (!confirm('¿Eliminar esta nota?')) return;
          const element = floatingNotesLayer?.querySelector(`.floating-note[data-note-id="${safeCssEscape(noteData.id)}"]`);
          if (element) {
            deleteFloatingNote(element);
          } else {
            removeNoteAnchor(noteData.id);
            removeNoteData(noteData.id);
            scheduleNotesViewRefresh();
          }
          if (topicNotesPopoverTopicId) {
            renderTopicNotesPopover(topicNotesPopoverTopicId);
          }
        });
        actions.appendChild(deleteBtn);

        item.appendChild(actions);
        return item;
      }

      function renderTopicNotesPopover(topicId) {
        if (!topicNotesListEl || !topicNotesEmptyEl) return;
        const notes = getTopicNotesForTopic(topicId);
        topicNotesListEl.innerHTML = '';
        if (!notes.length) {
          topicNotesEmptyEl.hidden = false;
          topicNotesListEl.hidden = true;
        } else {
          topicNotesEmptyEl.hidden = true;
          topicNotesListEl.hidden = false;
          notes.forEach(note => {
            topicNotesListEl.appendChild(createTopicNoteListItem(note));
          });
        }
      }

      function openTopicNotesPopover(page, anchor) {
        if (!page || !anchor) return;
        const topicId = page.dataset.topicId || '';
        if (!topicId) return;
        if (topicNotesAnchor && topicNotesAnchor !== anchor) {
          topicNotesAnchor.classList.remove('is-open');
          topicNotesAnchor.setAttribute('aria-expanded', 'false');
        }
        topicNotesAnchor = anchor;
        topicNotesPopoverTopicId = topicId;
        topicNotesPopover.dataset.topicId = topicId;
        anchor.classList.add('is-open');
        anchor.setAttribute('aria-expanded', 'true');
        const title = getTopicTitle(page) || 'Tema';
        if (topicNotesTitleEl) {
          topicNotesTitleEl.textContent = title;
        }
        renderTopicNotesPopover(topicId);
        topicNotesPopover.style.visibility = 'hidden';
        topicNotesPopover.classList.add('open');
        topicNotesPopover.setAttribute('aria-hidden', 'false');
        positionTopicNotesPopover(anchor);
        topicNotesPopover.style.visibility = '';
      }

      function toggleTopicNotesPopover(page, anchor) {
        const topicId = page?.dataset.topicId || '';
        if (!topicId) return;
        if (isTopicNotesPopoverOpen() && topicNotesPopoverTopicId === topicId) {
          closeTopicNotesPopover();
        } else {
          openTopicNotesPopover(page, anchor);
        }
      }

      function refreshTopicNoteIndicators() {
        const counts = collectTopicNoteCounts();
        pages.forEach(page => {
          const topicId = (page.dataset.topicId || '').trim();
          const icon = page.querySelector('.topic-note-icon');
          if (!icon) return;
          const count = counts.get(topicId) || 0;
          icon.classList.toggle('has-notes', count > 0);
          icon.dataset.noteCount = String(count);
          icon.setAttribute('aria-label', count > 0
            ? `${count} nota${count === 1 ? '' : 's'} en este tema`
            : 'Notas del tema');
          icon.title = count > 0
            ? `${count === 1 ? '1 nota' : `${count} notas`} en este tema`
            : 'Agregar nota en este tema';
          const iconIsOpen = isTopicNotesPopoverOpen() && topicNotesPopoverTopicId === topicId;
          icon.setAttribute('aria-expanded', iconIsOpen ? 'true' : 'false');
          icon.classList.toggle('is-open', iconIsOpen);
          if (topicNotesPopoverTopicId === topicId && topicNotesAnchor !== icon && isTopicNotesPopoverOpen()) {
            topicNotesAnchor = icon;
            icon.classList.add('is-open');
            icon.setAttribute('aria-expanded', 'true');
            positionTopicNotesPopover(icon);
          }
        });
        if (sectionsContainer) {
          sectionsContainer.querySelectorAll('.topic-list li').forEach(li => {
            const topicId = (li.dataset.topicId || '').trim();
            const count = counts.get(topicId) || 0;
            li.classList.toggle('has-notes', count > 0);
            const indicator = li.querySelector('.topic-note-indicator');
            if (indicator) {
              indicator.hidden = count === 0;
              indicator.dataset.count = String(count);
              indicator.setAttribute('aria-hidden', count > 0 ? 'false' : 'true');
              indicator.title = count === 0
                ? 'Sin notas en este tema'
                : `${count === 1 ? '1 nota' : `${count} notas`} en este tema`;
            }
          });
        }
        if (isTopicNotesPopoverOpen() && topicNotesPopoverTopicId) {
          renderTopicNotesPopover(topicNotesPopoverTopicId);
          positionTopicNotesPopover(topicNotesAnchor);
        }
      }

      function scheduleTopicNoteIndicatorRefresh() {
        if (pendingTopicNoteIndicatorUpdate) return;
        pendingTopicNoteIndicatorUpdate = true;
        requestAnimationFrame(() => {
          pendingTopicNoteIndicatorUpdate = false;
          refreshTopicNoteIndicators();
        });
      }

      function safeCssEscape(value) {
        if (typeof value !== 'string') {
          return '';
        }
        if (window.CSS && typeof window.CSS.escape === 'function') {
          return window.CSS.escape(value);
        }
        return value.replace(/[^a-zA-Z0-9_\-]/g, (char) => `\\${char}`);
      }

      topicNotesAddBtn?.addEventListener('click', () => {
        if (!topicNotesPopoverTopicId) return;
        const page = findPageByTopicId(topicNotesPopoverTopicId) || currentPageRef;
        if (!page) return;
        if (floatingNotesHidden) {
          setFloatingNotesVisibility(false);
        }
        const payload = {
          topicId: topicNotesPopoverTopicId,
          sectionId: page.dataset.sectionId || currentSectionId || null,
          focus: true
        };
        if (floatingNotesLayer && topicNotesAnchor) {
          const layerRect = floatingNotesLayer.getBoundingClientRect();
          const anchorRect = topicNotesAnchor.getBoundingClientRect();
          const anchorCenter = anchorRect.left + (anchorRect.width / 2);
          payload.left = Math.max(0, anchorCenter - layerRect.left - (FLOATING_NOTE_DEFAULT_WIDTH / 2));
          payload.top = Math.max(0, anchorRect.bottom - layerRect.top + 12);
        }
        createFloatingNote(payload);
        closeTopicNotesPopover();
      });

      topicNotesOpenPanelBtn?.addEventListener('click', () => {
        if (notesViewController) {
          notesViewController.open('topic');
        }
        closeTopicNotesPopover();
      });

      topicNotesCloseBtn?.addEventListener('click', () => {
        closeTopicNotesPopover();
      });

      function hideTopicMenu() {
        topicMenu.classList.remove('show');
        topicMenuContext = null;
        topicMenuJustOpened = false;
      }

      function getTopicTitle(page) {
        if (!page) return '';
        const h1 = page.querySelector('h1');
        const titleSpan = h1?.querySelector('span:first-child');
        return (titleSpan?.textContent || h1?.textContent || '').trim();
      }

      function showTopicMenu(event, tema) {
        if (!tema || !tema.page) return;
        hideTopicMenu();

        const page = tema.page;
        const title = (tema.titulo || getTopicTitle(page) || 'Tema').trim();
        topicMenuContext = { page, titulo: title };

        const pageX = event.pageX || (event.clientX + window.scrollX);
        const pageY = event.pageY || (event.clientY + window.scrollY);

        topicMenu.style.left = pageX + 'px';
        topicMenu.style.top = pageY + 'px';
        topicMenu.classList.add('show');

        const rect = topicMenu.getBoundingClientRect();
        let newLeft = rect.left;
        let newTop = rect.top;

        if (rect.right > window.innerWidth) {
          newLeft = window.innerWidth - rect.width - 12;
        }
        if (rect.bottom > window.innerHeight) {
          newTop = window.innerHeight - rect.height - 12;
        }

        newLeft = Math.max(8, newLeft);
        newTop = Math.max(8, newTop);

        topicMenu.style.left = window.scrollX + newLeft + 'px';
        topicMenu.style.top = window.scrollY + newTop + 'px';

        topicMenuJustOpened = true;
        setTimeout(() => {
          topicMenuJustOpened = false;
        }, 0);
      }

      function renameTopicPage(page) {
        if (!page) return false;
        const h1 = page.querySelector('h1');
        const titleSpan = h1?.querySelector('span:first-child');
        const currentTitle = (titleSpan?.textContent || h1?.textContent || 'Tema').trim();
        const newTitle = prompt('Nuevo título para el tema:', currentTitle);
        if (!newTitle || !newTitle.trim()) return false;
        const cleanTitle = newTitle.trim();
        if (titleSpan) {
          titleSpan.textContent = cleanTitle;
        } else if (h1) {
          h1.textContent = cleanTitle;
        }
        page.dataset.topicTitle = cleanTitle;
        initializeSections();
        buildSectionsPanel();
        setupMagicIcons();
        return true;
      }

      function moveTopicPage(page) {
        if (!page) return false;
        if (!sections.length) {
          initializeSections();
        }
        if (sections.length <= 1) {
          alert('No hay otras secciones disponibles para mover este tema.');
          return false;
        }

        const currentSection = sections.find(section => section.id === page.dataset.sectionId);
        const options = sections.map((section, idx) => `${idx + 1}. ${section.nombre}${section === currentSection ? ' (actual)' : ''}`).join('\n');
        const choice = prompt(`Mover tema a sección:\n${options}\nEscribe el número o nombre de la sección destino:`, currentSection?.nombre || '');
        if (!choice || !choice.trim()) return false;

        const trimmed = choice.trim().toLowerCase();
        let targetSection = sections.find((section, idx) => String(idx + 1) === trimmed);
        if (!targetSection) {
          targetSection = sections.find(section => section.nombre.toLowerCase() === trimmed);
        }

        if (!targetSection) {
          alert('No se encontró la sección indicada.');
          return false;
        }

        page.dataset.sectionId = targetSection.id;
        page.dataset.sectionName = targetSection.nombre;
        const targetTheme = sectionThemes.get(targetSection.id) || DEFAULT_THEME;
        sectionThemes.set(targetSection.id, targetTheme);
        applyThemeToPage(page, targetTheme);
        initializeSections();
        buildSectionsPanel();
        setActivePage(page);
        return true;
      }

      function deleteTopicPage(page) {
        if (!page) return false;
        const title = getTopicTitle(page) || 'este tema';
        if (!confirm(`¿Eliminar "${title}"?`)) {
          return false;
        }
        page.remove();
        pages = pages.filter(p => p !== page);
        initializeSections();
        buildSectionsPanel();
        if (currentPageRef === page) {
          setActivePage(getCurrentPage());
        }
        return true;
      }

      topicMenu.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button || !topicMenuContext) return;
        event.preventDefault();
        event.stopPropagation();

        const { page } = topicMenuContext;
        if (!page) {
          hideTopicMenu();
          return;
        }

        switch (button.dataset.action) {
          case 'rename':
            renameTopicPage(page);
            break;
          case 'move':
            moveTopicPage(page);
            break;
          case 'delete':
            deleteTopicPage(page);
            break;
        }

        hideTopicMenu();
      });

      document.addEventListener('click', (event) => {
        if (topicMenuJustOpened) return;
        if (!topicMenu.contains(event.target)) {
          hideTopicMenu();
        }
      });

      document.addEventListener('scroll', hideTopicMenu, true);
      window.addEventListener('resize', hideTopicMenu);
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          hideTopicMenu();
          hideTemplateToolbar();
          hideImageToolbar();
          tableMenuAPI?.cancelResize();
          tableMenuAPI?.hide();
        }
      });

      /* === ZOOM === */
      function syncMagicZoom() {
        if (!magic) return;
        if (isMagicViewActive) {
          magic.style.setProperty('--magic-zoom', '1');
        } else {
          magic.style.removeProperty('--magic-zoom');
        }
      }

      function applyZoom(level, options = {}) {
        const { skipRemember = false } = options;
        const previousZoom = currentZoom || 1;
        const newZoom = Math.max(0.5, Math.min(2, level));
        const scrollElement = document.scrollingElement || document.documentElement || document.body;
        const pageRef = getCurrentPage();

        let pageScrollState = null;
        if (scrollElement && pageRef && pageRef.isConnected) {
          const scrollTop = scrollElement.scrollTop;
          const pageRect = pageRef.getBoundingClientRect();
          const pageTop = pageRect.top + scrollTop;
          const pageHeight = pageRect.height || 1;
          const rawOffset = scrollTop - pageTop;
          const clampedOffset = Math.min(Math.max(rawOffset, 0), pageHeight);
          pageScrollState = {
            page: pageRef,
            ratio: pageHeight > 0 ? clampedOffset / pageHeight : 0
          };
        }

        currentZoom = newZoom;
        document.documentElement.style.setProperty('--zoom-level', currentZoom);
        if (zoomValue) {
          zoomValue.textContent = Math.round(currentZoom * 100) + '%';
        }
        if (!skipRemember && !isMagicViewActive) {
          lastRegularZoom = currentZoom;
        }

        if (Math.abs(currentZoom - previousZoom) >= 0.0001) {
          adjustFloatingNotesForZoom(previousZoom, currentZoom);

          if (scrollElement) {
            if (pageScrollState) {
              requestAnimationFrame(() => {
                const { page, ratio } = pageScrollState;
                if (!page || !page.isConnected) return;
                const updatedRect = page.getBoundingClientRect();
                const updatedTop = updatedRect.top + scrollElement.scrollTop;
                const updatedHeight = updatedRect.height || 1;
                const targetTop = updatedTop + (updatedHeight * (Number.isFinite(ratio) ? ratio : 0));
                scrollElement.scrollTo({ top: targetTop });
              });
            } else {
              const viewportCenter = scrollElement.scrollTop + window.innerHeight / 2;
              const scaleFactor = currentZoom / previousZoom;
              const targetCenter = viewportCenter * scaleFactor;
              const desiredTop = Math.max(0, targetCenter - window.innerHeight / 2);
              scrollElement.scrollTo({ top: desiredTop });
            }
          }
        }

        syncMagicZoom();
      }

      function adjustFloatingNotesForZoom(prevZoom, nextZoom) {
        if (!floatingNotesLayer) return;
        if (!Number.isFinite(prevZoom) || prevZoom <= 0) return;
        if (!Number.isFinite(nextZoom) || nextZoom <= 0) return;
        if (Math.abs(nextZoom - prevZoom) < 0.0001) {
          return;
        }

        const scaleFactor = nextZoom / prevZoom;

        floatingNotesLayer.querySelectorAll('.floating-note').forEach(note => {
          const noteId = note.dataset.noteId;
          if (!noteId) return;

          const noteData = notesRegistry.get(noteId);
          if (!noteData) return;

          const updates = {};

          if (Number.isFinite(noteData.pageOffsetTop)) {
            updates.pageOffsetTop = Math.round(noteData.pageOffsetTop * scaleFactor);
            note.dataset.pageOffsetTop = String(updates.pageOffsetTop);
          }

          if (Number.isFinite(noteData.pageOffsetLeft)) {
            updates.pageOffsetLeft = Math.round(noteData.pageOffsetLeft * scaleFactor);
            note.dataset.pageOffsetLeft = String(updates.pageOffsetLeft);
          }

          if (Object.keys(updates).length > 0) {
            updateNoteData(noteId, updates, { silent: true });
          }
        });

        floatingNotesViewportRelaxedMatching = true;
        scheduleFloatingNotesViewportRefresh();
      }

      function applyDocumentShift() {
        document.documentElement.style.setProperty('--document-horizontal-shift', `${documentHorizontalShift}px`);
        if (isTopicNotesPopoverOpen()) {
          positionTopicNotesPopover(topicNotesAnchor);
        }
      }

      function adjustDocumentShift(delta) {
        const nextValue = Math.min(
          DOCUMENT_SHIFT_MAX,
          Math.max(DOCUMENT_SHIFT_MIN, documentHorizontalShift + delta)
        );
        if (nextValue === documentHorizontalShift) {
          return;
        }
        documentHorizontalShift = nextValue;
        applyDocumentShift();
        scheduleFloatingNotesViewportRefresh();
        if (isTopicNotesPopoverOpen()) {
          positionTopicNotesPopover(topicNotesAnchor);
        }
      }

      function getDefaultImageViewerContext() {
        return {
          images: [],
          selectedImageId: null,
          notesById: {}
        };
      }

      function getDefaultImageViewerState() {
        return {
          contexts: {
            [IMAGE_VIEWER_DEFAULT_CONTEXT_KEY]: getDefaultImageViewerContext()
          },
          activeContext: IMAGE_VIEWER_DEFAULT_CONTEXT_KEY
        };
      }

      function sanitizeViewerImages(images) {
        if (!Array.isArray(images)) {
          return [];
        }
        const unique = new Map();
        images.forEach(image => {
          if (!image || typeof image !== 'object') {
            return;
          }
          const id = typeof image.id === 'string' ? image.id : '';
          const dataUrl = typeof image.dataUrl === 'string' ? image.dataUrl : '';
          if (!id || !dataUrl) {
            return;
          }
          unique.set(id, {
            id,
            dataUrl,
            name: typeof image.name === 'string' && image.name ? image.name : 'imagen-sin-nombre',
            size: Number.isFinite(image.size) ? image.size : 0,
            type: typeof image.type === 'string' && image.type ? image.type : 'image/*',
            createdAt: typeof image.createdAt === 'string' ? image.createdAt : new Date().toISOString(),
            width: Number.isFinite(image.width) ? image.width : null,
            height: Number.isFinite(image.height) ? image.height : null
          });
        });
        return Array.from(unique.values());
      }

      function sanitizeImageViewerContext(context) {
        if (!context || typeof context !== 'object') {
          return getDefaultImageViewerContext();
        }
        const sanitizedImages = sanitizeViewerImages(context.images);
        const notesById = {};
        if (context.notesById && typeof context.notesById === 'object') {
          Object.entries(context.notesById).forEach(([key, value]) => {
            if (typeof value === 'string') {
              notesById[key] = value;
            }
          });
        }
        let selectedImageId = typeof context.selectedImageId === 'string' ? context.selectedImageId : null;
        if (!sanitizedImages.some(image => image.id === selectedImageId)) {
          selectedImageId = sanitizedImages.length ? sanitizedImages[sanitizedImages.length - 1].id : null;
        }
        return {
          images: sanitizedImages,
          selectedImageId,
          notesById
        };
      }

      function sanitizeImageViewerState(next) {
        if (!next || typeof next !== 'object') {
          return getDefaultImageViewerState();
        }

        const looksLegacy = Array.isArray(next.images)
          || typeof next.selectedImageId === 'string'
          || (next.notesById && typeof next.notesById === 'object');

        if (looksLegacy) {
          const legacyContext = sanitizeImageViewerContext({
            images: next.images,
            selectedImageId: next.selectedImageId,
            notesById: next.notesById
          });
          return {
            contexts: {
              [IMAGE_VIEWER_DEFAULT_CONTEXT_KEY]: legacyContext
            },
            activeContext: IMAGE_VIEWER_DEFAULT_CONTEXT_KEY
          };
        }

        const incomingContexts = next.contexts && typeof next.contexts === 'object' ? next.contexts : {};
        const sanitizedContexts = {};

        Object.entries(incomingContexts).forEach(([key, value]) => {
          if (typeof key !== 'string' || !key) {
            return;
          }
          sanitizedContexts[key] = sanitizeImageViewerContext(value);
        });

        if (!Object.keys(sanitizedContexts).length) {
          sanitizedContexts[IMAGE_VIEWER_DEFAULT_CONTEXT_KEY] = getDefaultImageViewerContext();
        } else if (!sanitizedContexts[IMAGE_VIEWER_DEFAULT_CONTEXT_KEY]) {
          sanitizedContexts[IMAGE_VIEWER_DEFAULT_CONTEXT_KEY] = getDefaultImageViewerContext();
        }

        const availableKeys = Object.keys(sanitizedContexts);
        let activeContext = typeof next.activeContext === 'string' && sanitizedContexts[next.activeContext]
          ? next.activeContext
          : null;

        if (!activeContext) {
          if (availableKeys.includes(IMAGE_VIEWER_DEFAULT_CONTEXT_KEY)) {
            activeContext = IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
          } else {
            activeContext = availableKeys[0];
          }
        }

        if (!activeContext || !sanitizedContexts[activeContext]) {
          activeContext = IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
          sanitizedContexts[activeContext] = sanitizedContexts[activeContext] || getDefaultImageViewerContext();
        }

        return {
          contexts: sanitizedContexts,
          activeContext
        };
      }

      function loadImageViewerState() {
        if (!window.localStorage) {
          return getDefaultImageViewerState();
        }
        try {
          const raw = window.localStorage.getItem(IMAGE_VIEWER_STORAGE_KEY);
          if (!raw) {
            return getDefaultImageViewerState();
          }
          const parsed = JSON.parse(raw);
          return sanitizeImageViewerState(parsed);
        } catch (error) {
          console.warn('No se pudo cargar el estado del visor de imágenes:', error);
          return getDefaultImageViewerState();
        }
      }

      function persistImageViewerState() {
        if (!window.localStorage) {
          return;
        }
        try {
          window.localStorage.setItem(IMAGE_VIEWER_STORAGE_KEY, JSON.stringify(imageViewerState));
        } catch (error) {
          console.warn('No se pudo guardar el estado del visor de imágenes:', error);
        }
      }

      function setImageViewerState(updater, options = {}) {
        const current = imageViewerState;
        let next = typeof updater === 'function' ? updater(current) : updater;
        if (next === current) {
          next = { ...current };
        }
        imageViewerState = sanitizeImageViewerState({
          contexts: next?.contexts ?? current.contexts,
          activeContext: next?.activeContext ?? current.activeContext
        });
        persistImageViewerState();
        if (options.rerender !== false) {
          renderImageViewer();
        }
      }

      function getActiveImageViewerContextKey() {
        const state = imageViewerState || getDefaultImageViewerState();
        const desiredKey = imageViewerContextKey || state.activeContext || IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
        if (state.contexts && state.contexts[desiredKey]) {
          return desiredKey;
        }
        const availableKeys = state.contexts ? Object.keys(state.contexts) : [];
        if (availableKeys.length) {
          return availableKeys[0];
        }
        return IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
      }

      function getActiveImageViewerContext() {
        const key = getActiveImageViewerContextKey();
        const context = imageViewerState.contexts?.[key];
        if (context) {
          return { key, context };
        }
        return { key, context: getDefaultImageViewerContext() };
      }

      function updateImageViewerContext(contextKey, updater, options = {}) {
        const targetKey = contextKey || IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
        setImageViewerState(state => {
          const contexts = { ...state.contexts };
          const currentContext = sanitizeImageViewerContext(contexts[targetKey] || getDefaultImageViewerContext());
          const nextContext = sanitizeImageViewerContext(
            typeof updater === 'function' ? updater(currentContext) : updater
          );
          contexts[targetKey] = nextContext;
          return {
            contexts,
            activeContext: targetKey
          };
        }, options);
      }

      function activateImageViewerContext(contextKey, { externalImages, selectedRuntimeId, rerender = true } = {}) {
        const targetKey = contextKey || IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
        const previousKey = imageViewerContextKey;
        if (Array.isArray(externalImages)) {
          imageViewerContextExternalImages = externalImages;
        } else if (externalImages === null) {
          imageViewerContextExternalImages = [];
        } else if (previousKey !== targetKey) {
          imageViewerContextExternalImages = [];
        }
        if (selectedRuntimeId !== undefined) {
          imageViewerRuntimeSelectionId = selectedRuntimeId;
        }
        imageViewerContextKey = targetKey;
        setImageViewerState(state => {
          const contexts = { ...state.contexts };
          if (!contexts[targetKey]) {
            contexts[targetKey] = getDefaultImageViewerContext();
          }
          return {
            contexts,
            activeContext: targetKey
          };
        }, { rerender });
      }

      function clearImageViewerPreview() {
        imageViewerPreviewSource = null;
      }

      function getImageViewerCombinedImages() {
        const { key, context } = getActiveImageViewerContext();
        const external = Array.isArray(imageViewerContextExternalImages)
          ? imageViewerContextExternalImages
          : [];

        const normalizedExternal = external.reduce((list, entry, index) => {
          if (!entry || typeof entry !== 'object') {
            return list;
          }
          const src = typeof entry.src === 'string' && entry.src
            ? entry.src
            : (typeof entry.dataUrl === 'string' ? entry.dataUrl : '');
          if (!src) {
            return list;
          }
          const runtimeId = entry.runtimeId || `external:${key}:${index}`;
          list.push({
            runtimeId,
            id: entry.id || runtimeId,
            src,
            dataUrl: typeof entry.dataUrl === 'string' && entry.dataUrl ? entry.dataUrl : (src.startsWith('data:') ? src : ''),
            name: entry.name || entry.alt || 'Imagen',
            alt: entry.alt || entry.name || 'Imagen',
            width: Number.isFinite(entry.width) ? entry.width : null,
            height: Number.isFinite(entry.height) ? entry.height : null,
            size: Number.isFinite(entry.size) ? entry.size : null,
            type: entry.type || '',
            source: 'document',
            element: entry.element instanceof HTMLImageElement ? entry.element : null
          });
          return list;
        }, []);

        const library = Array.isArray(context.images)
          ? context.images.map(image => ({
              runtimeId: `library:${image.id}`,
              id: image.id,
              dataUrl: image.dataUrl,
              src: image.dataUrl,
              name: image.name || 'imagen',
              alt: image.alt || image.name || 'imagen',
              width: Number.isFinite(image.width) ? image.width : null,
              height: Number.isFinite(image.height) ? image.height : null,
              size: Number.isFinite(image.size) ? image.size : null,
              type: image.type || 'image/*',
              source: 'library'
            }))
          : [];

        return [...normalizedExternal, ...library];
      }

      function getActiveViewerImage() {
        const combined = getImageViewerCombinedImages();
        if (!combined.length) {
          if (imageViewerPreviewSource && imageViewerPreviewSource.src) {
            return { ...imageViewerPreviewSource, source: 'preview', runtimeId: 'preview' };
          }
          return null;
        }
        const runtimeId = imageViewerRuntimeSelectionId;
        let active = null;
        if (runtimeId) {
          active = combined.find(item => item.runtimeId === runtimeId) || null;
        }
        if (!active) {
          const { context } = getActiveImageViewerContext();
          if (context.selectedImageId) {
            active = combined.find(item => item.source === 'library' && item.id === context.selectedImageId) || null;
          }
        }
        if (!active) {
          active = combined[0] || null;
        }
        if (active) {
          imageViewerRuntimeSelectionId = active.runtimeId || null;
        }
        return active;
      }

      function clampImageViewerZoom(value) {
        if (!Number.isFinite(value)) {
          return imageViewerZoom;
        }
        return Math.min(IMAGE_VIEWER_ZOOM_MAX, Math.max(IMAGE_VIEWER_ZOOM_MIN, value));
      }

      function applyImageViewerZoom() {
        if (!imageViewerActiveImage) {
          return;
        }
        const active = getActiveViewerImage();
        if (!active) {
          imageViewerActiveImage.style.transform = 'scale(1)';
          return;
        }
        imageViewerActiveImage.style.transform = `scale(${imageViewerZoom})`;
      }

      function updateImageViewerZoomControls() {
        const active = getActiveViewerImage();
        const hasImage = !!active;
        if (imageViewerZoomValue) {
          if (hasImage) {
            const percentage = Math.round(imageViewerZoom * 100);
            imageViewerZoomValue.textContent = `${percentage}%`;
          } else {
            imageViewerZoomValue.textContent = '—';
          }
        }
        const canZoomOut = hasImage && imageViewerZoom > IMAGE_VIEWER_ZOOM_MIN + 0.001;
        const canZoomIn = hasImage && imageViewerZoom < IMAGE_VIEWER_ZOOM_MAX - 0.001;
        const canReset = hasImage && Math.abs(imageViewerZoom - 1) > 0.001;
        if (imageViewerZoomOutBtn) {
          if (canZoomOut) {
            imageViewerZoomOutBtn.removeAttribute('disabled');
          } else {
            imageViewerZoomOutBtn.setAttribute('disabled', 'true');
          }
        }
        if (imageViewerZoomInBtn) {
          if (canZoomIn) {
            imageViewerZoomInBtn.removeAttribute('disabled');
          } else {
            imageViewerZoomInBtn.setAttribute('disabled', 'true');
          }
        }
        if (imageViewerZoomResetBtn) {
          if (canReset) {
            imageViewerZoomResetBtn.removeAttribute('disabled');
          } else {
            imageViewerZoomResetBtn.setAttribute('disabled', 'true');
          }
        }
      }

      function setImageViewerZoom(value) {
        if (!getActiveViewerImage()) {
          imageViewerZoom = 1;
          applyImageViewerZoom();
          updateImageViewerZoomControls();
          return;
        }
        const next = clampImageViewerZoom(value);
        if (Math.abs(next - imageViewerZoom) < 0.001) {
          updateImageViewerZoomControls();
          return;
        }
        imageViewerZoom = next;
        applyImageViewerZoom();
        updateImageViewerZoomControls();
      }

      function adjustImageViewerZoom(delta) {
        setImageViewerZoom(imageViewerZoom + delta);
      }

      function resetImageViewerZoom() {
        imageViewerZoom = 1;
        applyImageViewerZoom();
        updateImageViewerZoomControls();
      }

      function computeImageViewerShift() {
        const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 0;
        if (!viewportWidth) {
          return 0;
        }
        const panelWidth = imageViewerPanel ? imageViewerPanel.getBoundingClientRect().width : 0;
        const effectiveWidth = panelWidth && Number.isFinite(panelWidth)
          ? panelWidth
          : viewportWidth * 0.48;
        const desired = -Math.round(effectiveWidth * 0.65);
        return Math.min(DOCUMENT_SHIFT_MAX, Math.max(DOCUMENT_SHIFT_MIN, desired));
      }

      function enforceImageViewerShift({ force = false } = {}) {
        if (!imageViewerPanel?.classList.contains('open')) {
          return;
        }
        const desired = computeImageViewerShift();
        if (!force && imageViewerActiveShift !== null && Math.abs(documentHorizontalShift - imageViewerActiveShift) > 6) {
          imageViewerActiveShift = documentHorizontalShift;
          return;
        }
        imageViewerActiveShift = desired;
        documentHorizontalShift = desired;
        applyDocumentShift();
        scheduleFloatingNotesViewportRefresh();
      }

      function openImageViewer() {
        if (!imageViewerPanel) return;
        if (imageViewerPanel.classList.contains('open')) {
          enforceImageViewerShift({ force: true });
          return;
        }
        imageViewerPreviousShift = documentHorizontalShift;
        hideImageToolbar();
        imageViewerPanel.classList.add('open');
        imageViewerPanel.setAttribute('aria-hidden', 'false');
        document.body.classList.add('image-viewer-open');
        enforceImageViewerShift({ force: true });
        renderImageViewer();
      }

      function closeImageViewer({ restoreShift = true } = {}) {
        if (!imageViewerPanel) return;
        if (!imageViewerPanel.classList.contains('open')) {
          return;
        }
        imageViewerPanel.classList.remove('open');
        imageViewerPanel.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('image-viewer-open');
        imageViewerActiveShift = null;
        clearImageViewerPreview();
        imageViewerCurrentToken = null;
        resetImageViewerZoom();
        if (restoreShift && imageViewerPreviousShift !== null) {
          documentHorizontalShift = imageViewerPreviousShift;
          applyDocumentShift();
          scheduleFloatingNotesViewportRefresh();
        }
        imageViewerPreviousShift = null;
      }

      function toggleImageViewer(forceState = null) {
        const shouldOpen = forceState === null ? !imageViewerPanel?.classList.contains('open') : !!forceState;
        if (shouldOpen) {
          openImageViewer();
        } else {
          closeImageViewer();
        }
      }

      function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
          if (!(file instanceof Blob)) {
            reject(new Error('Archivo inválido'));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
          reader.readAsDataURL(file);
        });
      }

      function computeImageDimensions(dataUrl) {
        return new Promise((resolve, reject) => {
          if (!dataUrl) {
            reject(new Error('Sin datos de imagen'));
            return;
          }
          const image = new Image();
          image.onload = () => {
            const width = Number.isFinite(image.naturalWidth) ? image.naturalWidth : image.width;
            const height = Number.isFinite(image.naturalHeight) ? image.naturalHeight : image.height;
            resolve({
              width: Number.isFinite(width) ? width : null,
              height: Number.isFinite(height) ? height : null
            });
          };
          image.onerror = () => reject(new Error('No se pudo calcular dimensiones'));
          image.src = dataUrl;
        });
      }

      function formatBytes(bytes) {
        if (!Number.isFinite(bytes) || bytes <= 0) {
          return '';
        }
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
          value /= 1024;
          unitIndex += 1;
        }
        const formatted = unitIndex === 0 ? Math.round(value) : value < 10 ? value.toFixed(1) : Math.round(value);
        return `${formatted} ${units[unitIndex]}`;
      }

      function updateImageViewerMetaDisplay(image) {
        if (!imageViewerMeta) return;
        if (!image) {
          imageViewerMeta.textContent = '';
          return;
        }
        const pieces = [];
        if (Number.isFinite(image.size) && image.size > 0) {
          pieces.push(formatBytes(image.size));
        }
        if (Number.isFinite(image.width) && Number.isFinite(image.height)) {
          pieces.push(`${image.width} × ${image.height}px`);
        }
        imageViewerMeta.textContent = pieces.join(' · ');
      }

      function renderImageViewer() {
        if (!imageViewerPanel) return;
        const { context } = getActiveImageViewerContext();
        const combined = getImageViewerCombinedImages();
        let display = getActiveViewerImage();
        let isPreview = false;

        if (!display && imageViewerPreviewSource && imageViewerPreviewSource.src) {
          display = { ...imageViewerPreviewSource, source: 'preview', runtimeId: 'preview' };
        }

        if (display && display.source === 'preview') {
          isPreview = true;
        }

        if (display && display.runtimeId) {
          imageViewerRuntimeSelectionId = display.runtimeId;
        }

        const displayToken = display
          ? `${display.runtimeId || display.id || 'preview'}:${display.src || display.dataUrl || ''}`
          : null;

        if (displayToken !== imageViewerCurrentToken) {
          imageViewerCurrentToken = displayToken;
          resetImageViewerZoom();
        } else {
          applyImageViewerZoom();
          updateImageViewerZoomControls();
        }

        imageViewerPanel.classList.toggle('has-image', !!display);
        imageViewerPanel.classList.toggle('viewer-preview-mode', isPreview);
        imageViewerPanel.classList.toggle('viewer-has-multi', combined.length > 1);

        if (imageViewerPrevBtn) {
          const disabled = combined.length <= 1;
          if (disabled) {
            imageViewerPrevBtn.setAttribute('disabled', 'true');
            imageViewerPrevBtn.setAttribute('aria-hidden', 'true');
          } else {
            imageViewerPrevBtn.removeAttribute('disabled');
            imageViewerPrevBtn.setAttribute('aria-hidden', 'false');
          }
        }

        if (imageViewerNextBtn) {
          const disabled = combined.length <= 1;
          if (disabled) {
            imageViewerNextBtn.setAttribute('disabled', 'true');
            imageViewerNextBtn.setAttribute('aria-hidden', 'true');
          } else {
            imageViewerNextBtn.removeAttribute('disabled');
            imageViewerNextBtn.setAttribute('aria-hidden', 'false');
          }
        }

        const noteKey = display
          ? (display.source === 'preview'
            ? ''
            : (display.source === 'library' && display.id
              ? display.id
              : (display.runtimeId || display.id || '')))
          : '';
        const legacyNoteKey = display && display.source === 'library' && display.runtimeId
          ? display.runtimeId
          : '';

        if (!display) {
          if (imageViewerActiveImage) {
            imageViewerActiveImage.removeAttribute('src');
            imageViewerActiveImage.alt = 'Imagen seleccionada en el visor';
            imageViewerActiveImage.style.transform = 'scale(1)';
          }
          if (imageViewerFileName) {
            imageViewerFileName.textContent = '';
          }
          updateImageViewerMetaDisplay(null);
          if (imageViewerNotes) {
            if (document.activeElement !== imageViewerNotes) {
              imageViewerNotes.value = '';
            }
            imageViewerNotes.dataset.imageId = '';
            delete imageViewerNotes.dataset.fallbackId;
            imageViewerNotes.disabled = true;
            imageViewerNotes.placeholder = imageViewerNotesPreviewPlaceholder;
          }
          imageViewerDownloadBtn?.setAttribute('disabled', 'true');
          imageViewerRemoveBtn?.setAttribute('disabled', 'true');
          updateImageViewerZoomControls();
        } else {
          const displaySrc = display.dataUrl || display.src || '';
          if (imageViewerActiveImage) {
            if (displaySrc && imageViewerActiveImage.src !== displaySrc) {
              imageViewerActiveImage.src = displaySrc;
            }
            const label = display.name || display.alt || 'Imagen seleccionada en el visor';
            imageViewerActiveImage.alt = label;
          }
          if (imageViewerFileName) {
            imageViewerFileName.textContent = display.name || 'Imagen sin título';
          }
          updateImageViewerMetaDisplay(display);

          if (imageViewerNotes) {
            if (!noteKey) {
              if (document.activeElement !== imageViewerNotes) {
                imageViewerNotes.value = '';
              }
              imageViewerNotes.dataset.imageId = '';
              delete imageViewerNotes.dataset.fallbackId;
              imageViewerNotes.disabled = true;
              imageViewerNotes.placeholder = imageViewerNotesPreviewPlaceholder;
            } else {
              let currentValue = '';
              if (typeof context.notesById?.[noteKey] === 'string') {
                currentValue = context.notesById[noteKey];
              } else if (legacyNoteKey && typeof context.notesById?.[legacyNoteKey] === 'string') {
                currentValue = context.notesById[legacyNoteKey];
              }
              if (imageViewerNotes.dataset.imageId !== noteKey || document.activeElement !== imageViewerNotes) {
                imageViewerNotes.value = currentValue;
              }
              imageViewerNotes.dataset.imageId = noteKey;
              if (legacyNoteKey) {
                imageViewerNotes.dataset.fallbackId = legacyNoteKey;
              } else {
                delete imageViewerNotes.dataset.fallbackId;
              }
              imageViewerNotes.disabled = false;
              imageViewerNotes.placeholder = imageViewerNotesDefaultPlaceholder;
            }
          }

          if (displaySrc) {
            imageViewerDownloadBtn?.removeAttribute('disabled');
          } else {
            imageViewerDownloadBtn?.setAttribute('disabled', 'true');
          }

          if (display.source === 'library') {
            imageViewerRemoveBtn?.removeAttribute('disabled');
          } else {
            imageViewerRemoveBtn?.setAttribute('disabled', 'true');
          }
        }

        if (imageViewerGallery) {
          imageViewerGallery.innerHTML = '';
          if (combined.length) {
            const fragment = document.createDocumentFragment();
            combined.forEach(item => {
              const button = document.createElement('button');
              button.type = 'button';
              button.className = 'image-viewer-thumb';
              if (display && item.runtimeId === (display.runtimeId || display.id)) {
                button.classList.add('active');
              }
              const runtimeId = item.runtimeId || item.id || '';
              const thumbId = item.source === 'library' ? item.id : runtimeId;
              if (thumbId) {
                button.dataset.imageId = thumbId;
              }
              if (runtimeId) {
                button.dataset.runtimeId = runtimeId;
              }
              button.dataset.source = item.source || 'document';
              const thumb = document.createElement('img');
              thumb.src = item.dataUrl || item.src;
              thumb.alt = item.name || 'Imagen';
              button.title = item.name || '';
              button.appendChild(thumb);
              fragment.appendChild(button);
            });
            imageViewerGallery.appendChild(fragment);
          }
        }

        updateImageViewerZoomControls();
      }

      async function handleImageViewerFiles(fileList) {
        const files = Array.from(fileList || []).filter(file => file && (!file.type || file.type.startsWith('image/')));
        if (!files.length) {
          return;
        }
        const additions = [];
        const contextKey = getActiveImageViewerContextKey();
        for (const file of files) {
          try {
            const dataUrl = await readFileAsDataUrl(file);
            if (!dataUrl) {
              continue;
            }
            const id = generateUniqueId('viewer-image');
            const entry = {
              id,
              dataUrl,
              name: file.name || 'imagen',
              size: Number.isFinite(file.size) ? file.size : 0,
              type: file.type || 'image/*',
              createdAt: new Date().toISOString(),
              width: null,
              height: null
            };
            additions.push(entry);
            computeImageDimensions(dataUrl)
              .then(dimensions => {
                if (!dimensions) return;
                updateImageViewerContext(contextKey, ctx => {
                  if (!ctx.images.some(img => img.id === id)) {
                    return ctx;
                  }
                  return {
                    images: ctx.images.map(img => img.id === id ? { ...img, ...dimensions } : img),
                    selectedImageId: ctx.selectedImageId,
                    notesById: ctx.notesById
                  };
                }, { rerender: id === (additions[additions.length - 1]?.id || id) });
              })
              .catch(() => {});
          } catch (error) {
            console.warn('No se pudo procesar la imagen seleccionada:', error);
          }
        }
        if (!additions.length) {
          return;
        }
        const lastAdditionId = additions[additions.length - 1].id;
        clearImageViewerPreview();
        imageViewerCurrentToken = null;
        imageViewerRuntimeSelectionId = `library:${lastAdditionId}`;
        updateImageViewerContext(contextKey, ctx => ({
          images: [...ctx.images, ...additions],
          selectedImageId: lastAdditionId,
          notesById: { ...ctx.notesById }
        }));
        if (!imageViewerPanel?.classList.contains('open')) {
          openImageViewer();
        }
      }

      function handleImageViewerDownload() {
        const active = getActiveViewerImage();
        if (!active) {
          return;
        }
        const href = active.dataUrl || active.src;
        if (!href) {
          return;
        }
        const link = document.createElement('a');
        link.href = href;
        let extension = 'png';
        if (active.type && active.type.includes('/')) {
          extension = active.type.split('/')[1];
        } else if (href.startsWith('data:image/')) {
          const match = href.slice(0, 32).match(/^data:image\/([^;]+)/i);
          if (match && match[1]) {
            extension = match[1];
          }
        } else {
          const sanitized = href.split('?')[0].split('#')[0];
          const pathParts = sanitized.split('/');
          const lastSegment = pathParts[pathParts.length - 1] || '';
          const extMatch = lastSegment.match(/\.([a-z0-9]{2,5})$/i);
          if (extMatch && extMatch[1]) {
            extension = extMatch[1];
          }
        }
        const nameCandidate = (active.name || active.alt || 'imagen').trim();
        const safeName = nameCandidate ? nameCandidate.replace(/[^a-zA-Z0-9._-]+/g, '_') : 'imagen';
        link.download = safeName.includes('.') ? safeName : `${safeName}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      function handleImageViewerRemove() {
        const active = getActiveViewerImage();
        if (!active || active.source !== 'library' || !active.id) {
          return;
        }
        const targetId = active.id;
        const contextKey = getActiveImageViewerContextKey();
        let nextRuntimeSelection = null;
        updateImageViewerContext(contextKey, ctx => {
          const nextImages = ctx.images.filter(image => image.id !== targetId);
          const nextNotes = { ...ctx.notesById };
          delete nextNotes[targetId];
          let nextSelectedId = ctx.selectedImageId;
          if (!nextImages.some(image => image.id === nextSelectedId)) {
            nextSelectedId = nextImages.length ? nextImages[nextImages.length - 1].id : null;
          }
          nextRuntimeSelection = nextSelectedId ? `library:${nextSelectedId}` : null;
          return {
            images: nextImages,
            selectedImageId: nextSelectedId,
            notesById: nextNotes
          };
        });
        imageViewerRuntimeSelectionId = nextRuntimeSelection;
      }

      function buildViewerContextKey(prefix, identifier) {
        const cleanPrefix = typeof prefix === 'string' && prefix.length ? prefix : IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
        const rawId = typeof identifier === 'string' ? identifier.trim() : '';
        if (!rawId) {
          return cleanPrefix;
        }
        const sanitized = rawId.replace(/[^a-zA-Z0-9:_-]+/g, '-');
        return `${cleanPrefix}:${sanitized || 'default'}`;
      }

      function resolveImageViewerScopeForElement(element) {
        if (!element) {
          return { key: IMAGE_VIEWER_DEFAULT_CONTEXT_KEY, container: null };
        }
        const floatingNote = element.closest('.floating-note');
        if (floatingNote) {
          const noteId = floatingNote.dataset.noteId || floatingNote.id || 'floating';
          const body = floatingNote.querySelector('.floating-note-body') || floatingNote;
          return { key: buildViewerContextKey('floating', noteId), container: body };
        }
        const noteContainer = element.closest('[data-note-id]');
        if (noteContainer) {
          const noteId = noteContainer.dataset.noteId || noteContainer.id || 'note';
          const body = noteContainer.querySelector('.note-body') || noteContainer;
          return { key: buildViewerContextKey('note', noteId), container: body };
        }
        const page = element.closest('.page, .magic-page');
        if (page) {
          const pageKey = page.dataset.topicId || page.dataset.sectionId || page.id || 'page';
          return { key: buildViewerContextKey('page', pageKey), container: page };
        }
        const fallbackContainer = element.closest('.page-content, main, body') || document.body;
        return { key: IMAGE_VIEWER_DEFAULT_CONTEXT_KEY, container: fallbackContainer };
      }

      function createExternalEntryFromImage(img, contextKey, index) {
        if (!(img instanceof HTMLImageElement)) {
          return null;
        }
        const src = img.currentSrc || img.src;
        if (!src) {
          return null;
        }
        const alt = (img.getAttribute('alt') || '').trim();
        const title = (img.getAttribute('title') || '').trim();
        const name = alt || title || 'Imagen';
        const width = Number.isFinite(img.naturalWidth) && img.naturalWidth > 0 ? img.naturalWidth : null;
        const height = Number.isFinite(img.naturalHeight) && img.naturalHeight > 0 ? img.naturalHeight : null;
        let type = '';
        if (img.dataset && typeof img.dataset.mimeType === 'string' && img.dataset.mimeType) {
          type = img.dataset.mimeType;
        } else if (src.startsWith('data:image/')) {
          const match = src.slice(0, 32).match(/^data:image\/([^;]+)/i);
          if (match && match[1]) {
            type = `image/${match[1]}`;
          }
        }
        return {
          runtimeId: `external:${contextKey}:${index}`,
          id: `external:${contextKey}:${index}`,
          src,
          dataUrl: src.startsWith('data:') ? src : '',
          name,
          alt: name,
          width,
          height,
          size: null,
          type,
          source: 'document',
          element: img
        };
      }

      function buildExternalImagesForScope(scope, anchorImage) {
        const contextKey = scope?.key || IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
        const container = scope?.container;
        const nodes = container ? Array.from(container.querySelectorAll('img')) : [];
        const entries = [];
        nodes.forEach((img, index) => {
          const entry = createExternalEntryFromImage(img, contextKey, index);
          if (entry) {
            entries.push(entry);
          }
        });
        if (!entries.length && anchorImage instanceof HTMLImageElement) {
          const fallback = createExternalEntryFromImage(anchorImage, contextKey, 0);
          if (fallback) {
            entries.push(fallback);
          }
        }
        return entries;
      }

      function previewImageFromElement(imgElement) {
        if (!imgElement) {
          return;
        }
        hideImageToolbar();
        const scope = resolveImageViewerScopeForElement(imgElement);
        const externalImages = buildExternalImagesForScope(scope, imgElement);
        const selection = externalImages.find(entry => entry.element === imgElement)
          || externalImages.find(entry => entry.src === (imgElement.currentSrc || imgElement.src));
        const selectedRuntimeId = selection ? selection.runtimeId : (externalImages[0]?.runtimeId || null);
        const wasOpen = imageViewerPanel?.classList.contains('open');
        imageViewerPreviewSource = null;
        imageViewerCurrentToken = null;
        activateImageViewerContext(scope.key, {
          externalImages,
          selectedRuntimeId,
          rerender: false
        });
        if (selectedRuntimeId) {
          imageViewerRuntimeSelectionId = selectedRuntimeId;
        }
        if (wasOpen) {
          renderImageViewer();
        }
        openImageViewer();
      }

      function stepImageViewerSelection(direction) {
        const combined = getImageViewerCombinedImages();
        if (combined.length <= 1) {
          return;
        }
        const normalizedDirection = direction >= 0 ? 1 : -1;
        const currentId = imageViewerRuntimeSelectionId;
        let currentIndex = combined.findIndex(item => item.runtimeId === currentId);
        if (currentIndex === -1) {
          const { context } = getActiveImageViewerContext();
          if (context.selectedImageId) {
            currentIndex = combined.findIndex(item => item.source === 'library' && item.id === context.selectedImageId);
          }
        }
        if (currentIndex === -1) {
          currentIndex = 0;
        }
        let nextIndex = currentIndex + normalizedDirection;
        if (nextIndex < 0) {
          nextIndex = combined.length - 1;
        } else if (nextIndex >= combined.length) {
          nextIndex = 0;
        }
        const next = combined[nextIndex];
        if (!next) {
          return;
        }
        if (next.source === 'library') {
          imageViewerRuntimeSelectionId = next.runtimeId;
          clearImageViewerPreview();
          updateImageViewerContext(getActiveImageViewerContextKey(), ctx => ({
            images: ctx.images,
            selectedImageId: next.id,
            notesById: ctx.notesById
          }));
        } else {
          imageViewerRuntimeSelectionId = next.runtimeId;
          clearImageViewerPreview();
          renderImageViewer();
        }
      }

      function handleImageViewerWheelZoom(event) {
        if (!event || (!event.metaKey && !event.ctrlKey)) {
          return;
        }
        if (!getActiveViewerImage()) {
          return;
        }
        event.preventDefault();
        const delta = event.deltaY || 0;
        if (!delta) {
          return;
        }
        const magnitude = Math.min(3, Math.max(1, Math.abs(delta) / 180));
        const step = IMAGE_VIEWER_ZOOM_STEP * 0.5 * magnitude;
        adjustImageViewerZoom(delta > 0 ? -step : step);
      }

      function handleImageViewerSelect(event) {
        const button = event.target.closest('.image-viewer-thumb');
        if (!button || !imageViewerGallery?.contains(button)) {
          return;
        }
        event.preventDefault();
        const source = button.dataset.source || 'library';
        const id = button.dataset.imageId || '';
        const runtimeId = button.dataset.runtimeId || '';
        const resolvedRuntimeId = runtimeId || (source === 'library' && id ? `library:${id}` : id);
        if (!resolvedRuntimeId && !id) {
          return;
        }
        const { context } = getActiveImageViewerContext();
        if (source === 'library') {
          if (!id) {
            return;
          }
          if (context.selectedImageId === id && imageViewerRuntimeSelectionId === resolvedRuntimeId) {
            return;
          }
        } else if (imageViewerRuntimeSelectionId === resolvedRuntimeId) {
          return;
        }
        clearImageViewerPreview();
        imageViewerCurrentToken = null;
        imageViewerRuntimeSelectionId = resolvedRuntimeId;
        if (source === 'library') {
          updateImageViewerContext(getActiveImageViewerContextKey(), ctx => ({
            images: ctx.images,
            selectedImageId: id,
            notesById: ctx.notesById
          }));
        } else {
          renderImageViewer();
        }
      }

      function handleImageViewerNotesInput() {
        if (!imageViewerNotes) {
          return;
        }
        const targetId = imageViewerNotes.dataset.imageId;
        if (!targetId) {
          return;
        }
        const value = imageViewerNotes.value;
        const fallbackId = imageViewerNotes.dataset.fallbackId || '';
        if (imageViewerNotesSaveTimer) {
          clearTimeout(imageViewerNotesSaveTimer);
        }
        imageViewerNotesSaveTimer = setTimeout(() => {
          updateImageViewerContext(getActiveImageViewerContextKey(), ctx => {
            const nextNotes = {
              ...ctx.notesById,
              [targetId]: value
            };
            if (fallbackId && fallbackId !== targetId && Object.prototype.hasOwnProperty.call(nextNotes, fallbackId)) {
              delete nextNotes[fallbackId];
            }
            return {
              images: ctx.images,
              selectedImageId: ctx.selectedImageId,
              notesById: nextNotes
            };
          }, { rerender: false });
        }, 250);
      }

      function updateZoom(delta) {
        applyZoom(currentZoom + delta);
      }

      applyDocumentShift();

      zoomInBtn?.addEventListener('click', () => updateZoom(0.1));
      zoomOutBtn?.addEventListener('click', () => updateZoom(-0.1));
      shiftLeftBtn?.addEventListener('click', () => adjustDocumentShift(-DOCUMENT_SHIFT_STEP));
      shiftRightBtn?.addEventListener('click', () => adjustDocumentShift(DOCUMENT_SHIFT_STEP));

      imageViewerState = loadImageViewerState();
      imageViewerContextKey = imageViewerState.activeContext || IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
      renderImageViewer();
      updateImageViewerZoomControls();

      Object.entries(imageViewerState.contexts || {}).forEach(([contextKey, contextValue]) => {
        (contextValue?.images || []).forEach(image => {
          if (!image || !image.dataUrl) {
            return;
          }
          if (Number.isFinite(image.width) && Number.isFinite(image.height)) {
            return;
          }
          computeImageDimensions(image.dataUrl)
            .then(dimensions => {
              if (!dimensions) {
                return;
              }
              updateImageViewerContext(contextKey, ctx => {
                if (!ctx.images.some(img => img.id === image.id)) {
                  return ctx;
                }
                return {
                  images: ctx.images.map(img => img.id === image.id ? { ...img, ...dimensions } : img),
                  selectedImageId: ctx.selectedImageId,
                  notesById: ctx.notesById
                };
              }, {
                rerender: contextKey === getActiveImageViewerContextKey()
              });
            })
            .catch(() => {});
        });
      });

      if (imageViewerActiveImage) {
        imageViewerActiveImage.addEventListener('load', () => {
          applyImageViewerZoom();
          const width = Number.isFinite(imageViewerActiveImage.naturalWidth) ? imageViewerActiveImage.naturalWidth : null;
          const height = Number.isFinite(imageViewerActiveImage.naturalHeight) ? imageViewerActiveImage.naturalHeight : null;
          const active = getActiveViewerImage();
          if (!active) {
            updateImageViewerMetaDisplay(null);
            return;
          }
          if (active.source === 'library' && active.id) {
            if (Number.isFinite(width) || Number.isFinite(height)) {
              const contextKey = getActiveImageViewerContextKey();
              updateImageViewerContext(contextKey, ctx => {
                if (!ctx.images.some(img => img.id === active.id)) {
                  return ctx;
                }
                return {
                  images: ctx.images.map(img => img.id === active.id ? { ...img, width, height } : img),
                  selectedImageId: ctx.selectedImageId,
                  notesById: ctx.notesById
                };
              }, { rerender: false });
              const refreshedContext = imageViewerState.contexts?.[contextKey];
              const refreshedImage = refreshedContext?.images?.find(img => img.id === active.id);
              updateImageViewerMetaDisplay(refreshedImage ? { ...refreshedImage, width, height } : { width, height, size: 0 });
            } else {
              const { context } = getActiveImageViewerContext();
              const existing = context.images?.find(img => img.id === active.id) || null;
              updateImageViewerMetaDisplay(existing);
            }
          } else if (active.source === 'preview' && imageViewerPreviewSource) {
            imageViewerPreviewSource = {
              ...imageViewerPreviewSource,
              width: Number.isFinite(width) ? width : imageViewerPreviewSource.width,
              height: Number.isFinite(height) ? height : imageViewerPreviewSource.height
            };
            updateImageViewerMetaDisplay(imageViewerPreviewSource);
          }
        });
      }

      imageViewerBtn?.addEventListener('click', () => toggleImageViewer());
      imageViewerCloseBtn?.addEventListener('click', () => closeImageViewer());
      imageViewerAddImageBtn?.addEventListener('click', () => imageViewerUploadInput?.click());
      imageViewerDownloadBtn?.addEventListener('click', handleImageViewerDownload);
      imageViewerRemoveBtn?.addEventListener('click', handleImageViewerRemove);
      imageViewerGallery?.addEventListener('click', handleImageViewerSelect);
      imageViewerNotes?.addEventListener('input', handleImageViewerNotesInput);
      imageViewerUploadInput?.addEventListener('change', async (event) => {
        try {
          await handleImageViewerFiles(event.target?.files || []);
        } catch (error) {
          console.warn('No se pudieron cargar algunas imágenes:', error);
        } finally {
          if (imageViewerUploadInput) {
            imageViewerUploadInput.value = '';
          }
        }
      });
      imageViewerZoomOutBtn?.addEventListener('click', () => adjustImageViewerZoom(-IMAGE_VIEWER_ZOOM_STEP));
      imageViewerZoomInBtn?.addEventListener('click', () => adjustImageViewerZoom(IMAGE_VIEWER_ZOOM_STEP));
      imageViewerZoomResetBtn?.addEventListener('click', () => resetImageViewerZoom());
      imageViewerPrevBtn?.addEventListener('click', () => stepImageViewerSelection(-1));
      imageViewerNextBtn?.addEventListener('click', () => stepImageViewerSelection(1));
      imageViewerStageSurface?.addEventListener('wheel', handleImageViewerWheelZoom, { passive: false });

      window.addEventListener('resize', () => enforceImageViewerShift({ force: false }));
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && imageViewerPanel?.classList.contains('open')) {
          closeImageViewer();
        }
      });

      document.addEventListener('dblclick', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLImageElement)) {
          return;
        }
        if (target.closest('#imageViewerPanel') || target.closest('#imageToolbar') || target.closest('.topbar') || target.closest('.edit-toolbar')) {
          return;
        }
        previewImageFromElement(target);
      });

      /* === UTILIDADES === */
      function isNodeInDocument(node) {
        if (!node) {
          return false;
        }
        if (node.nodeType === Node.TEXT_NODE) {
          return !!node.parentNode && document.contains(node.parentNode);
        }
        return document.contains(node);
      }

      function resolveEditableAncestor(node) {
        if (!node) {
          return null;
        }
        const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (!element) {
          return null;
        }
        const editable = typeof element.closest === 'function'
          ? element.closest('[contenteditable="true"]')
          : null;
        if (editable) {
          return editable;
        }
        const page = element.closest('.page, .magic-page');
        if (page) {
          return page;
        }
        return null;
      }

      function clearSavedSelection() {
        savedSelection = null;
        pendingToolbarInsertionSnapshot = null;
      }

      function clearToolbarInsertionSnapshot() {
        pendingToolbarInsertionSnapshot = null;
      }

      function captureToolbarInsertionSnapshot() {
        const selection = window.getSelection();
        let snapshot = null;

        if (isSelectionWithinEditable(selection)) {
          snapshot = createSelectionSnapshot(selection);
        } else if (savedSelection) {
          snapshot = cloneSelectionSnapshot(savedSelection);
        }

        pendingToolbarInsertionSnapshot = snapshot ? cloneSelectionSnapshot(snapshot) : null;

        if (pendingToolbarInsertionSnapshot) {
          savedSelection = cloneSelectionSnapshot(pendingToolbarInsertionSnapshot);
          return true;
        }

        return false;
      }

      function primeToolbarInsertionSelection() {
        if (pendingToolbarInsertionSnapshot) {
          const snapshot = cloneSelectionSnapshot(pendingToolbarInsertionSnapshot);
          if (snapshot && restoreSelectionSnapshot(snapshot, { updateSnapshot: true })) {
            savedSelection = cloneSelectionSnapshot(snapshot);
            pendingToolbarInsertionSnapshot = cloneSelectionSnapshot(snapshot);
            return true;
          }
          pendingToolbarInsertionSnapshot = null;
        }

        if (restoreSelection()) {
          if (savedSelection) {
            pendingToolbarInsertionSnapshot = cloneSelectionSnapshot(savedSelection);
          }
          return true;
        }

        return false;
      }

      function createSelectionSnapshot(selection) {
        if (!selection || selection.rangeCount === 0) {
          return null;
        }

        const range = selection.getRangeAt(0).cloneRange();
        const activeEditable = document.activeElement && document.activeElement.isContentEditable
          ? document.activeElement
          : null;
        const fallbackAncestor = resolveEditableAncestor(range.commonAncestorContainer) || resolveEditableAncestor(range.startContainer) || resolveEditableAncestor(range.endContainer);
        const focusTarget = activeEditable || fallbackAncestor;
        const pageTarget = focusTarget && typeof focusTarget.closest === 'function'
          ? focusTarget.closest('.page, .magic-page') || focusTarget
          : fallbackAncestor;

        return {
          range,
          focusTarget: focusTarget || pageTarget || null,
          pageTarget: pageTarget || null
        };
      }

      function cloneSelectionSnapshot(snapshot) {
        if (!snapshot || !snapshot.range) {
          return null;
        }

        return {
          range: snapshot.range.cloneRange(),
          focusTarget: snapshot.focusTarget && document.contains(snapshot.focusTarget)
            ? snapshot.focusTarget
            : null,
          pageTarget: snapshot.pageTarget && document.contains(snapshot.pageTarget)
            ? snapshot.pageTarget
            : null
        };
      }

      function restoreSelectionSnapshot(snapshot, options = {}) {
        if (!snapshot || !snapshot.range) {
          return false;
        }

        const { range, focusTarget, pageTarget } = snapshot;
        if (!isNodeInDocument(range.startContainer) || !isNodeInDocument(range.endContainer)) {
          return false;
        }

        const selection = window.getSelection();
        selection.removeAllRanges();

        const restoredRange = range.cloneRange();

        let focusElement = null;
        if (focusTarget && document.contains(focusTarget)) {
          focusElement = focusTarget;
        } else if (pageTarget && document.contains(pageTarget)) {
          focusElement = pageTarget;
        } else {
          focusElement = resolveEditableAncestor(restoredRange.commonAncestorContainer) || resolveEditableAncestor(restoredRange.startContainer) || resolveEditableAncestor(restoredRange.endContainer);
        }

        if (focusElement && typeof focusElement.focus === 'function') {
          try {
            focusElement.focus({ preventScroll: true });
          } catch (err) {
            focusElement.focus();
          }
        }

        try {
          selection.addRange(restoredRange);
          if (options.updateSnapshot) {
            snapshot.range = restoredRange.cloneRange();
          }
          return true;
        } catch (err) {
          return false;
        }
      }

      function saveCurrentSelection(options = {}) {
        const { keepWhenEmpty = false } = options;
        const selection = window.getSelection();

        if (!isSelectionWithinEditable(selection)) {
          if (!keepWhenEmpty) {
            clearSavedSelection();
          }
          return false;
        }

        const snapshot = createSelectionSnapshot(selection);
        if (!snapshot) {
          if (!keepWhenEmpty) {
            clearSavedSelection();
          }
          return false;
        }

        savedSelection = snapshot;
        return true;
      }

      function restoreSelection() {
        if (!savedSelection) {
          clearSavedSelection();
          return false;
        }

        if (!restoreSelectionSnapshot(savedSelection, { updateSnapshot: true })) {
          clearSavedSelection();
          return false;
        }

        return true;
      }

      function captureIconPickerSelectionSnapshot() {
        let selection = window.getSelection();

        if ((!selection || selection.rangeCount === 0) && savedSelection && savedSelection.range) {
          restoreSelectionSnapshot(savedSelection, { updateSnapshot: false });
          selection = window.getSelection();
        }

        let snapshot = createSelectionSnapshot(selection);
        if (!snapshot && savedSelection) {
          snapshot = cloneSelectionSnapshot(savedSelection);
        }

        iconPickerSelectionSnapshot = snapshot;
        return !!iconPickerSelectionSnapshot;
      }

      function clearIconPickerSelectionSnapshot() {
        iconPickerSelectionSnapshot = null;
      }

      function ensureEditableSelection() {
        if (restoreSelection()) {
          const restored = window.getSelection();
          if (restored.rangeCount > 0) {
            return restored;
          }
        }

        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          return selection;
        }

        const activeEditable = document.activeElement && document.activeElement.isContentEditable
          ? document.activeElement
          : null;
        const preferredMagic = getCurrentMagicPage();
        const target = activeEditable || preferredMagic || getCurrentPage();
        if (!target) return null;

        const range = document.createRange();
        range.selectNodeContents(target);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        return selection;
      }

      function isSelectionWithinEditable(selection) {
        if (!selection || selection.rangeCount === 0) {
          return false;
        }
        const range = selection.getRangeAt(0);
        const startEditable = resolveEditableAncestor(range.startContainer);
        const endEditable = resolveEditableAncestor(range.endContainer);
        return !!startEditable && !!endEditable;
      }

      function resolveSelectionForInsertion() {
        if (restoreSelection()) {
          const restored = window.getSelection();
          if (isSelectionWithinEditable(restored)) {
            return restored;
          }
        }
        const liveSelection = window.getSelection();
        if (isSelectionWithinEditable(liveSelection)) {
          return liveSelection;
        }
        return null;
      }

      function insertNodeAtSelection(node) {
        const selection = resolveSelectionForInsertion();
        if (!selection || !selection.rangeCount) return null;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(node);
        range.setStartAfter(node);
        range.setEndAfter(node);
        selection.removeAllRanges();
        selection.addRange(range);
        clearSavedSelection();
        return node;
      }

      function insertHtmlAtSelection(html) {
        const selection = resolveSelectionForInsertion();
        if (!selection || !selection.rangeCount) return null;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const fragment = range.createContextualFragment(html);
        const nodes = Array.from(fragment.childNodes);
        range.insertNode(fragment);
        const lastNode = nodes[nodes.length - 1];
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.setEndAfter(lastNode);
        }
        selection.removeAllRanges();
        selection.addRange(range);
        clearSavedSelection();
        return nodes[0] || null;
      }

      function getRangeContextElement(range) {
        if (!range) {
          return null;
        }
        let node = range.startContainer;
        if (node && node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }
        if (node instanceof HTMLElement) {
          return node;
        }
        const ancestor = range.commonAncestorContainer;
        if (ancestor instanceof HTMLElement) {
          return ancestor;
        }
        return resolveEditableAncestor(range.startContainer) || resolveEditableAncestor(range.endContainer);
      }

      function insertTextAtSelection(text, options = {}) {
        if (typeof text !== 'string' || !text) {
          return null;
        }

        const {
          selectionOverride = null,
          preserveContextStyle = false
        } = options;

        let selection = selectionOverride;
        if (selection && (!selection.rangeCount || !isSelectionWithinEditable(selection))) {
          selection = null;
        }

        if (!selection) {
          selection = resolveSelectionForInsertion();
        }

        if (!selection || !selection.rangeCount) {
          return null;
        }

        const range = selection.getRangeAt(0);
        const contextElement = preserveContextStyle ? getRangeContextElement(range) : null;
        range.deleteContents();

        let insertedNode = null;
        if (contextElement && preserveContextStyle) {
          try {
            const computed = window.getComputedStyle(contextElement);
            const fontSize = (computed && computed.fontSize) ? computed.fontSize : '';
            if (fontSize && fontSize !== 'auto') {
              const span = document.createElement('span');
              span.textContent = text;
              span.style.fontSize = fontSize;
              span.style.lineHeight = 'inherit';
              span.style.fontFamily = 'inherit';
              span.style.display = 'inline';
              insertedNode = span;
            }
          } catch (err) {
            insertedNode = null;
          }
        }

        if (!insertedNode) {
          insertedNode = document.createTextNode(text);
        }

        range.insertNode(insertedNode);
        range.setStartAfter(insertedNode);
        range.setEndAfter(insertedNode);
        selection.removeAllRanges();
        selection.addRange(range);
        clearSavedSelection();
        return insertedNode;
      }

      document.addEventListener('selectionchange', () => {
        if (!isEditMode) {
          return;
        }
        const selection = window.getSelection();
        if (!isSelectionWithinEditable(selection)) {
          return;
        }
        saveCurrentSelection();
      });

      const FONT_SCALE_FACTOR = 1.1;
      const FONT_MIN_SIZE = 8;
      const FONT_MAX_SIZE = 96;

      function clampFontSize(value) {
        if (!Number.isFinite(value)) {
          return FONT_MIN_SIZE;
        }
        return Math.min(FONT_MAX_SIZE, Math.max(FONT_MIN_SIZE, value));
      }

      function getFontSizeFromElement(element) {
        if (!element) {
          return 16;
        }
        const computed = window.getComputedStyle(element);
        const parsed = parseFloat(computed.fontSize);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
        return 16;
      }

      function adjustFontSizeProportionally(direction) {
        const selection = resolveSelectionForInsertion();
        if (!selection || selection.rangeCount === 0) {
          alert('Selecciona el texto que deseas modificar');
          return false;
        }

        const range = selection.getRangeAt(0);
        if (!range) {
          return false;
        }

        const factor = direction === 'decrease' ? (1 / FONT_SCALE_FACTOR) : FONT_SCALE_FACTOR;

        if (selection.isCollapsed) {
          alert('Selecciona el texto que deseas modificar');
          return false;
        }

        const contextElement = getRangeContextElement(range);
        const currentSize = getFontSizeFromElement(contextElement);
        const newSize = clampFontSize(currentSize * factor);
        const wrapper = document.createElement('span');
        wrapper.style.fontSize = `${newSize}px`;
        wrapper.style.lineHeight = 'inherit';
        wrapper.style.display = 'inline';

        try {
          range.surroundContents(wrapper);
        } catch (err) {
          const fragment = range.extractContents();
          wrapper.appendChild(fragment);
          range.insertNode(wrapper);
        }

        const updatedRange = document.createRange();
        updatedRange.selectNodeContents(wrapper);
        selection.removeAllRanges();
        selection.addRange(updatedRange);
        clearSavedSelection();
        return true;
      }

      function normalizeColorToHex(color, fallback = '#ffffff') {
        if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)' || color === 'none') {
          return fallback;
        }
        if (color.startsWith('#')) {
          if (color.length === 4) {
            return '#' + color.slice(1).split('').map(ch => ch + ch).join('');
          }
          return color;
        }
        const rgbMatch = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (rgbMatch) {
          return '#' + rgbMatch.slice(1, 4).map(value => {
            const hex = parseInt(value, 10).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          }).join('');
        }
        const temp = document.createElement('div');
        temp.style.color = color;
        document.body.appendChild(temp);
        const computed = window.getComputedStyle(temp).color;
        document.body.removeChild(temp);
        if (computed === color) {
          return fallback;
        }
        return normalizeColorToHex(computed, fallback);
      }

      function normalizeColorValue(value) {
        if (!value) {
          return '';
        }
        try {
          return normalizeColorToHex(value, value).toLowerCase();
        } catch (err) {
          return String(value).trim().toLowerCase();
        }
      }

      function resolveBooleanFlag(value, defaultValue = false) {
        if (value === true || value === 'true') {
          return true;
        }
        if (value === false || value === 'false') {
          return false;
        }
        return defaultValue;
      }

      function parsePxValue(value, fallback = 0) {
        if (!value) return fallback;
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
      }

      function clearNoteStyleClasses(target) {
        if (!target || !target.classList) return;
        NOTE_STYLE_CLASSES.forEach(cls => target.classList.remove(cls));
        target.classList.remove('pearl');
      }

      function markNoteStyleAsCustom(block, target) {
        if (!block || !target) return;
        clearNoteStyleClasses(target);
        block.dataset.noteStyle = 'custom';
      }

      function getAppliedNoteStyle(block, target) {
        if (!block || !target || !target.classList?.contains('box')) {
          return 'custom';
        }
        const stored = block.dataset.noteStyle;
        if (stored && noteStylePresetMap.has(stored)) {
          return stored;
        }
        const matched = NOTE_STYLE_CLASSES.find(cls => target.classList.contains(cls));
        if (matched) {
          const preset = noteStylePresets.find(p => p.className === matched);
          if (preset) {
            block.dataset.noteStyle = preset.id;
            (preset.extraClasses || []).forEach(cls => target.classList.add(cls));
            return preset.id;
          }
        }
        return 'custom';
      }

      function applyNoteStyle(block, styleId, options = {}) {
        if (!block) return;
        const target = getTemplateTarget(block);
        if (!target || !target.classList?.contains('box')) return;
        const { skipToolbarSync = false } = options;

        if (styleId === 'custom' || !noteStylePresetMap.has(styleId)) {
          markNoteStyleAsCustom(block, target);
        } else {
          const preset = noteStylePresetMap.get(styleId);
          clearNoteStyleClasses(target);
          if (preset?.className) {
            target.classList.add(preset.className);
          }
          (preset?.extraClasses || []).forEach(cls => target.classList.add(cls));
          block.dataset.noteStyle = preset?.id || 'custom';
        }

        if (!skipToolbarSync) {
          updateTemplateToolbarState(block);
          repositionTemplateToolbar();
        }
      }

      function normalizeTemplateDataValue(value) {
        if (value === undefined || value === null) return null;
        const str = String(value);
        return str.trim() === '' ? null : str;
      }

      function readSerializedNoteStyle(block, target = getTemplateTarget(block)) {
        if (!block) return 'custom';
        const stored = block.dataset.noteStyle;
        if (stored && noteStylePresetMap.has(stored)) {
          return stored;
        }
        if (!target || !target.classList?.contains('box')) {
          return stored || 'custom';
        }
        const matched = NOTE_STYLE_CLASSES.find(cls => target.classList.contains(cls));
        if (matched) {
          const preset = noteStylePresets.find(p => p.className === matched);
          if (preset?.id) {
            return preset.id;
          }
        }
        return stored || 'custom';
      }

      function serializeTemplateBlocks(page) {
        if (!page) return [];
        return Array.from(page.querySelectorAll('.template-block')).map((block, index) => {
          const target = getTemplateTarget(block);
          const isNote = !!(target && target.classList && target.classList.contains('box'));
          return {
            index,
            isNote,
            noteStyle: readSerializedNoteStyle(block, target),
            fontScale: normalizeTemplateDataValue(block.dataset.fontScale),
            marginTop: normalizeTemplateDataValue(block.dataset.marginTop),
            marginBottom: normalizeTemplateDataValue(block.dataset.marginBottom),
            bgColor: normalizeTemplateDataValue(block.dataset.bgColor),
            textColor: normalizeTemplateDataValue(block.dataset.textColor),
            borderColor: isNote ? normalizeTemplateDataValue(block.dataset.borderColor) : null,
            accentColor: isNote ? normalizeTemplateDataValue(block.dataset.accentColor) : null,
            borderWidth: isNote ? normalizeTemplateDataValue(block.dataset.borderWidth) : null,
            borderAccentExtra: isNote ? normalizeTemplateDataValue(block.dataset.borderAccentExtra) : null
          };
        });
      }

      function restoreTemplateBlocks(page, serializedBlocks) {
        if (!page || !Array.isArray(serializedBlocks) || !serializedBlocks.length) return;
        const blocks = Array.from(page.querySelectorAll('.template-block'));

        serializedBlocks.forEach(state => {
          if (!state || typeof state.index !== 'number') return;
          const block = blocks[state.index];
          if (!block) return;

          const target = getTemplateTarget(block);
          const isNote = !!(state.isNote && target && target.classList && target.classList.contains('box'));

          if (state.fontScale !== undefined) {
            if (state.fontScale !== null) {
              block.dataset.fontScale = state.fontScale;
              block.style.fontSize = state.fontScale === '100' ? '' : state.fontScale + '%';
            } else {
              delete block.dataset.fontScale;
              block.style.fontSize = '';
            }
          }

          if (state.marginTop !== undefined) {
            if (state.marginTop !== null) {
              block.dataset.marginTop = state.marginTop;
              const topValue = parseInt(state.marginTop, 10) || 0;
              block.style.marginTop = topValue + 'px';
            } else {
              delete block.dataset.marginTop;
              block.style.marginTop = '';
            }
          }

          if (state.marginBottom !== undefined) {
            if (state.marginBottom !== null) {
              block.dataset.marginBottom = state.marginBottom;
              const bottomValue = parseInt(state.marginBottom, 10) || 0;
              block.style.marginBottom = bottomValue + 'px';
            } else {
              delete block.dataset.marginBottom;
              block.style.marginBottom = '';
            }
          }

          if (target) {
            if (state.bgColor !== undefined) {
              if (state.bgColor !== null) {
                block.dataset.bgColor = state.bgColor;
                target.style.background = state.bgColor;
              } else {
                delete block.dataset.bgColor;
                target.style.background = '';
              }
            }

            if (state.textColor !== undefined) {
              if (state.textColor !== null) {
                block.dataset.textColor = state.textColor;
                target.style.color = state.textColor;
              } else {
                delete block.dataset.textColor;
                target.style.color = '';
              }
            }
          }

          if (isNote && target) {
            if (state.noteStyle === 'custom') {
              markNoteStyleAsCustom(block, target);
            } else if (state.noteStyle && noteStylePresetMap.has(state.noteStyle)) {
              applyNoteStyle(block, state.noteStyle, { skipToolbarSync: true });
            }

            if (state.borderColor !== undefined) {
              if (state.borderColor !== null) {
                block.dataset.borderColor = state.borderColor;
                target.style.borderColor = state.borderColor;
                target.style.borderTopColor = state.borderColor;
                target.style.borderRightColor = state.borderColor;
                target.style.borderBottomColor = state.borderColor;
                if (!state.accentColor) {
                  target.style.borderLeftColor = state.borderColor;
                }
              } else {
                delete block.dataset.borderColor;
                target.style.borderColor = '';
              }
            }

            if (state.accentColor !== undefined) {
              if (state.accentColor !== null) {
                block.dataset.accentColor = state.accentColor;
                target.style.borderLeftColor = state.accentColor;
              } else {
                delete block.dataset.accentColor;
                if (state.borderColor && state.borderColor !== null) {
                  target.style.borderLeftColor = state.borderColor;
                } else {
                  target.style.borderLeftColor = '';
                }
              }
            }

            if (state.borderWidth !== undefined || state.borderAccentExtra !== undefined) {
              const widthValue = state.borderWidth !== null && state.borderWidth !== undefined
                ? Math.max(0, parseInt(state.borderWidth, 10) || 0)
                : null;
              const accentValue = state.borderAccentExtra !== null && state.borderAccentExtra !== undefined
                ? Math.max(0, parseInt(state.borderAccentExtra, 10) || 0)
                : 0;

              if (widthValue === null) {
                delete block.dataset.borderWidth;
                delete block.dataset.borderAccentExtra;
                target.style.borderWidth = '';
                target.style.borderLeftWidth = '';
                target.style.borderStyle = '';
              } else {
                updateBorderWidthDataset(block, widthValue, accentValue);
                if (widthValue <= 0) {
                  target.style.borderStyle = 'none';
                  target.style.borderWidth = '0';
                } else {
                  target.style.borderStyle = 'solid';
                  target.style.borderWidth = widthValue + 'px';
                }
                const leftWidth = Math.max(0, widthValue) + Math.max(0, accentValue);
                target.style.borderLeftWidth = leftWidth > 0 ? leftWidth + 'px' : '0';
              }
            }
          } else if (state.noteStyle) {
            block.dataset.noteStyle = state.noteStyle;
          }
        });
      }

      function insertNoteSpacer(position) {
        if (!selectedTemplateBlock) return;
        const block = selectedTemplateBlock;
        const parent = block.parentElement;
        if (!parent) return;
        const spacer = document.createElement('p');
        spacer.className = 'note-spacer';
        spacer.innerHTML = '<br>';
        if (position === 'before') {
          parent.insertBefore(spacer, block);
        } else {
          parent.insertBefore(spacer, block.nextSibling);
        }
      }

      function createTemplateBlock(template) {
        if (!template) return null;
        const block = document.createElement('div');
        block.className = 'template-block';
        block.dataset.templateBlock = 'true';
        if (template.name) {
          block.dataset.templateName = template.name;
        }
        block.dataset.fontScale = '100';
        block.setAttribute('tabindex', '0');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = template.html;
        while (wrapper.firstChild) {
          block.appendChild(wrapper.firstChild);
        }
        if (template.noteStyle) {
          applyNoteStyle(block, template.noteStyle, { skipToolbarSync: true });
        }
        return block;
      }

      function getTemplateTarget(block) {
        if (!block) return null;
        if (block.classList && block.classList.contains('box')) return block;
        return block.querySelector('.box') || block;
      }

      function setPaletteActive(container, value) {
        if (!container) return;
        const normalized = normalizeColorToHex(value || '', '').toLowerCase();
        container.querySelectorAll('.template-color-swatch').forEach(swatch => {
          const swatchValue = normalizeColorToHex(swatch.dataset.value || '', '').toLowerCase();
          swatch.classList.toggle('active', normalized && swatchValue === normalized);
        });
      }

      function updateBorderWidthDataset(block, baseWidth, accentExtra) {
        if (!block) return;
        if (Number.isFinite(baseWidth)) {
          block.dataset.borderWidth = String(baseWidth);
        }
        if (Number.isFinite(accentExtra)) {
          block.dataset.borderAccentExtra = String(accentExtra);
        }
      }

      function createCollapseCardElement() {
        const card = document.createElement('div');
        card.className = 'collapse-card';
        card.innerHTML = `
          <div class="collapse-card-header">
            <span class="collapse-card-title">Título de la tarjeta</span>
            <button type="button" class="collapse-card-toggle" aria-expanded="true"></button>
          </div>
          <div class="collapse-card-body">
            <p>Contenido de la tarjeta colapsable.</p>
          </div>
        `;
        return card;
      }

      function initializeCollapseCards(root) {
        if (!root) return;
        const cards = root.classList && root.classList.contains('collapse-card')
          ? [root]
          : Array.from(root.querySelectorAll('.collapse-card'));
        cards.forEach(card => {
          const toggle = card.querySelector('.collapse-card-toggle');
          if (toggle) {
            toggle.type = 'button';
            toggle.setAttribute('aria-expanded', card.classList.contains('collapsed') ? 'false' : 'true');
          }
          const title = card.querySelector('.collapse-card-title');
          if (title) {
            title.setAttribute('contenteditable', 'true');
          }
        });
      }

      function initPalette(container, colors, onSelect) {
        if (!container) return;
        container.innerHTML = '';
        colors.forEach(color => {
          const swatch = document.createElement('button');
          swatch.type = 'button';
          swatch.className = 'template-color-swatch';
          swatch.style.setProperty('--swatch-color', color);
          swatch.dataset.value = color;
          swatch.addEventListener('click', () => onSelect(color));
          container.appendChild(swatch);
        });
      }

      function applyTemplateBackground(color) {
        if (!selectedTemplateBlock) return;
        const target = getTemplateTarget(selectedTemplateBlock);
        if (!target) return;
        if (!color || color === 'transparent') {
          target.style.backgroundColor = 'transparent';
          delete selectedTemplateBlock.dataset.bgColor;
          if (templateBgColorInput) {
            templateBgColorInput.value = '#ffffff';
          }
          setPaletteActive(templateBgPalette, '');
        } else {
          target.style.backgroundColor = color;
          selectedTemplateBlock.dataset.bgColor = color;
          if (templateBgColorInput) {
            templateBgColorInput.value = normalizeColorToHex(color, '#ffffff');
          }
          setPaletteActive(templateBgPalette, color);
        }
        if (target.classList.contains('box')) {
          markNoteStyleAsCustom(selectedTemplateBlock, target);
          if (templateNoteStyleSelect) {
            templateNoteStyleSelect.value = 'custom';
          }
        }
        repositionTemplateToolbar();
      }

      function applyTemplateTextColor(color) {
        if (!selectedTemplateBlock) return;
        const target = getTemplateTarget(selectedTemplateBlock);
        if (!target) return;
        if (!color) {
          target.style.color = '';
          delete selectedTemplateBlock.dataset.textColor;
          if (templateTextColorInput) {
            templateTextColorInput.value = '#212529';
          }
          setPaletteActive(templateTextPalette, '');
        } else {
          target.style.color = color;
          selectedTemplateBlock.dataset.textColor = color;
          if (templateTextColorInput) {
            templateTextColorInput.value = normalizeColorToHex(color, '#212529');
          }
          setPaletteActive(templateTextPalette, color);
        }
        if (target.classList.contains('box')) {
          markNoteStyleAsCustom(selectedTemplateBlock, target);
          if (templateNoteStyleSelect) {
            templateNoteStyleSelect.value = 'custom';
          }
        }
      }

      function applyTemplateBorderColor(color) {
        if (!selectedTemplateBlock) return;
        const target = getTemplateTarget(selectedTemplateBlock);
        if (!target || !target.classList.contains('box')) return;
        const normalized = color || '#ced4da';
        target.style.borderStyle = 'solid';
        target.style.borderColor = normalized;
        selectedTemplateBlock.dataset.borderColor = normalized;
        if (templateBorderColorInput) {
          templateBorderColorInput.value = normalizeColorToHex(normalized, '#ced4da');
        }
        setPaletteActive(templateBorderPalette, normalized);
        if (selectedTemplateBlock.dataset.accentColor) {
          target.style.borderLeftColor = selectedTemplateBlock.dataset.accentColor;
        }
        updateTemplateToolbarState(selectedTemplateBlock);
        markNoteStyleAsCustom(selectedTemplateBlock, target);
        if (templateNoteStyleSelect) {
          templateNoteStyleSelect.value = 'custom';
        }
      }

      function applyTemplateAccentColor(color) {
        if (!selectedTemplateBlock) return;
        const target = getTemplateTarget(selectedTemplateBlock);
        if (!target || !target.classList.contains('box')) return;
        const normalized = color || selectedTemplateBlock.dataset.borderColor || '#0d6efd';
        target.style.borderLeftColor = normalized;
        selectedTemplateBlock.dataset.accentColor = normalized;
        if (templateAccentColorInput) {
          templateAccentColorInput.value = normalizeColorToHex(normalized, '#0d6efd');
        }
        setPaletteActive(templateAccentPalette, normalized);
        updateTemplateToolbarState(selectedTemplateBlock);
        markNoteStyleAsCustom(selectedTemplateBlock, target);
        if (templateNoteStyleSelect) {
          templateNoteStyleSelect.value = 'custom';
        }
      }

      function updateTemplateToolbarState(block) {
        if (!block || !templateToolbar) return;
        const target = getTemplateTarget(block);
        const computed = window.getComputedStyle(target || block);
        const isNote = target && target.classList && target.classList.contains('box');

        if (templateNoteStyleRow) {
          templateNoteStyleRow.style.display = isNote ? 'flex' : 'none';
        }

        if (templateSpacingRow) {
          templateSpacingRow.style.display = isNote ? 'flex' : 'none';
        }

        if (templateNoteStyleSelect) {
          templateNoteStyleSelect.value = isNote ? getAppliedNoteStyle(block, target) : 'custom';
        }

        if (templateBgColorInput) {
          const bgValue = block.dataset.bgColor || target?.style.backgroundColor || computed.backgroundColor;
          const normalizedBg = bgValue === 'transparent' ? '#ffffff' : normalizeColorToHex(bgValue, '#ffffff');
          templateBgColorInput.value = normalizedBg;
          setPaletteActive(templateBgPalette, bgValue === 'transparent' ? '' : normalizedBg);
        }

        if (templateTextColorInput) {
          const textValue = block.dataset.textColor || target?.style.color || computed.color;
          const normalizedText = normalizeColorToHex(textValue, '#212529');
          templateTextColorInput.value = normalizedText;
          setPaletteActive(templateTextPalette, normalizedText);
        }

        if (templateFontSizeSlider && templateFontSizeDisplay) {
          const fontScale = parseInt(block.dataset.fontScale || '100', 10) || 100;
          templateFontSizeSlider.value = fontScale;
          templateFontSizeDisplay.textContent = fontScale + '%';
        }

        if (templateMarginTopSlider && templateMarginTopDisplay) {
          const topMax = parseInt(templateMarginTopSlider.max || '120', 10);
          let marginTop = block.dataset.marginTop !== undefined
            ? parseInt(block.dataset.marginTop, 10)
            : parsePxValue(block.style.marginTop || computed.marginTop, 0);
          marginTop = Number.isFinite(marginTop) ? Math.max(0, Math.min(topMax, marginTop)) : 0;
          templateMarginTopSlider.value = marginTop;
          templateMarginTopDisplay.textContent = marginTop + 'px';
        }

        if (templateMarginBottomSlider && templateMarginBottomDisplay) {
          const bottomMax = parseInt(templateMarginBottomSlider.max || '120', 10);
          let marginBottom = block.dataset.marginBottom !== undefined
            ? parseInt(block.dataset.marginBottom, 10)
            : parsePxValue(block.style.marginBottom || computed.marginBottom, 0);
          marginBottom = Number.isFinite(marginBottom) ? Math.max(0, Math.min(bottomMax, marginBottom)) : 0;
          templateMarginBottomSlider.value = marginBottom;
          templateMarginBottomDisplay.textContent = marginBottom + 'px';
        }

        if (templateBorderWidthSlider && templateBorderWidthDisplay) {
          if (!isNote) {
            templateBorderWidthSlider.disabled = true;
            templateBorderWidthDisplay.textContent = '—';
          } else {
            templateBorderWidthSlider.disabled = false;
            const sliderMax = parseInt(templateBorderWidthSlider.max || '12', 10);
            const sliderMin = parseInt(templateBorderWidthSlider.min || '0', 10);
            const storedWidth = block.dataset.borderWidth !== undefined ? parseInt(block.dataset.borderWidth, 10) : null;
            const baseWidth = Number.isFinite(storedWidth)
              ? storedWidth
              : parsePxValue(target.style.borderTopWidth || computed.borderTopWidth, 1);
            const leftWidth = parsePxValue(target.style.borderLeftWidth || computed.borderLeftWidth, baseWidth);
            const accentExtraStored = block.dataset.borderAccentExtra !== undefined ? parseInt(block.dataset.borderAccentExtra, 10) : null;
            const accentExtra = Number.isFinite(accentExtraStored)
              ? accentExtraStored
              : Math.max(0, leftWidth - baseWidth);
            const clampedWidth = Math.max(sliderMin, Math.min(sliderMax, baseWidth));
            templateBorderWidthSlider.value = clampedWidth;
            templateBorderWidthDisplay.textContent = baseWidth + 'px';
            updateBorderWidthDataset(block, baseWidth, accentExtra);
          }
        }

        if (templateBorderColorRow) {
          templateBorderColorRow.style.display = isNote ? 'flex' : 'none';
        }

        if (templateBorderColorInput) {
          const borderValue = block.dataset.borderColor || target?.style.borderTopColor || computed.borderTopColor;
          const normalizedBorder = normalizeColorToHex(borderValue, '#ced4da');
          templateBorderColorInput.value = normalizedBorder;
          setPaletteActive(templateBorderPalette, normalizedBorder);
        }

        if (templateAccentColorRow) {
          const borderTopColor = normalizeColorToHex(target?.style.borderTopColor || computed.borderTopColor, '#ced4da');
          const borderLeftColor = normalizeColorToHex(block.dataset.accentColor || target?.style.borderLeftColor || computed.borderLeftColor, borderTopColor);
          const accentExtra = parseInt(block.dataset.borderAccentExtra || '0', 10);
          const shouldShowAccent = isNote && (borderLeftColor !== borderTopColor || accentExtra > 0);
          templateAccentColorRow.style.display = shouldShowAccent ? 'flex' : 'none';
          if (templateAccentColorInput) {
            templateAccentColorInput.value = normalizeColorToHex(borderLeftColor, borderTopColor);
            setPaletteActive(templateAccentPalette, borderLeftColor);
          }
          if (shouldShowAccent && !block.dataset.accentColor) {
            block.dataset.accentColor = borderLeftColor;
          } else if (!shouldShowAccent) {
            delete block.dataset.accentColor;
          }
        }
      }

      function updateTemplateToolbarPosition(block) {
        if (!templateToolbar || !block) return;
        templateToolbar.classList.add('show');
        const rect = block.getBoundingClientRect();
        const toolbarWidth = templateToolbar.offsetWidth || 260;
        const toolbarHeight = templateToolbar.offsetHeight || 220;

        let left = rect.right + 12;
        let top = rect.top;

        if (left + toolbarWidth > window.innerWidth - 10) {
          left = rect.left - toolbarWidth - 12;
        }

        if (left < 10) {
          left = 10;
        }

        if (top + toolbarHeight > window.innerHeight - 10) {
          top = window.innerHeight - toolbarHeight - 10;
        }

        if (top < 10) {
          top = 10;
        }

        templateToolbar.style.left = left + 'px';
        templateToolbar.style.top = top + 'px';
      }

      function repositionTemplateToolbar() {
        if (selectedTemplateBlock) {
          updateTemplateToolbarPosition(selectedTemplateBlock);
        }
      }

      function showTemplateToolbar(block) {
        if (!templateToolbar || !block) return;
        if (selectedTemplateBlock && selectedTemplateBlock !== block) {
          selectedTemplateBlock.classList.remove('selected-template');
        }
        hideImageToolbar();
        selectedTemplateBlock = block;
        block.classList.add('selected-template');
        updateTemplateToolbarState(block);
        updateTemplateToolbarPosition(block);
      }

      function hideTemplateToolbar() {
        if (selectedTemplateBlock) {
          selectedTemplateBlock.classList.remove('selected-template');
          selectedTemplateBlock = null;
        }
        if (templateToolbar) {
          templateToolbar.classList.remove('show');
        }
      }

      function sanitizeCitations(el) {
        if (!el) return;
        const patterns = [
          /\[(?:cite(?:_start|_end)?|refs?|reference)\b[^\]]*\]/gi,
          /\((?:\s*\[?(?:cite|ref)[^\)]*\)?)+\)/gi
        ];
        let html = el.innerHTML;
        patterns.forEach(re => {
          html = html.replace(re, '');
        });
        el.innerHTML = html;
      }

      function purgeUnwantedNotes(root) {
        if (!root) return;
        root.querySelectorAll('.box, p').forEach(node => {
          const t = node.textContent || '';
          if (/^\s*nota:\s*/i.test(t)) {
            node.textContent = t.replace(/^\s*nota:\s*/i, '');
          }
        });
        const kill = /basarse en guías chilenas e internacionales|manejo inicial es universal/i;
        root.querySelectorAll('.box,p,li').forEach(node => {
          if (kill.test(node.textContent || '')) {
            node.remove();
          }
        });
      }

      function normalizePearls(root) {
        if (!root) return;
        root.querySelectorAll('.box').forEach(node => {
          const t = (node.textContent || '').toLowerCase();
          if (/\bperla\b/.test(t)) {
            node.classList.add('pearl');
          }
        });
      }

      function resetInteractiveBindings(root) {
        if (!root) return;
        root.querySelectorAll('.magic-icon[data-bound], .topic-title-text[data-bound]').forEach(node => {
          node.removeAttribute('data-bound');
        });
      }

      function afterContentSanitize(root) {
        sanitizeCitations(root);
        purgeUnwantedNotes(root);
        normalizePearls(root);
        resetInteractiveBindings(root);
        initializeCollapseCards(root);
      }

      function countWords(html) {
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
      }

      function getCurrentPage() {
        if (currentPageRef && document.body.contains(currentPageRef)) {
          return currentPageRef;
        }
        const viewportCenter = window.scrollY + window.innerHeight / 2;
        return pages.find(p => {
          const rect = p.getBoundingClientRect();
          const pageTop = rect.top + window.scrollY;
          const pageBottom = pageTop + rect.height;
          return viewportCenter >= pageTop && viewportCenter <= pageBottom;
        }) || pages[0];
      }

      function getCurrentMagicPage() {
        return document.querySelector('.magic-page');
      }

      /* === HABILITAR PEGADO DE HTML === */
      function enableHtmlPaste() {
        const editableElements = document.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(el => {
          if (el.dataset.pasteHandlerBound === 'true') return;
          el.addEventListener('paste', (e) => {
            const clipboardData = e.clipboardData;
            if (!clipboardData) return;

            const items = Array.from(clipboardData.items || []);
            const imageItems = items.filter(item => item.type && item.type.startsWith('image/'));

            if (imageItems.length) {
              e.preventDefault();
              const currentSelection = window.getSelection();
              const baseRange = currentSelection && currentSelection.rangeCount
                ? currentSelection.getRangeAt(0).cloneRange()
                : null;

              imageItems.forEach(item => {
                const file = item.getAsFile();
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                  const dataUrl = event.target?.result;
                  if (!dataUrl) return;

                  const selection = window.getSelection();
                  const range = baseRange ? baseRange.cloneRange() : selection?.getRangeAt(0)?.cloneRange();
                  if (!range) return;

                  range.deleteContents();

                  const img = document.createElement('img');
                  img.src = typeof dataUrl === 'string' ? dataUrl : '';
                  range.insertNode(img);

                  range.setStartAfter(img);
                  range.collapse(true);
                  const sel = window.getSelection();
                  if (!sel) return;
                  sel.removeAllRanges();
                  sel.addRange(range);
                  if (baseRange) {
                    baseRange.setStartAfter(img);
                    baseRange.collapse(true);
                  }
                };
                reader.readAsDataURL(file);
              });
              return;
            }

            e.preventDefault();
            const html = clipboardData.getData('text/html') || clipboardData.getData('text/plain');
            document.execCommand('insertHTML', false, html);
          });
          el.dataset.pasteHandlerBound = 'true';
        });
      }

      /* === TABLAS === */
      function wrapTableIfNeeded(table) {
        if (!table) return null;
        let wrapper = table.closest('.table-wrap');
        if (!wrapper) {
          wrapper = document.createElement('div');
          wrapper.className = 'table-wrap';
          table.parentNode?.insertBefore(wrapper, table);
          wrapper.appendChild(table);
        }
        wrapper.classList.add('table-resize-wrapper');
        if (getComputedStyle(wrapper).position === 'static') {
          wrapper.style.position = 'relative';
        }
        return wrapper;
      }

      function makeTableResizable(table) {
        if (!table) return null;

        if (tableResizers.has(table)) {
          return tableResizers.get(table);
        }

        const wrapper = wrapTableIfNeeded(table);
        if (!wrapper) return null;

        let handle = wrapper.querySelector('.table-resize-handle');
        if (!handle) {
          handle = document.createElement('div');
          handle.className = 'table-resize-handle';
          wrapper.appendChild(handle);
        }

        const state = {
          active: false,
          mode: null,
          startX: 0,
          startY: 0,
          startTableWidth: 0,
          startTableHeight: 0,
          originalWidthStyle: table.style.width,
          originalHeightStyle: table.style.height,
          columnCells: [],
          rowCells: [],
          startColumnStyles: [],
          startRowStyles: [],
          callbacks: null,
          cleanup: null
        };

        const threshold = 8;

        function exitResizeMode() {
          wrapper.classList.remove('table-resize-mode');
          wrapper.classList.remove('table-resize-active');
          table.classList.remove('table-resize-ready');
          table.style.cursor = '';
          document.body.style.userSelect = '';
          document.body.classList.remove('table-resizing');
          if (tableResizeOverlay) {
            tableResizeOverlay.classList.remove('show');
          }
        }

        function restoreOriginalDimensions() {
          if (state.mode === 'table') {
            table.style.width = state.originalWidthStyle;
            table.style.height = state.originalHeightStyle;
          } else if (state.mode === 'column') {
            state.columnCells.forEach((cell, index) => {
              const info = state.startColumnStyles[index];
              if (!info) return;
              cell.style.width = info.width;
              cell.style.minWidth = info.minWidth;
            });
          } else if (state.mode === 'row') {
            state.rowCells.forEach((cell, index) => {
              const info = state.startRowStyles[index];
              if (!info) return;
              cell.style.height = info.height;
              cell.style.minHeight = info.minHeight;
            });
          }
        }

        function finishResize(cancelled) {
          if (state.cleanup) {
            state.cleanup();
            state.cleanup = null;
          }

          const callbacks = state.callbacks;
          state.active = false;
          const mode = state.mode;
          state.mode = null;
          state.columnCells = [];
          state.rowCells = [];
          state.startColumnStyles = [];
          state.startRowStyles = [];

          if (cancelled) {
            restoreOriginalDimensions();
          } else if (mode === 'table') {
            state.originalWidthStyle = table.style.width;
            state.originalHeightStyle = table.style.height;
          }

          exitResizeMode();

          if (callbacks) {
            if (cancelled) {
              callbacks.onCancel?.();
            } else {
              callbacks.onFinish?.();
            }
          }
        }

        function applyColumnResize(deltaX) {
          if (!state.columnCells.length) return;
          const baseWidth = state.startColumnStyles[0]?.numericWidth || state.columnCells[0].offsetWidth;
          const newWidth = Math.max(40, baseWidth + deltaX);
          state.columnCells.forEach(cell => {
            cell.style.width = newWidth + 'px';
            cell.style.minWidth = newWidth + 'px';
          });
        }

        function applyRowResize(deltaY) {
          if (!state.rowCells.length) return;
          const baseHeight = state.startRowStyles[0]?.numericHeight || state.rowCells[0].offsetHeight;
          const newHeight = Math.max(24, baseHeight + deltaY);
          state.rowCells.forEach(cell => {
            cell.style.height = newHeight + 'px';
            cell.style.minHeight = newHeight + 'px';
          });
        }

        function applyTableResize(deltaX, deltaY) {
          const newWidth = Math.max(160, state.startTableWidth + deltaX);
          const newHeight = Math.max(80, state.startTableHeight + deltaY);
          table.style.width = newWidth + 'px';
          table.style.height = newHeight + 'px';
          table.dataset.tableWidth = String(newWidth);
          table.dataset.tableHeight = String(newHeight);
        }

        function onMouseMove(event) {
          if (!state.active) return;
          if (state.mode === 'column') {
            applyColumnResize(event.clientX - state.startX);
          } else if (state.mode === 'row') {
            applyRowResize(event.clientY - state.startY);
          } else {
            applyTableResize(event.clientX - state.startX, event.clientY - state.startY);
          }
        }

        function onMouseUp() {
          finishResize(false);
        }

        function onKeyDown(event) {
          if (event.key === 'Escape') {
            finishResize(true);
          }
        }

        function startResize(mode, cell, event) {
          if (!isEditMode) return;
          event.preventDefault();

          state.active = true;
          state.mode = mode;
          state.startX = event.clientX;
          state.startY = event.clientY;
          state.originalWidthStyle = table.style.width;
          state.originalHeightStyle = table.style.height;
          state.columnCells = [];
          state.rowCells = [];
          state.startColumnStyles = [];
          state.startRowStyles = [];

          if (mode === 'column' && cell) {
            const index = cell.cellIndex;
            const columnCells = Array.from(table.rows).map(row => row.cells[index]).filter(Boolean);
            state.columnCells = columnCells;
            state.startColumnStyles = columnCells.map(colCell => ({
              width: colCell.style.width,
              minWidth: colCell.style.minWidth,
              numericWidth: colCell.offsetWidth
            }));
          } else if (mode === 'row' && cell) {
            const rowCells = Array.from(cell.parentElement?.cells || []);
            state.rowCells = rowCells;
            state.startRowStyles = rowCells.map(rowCell => ({
              height: rowCell.style.height,
              minHeight: rowCell.style.minHeight,
              numericHeight: rowCell.offsetHeight
            }));
          } else {
            state.startTableWidth = table.offsetWidth;
            state.startTableHeight = table.offsetHeight;
          }

          wrapper.classList.add('table-resize-active');
          if (tableResizeOverlay) {
            tableResizeOverlay.classList.add('show');
          }
          document.body.style.userSelect = 'none';
          document.body.classList.add('table-resizing');

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp, { once: true });
          document.addEventListener('keydown', onKeyDown);

          state.cleanup = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mouseup', onMouseUp);
          };
        }

        function handleTableMouseMove(event) {
          if (state.active) return;
          const cell = event.target.closest('th,td');
          if (!cell) {
            table.style.cursor = '';
            return;
          }
          const rect = cell.getBoundingClientRect();
          const offsetX = event.clientX - rect.left;
          const offsetY = event.clientY - rect.top;
          const nearRight = rect.width - offsetX <= threshold;
          const nearBottom = rect.height - offsetY <= threshold;

          if (nearRight && nearBottom) {
            table.style.cursor = 'nwse-resize';
          } else if (nearRight) {
            table.style.cursor = 'col-resize';
          } else if (nearBottom) {
            table.style.cursor = 'row-resize';
          } else {
            table.style.cursor = '';
          }
        }

        function handleTableMouseDown(event) {
          if (!isEditMode || event.button !== 0) return;
          const cell = event.target.closest('th,td');
          if (!cell) return;
          const rect = cell.getBoundingClientRect();
          const offsetX = event.clientX - rect.left;
          const offsetY = event.clientY - rect.top;
          const nearRight = rect.width - offsetX <= threshold;
          const nearBottom = rect.height - offsetY <= threshold;

          if (nearRight || nearBottom) {
            startResize(nearRight ? 'column' : 'row', cell, event);
          }
        }

        handle.addEventListener('mousedown', (event) => {
          if (event.button !== 0) return;
          startResize('table', null, event);
        });

        table.addEventListener('mousemove', handleTableMouseMove);
        table.addEventListener('mouseleave', () => {
          if (!state.active) {
            table.style.cursor = '';
          }
        });
        table.addEventListener('mousedown', handleTableMouseDown);

        const controller = {
          activate(callbacks = {}) {
            state.callbacks = callbacks;
            wrapper.classList.add('table-resize-mode');
            table.classList.add('table-resize-ready');
            return controller;
          },
          cancel() {
            if (state.active) {
              finishResize(true);
            } else {
              state.callbacks = null;
              exitResizeMode();
            }
            return controller;
          },
          isActive() {
            return state.active;
          }
        };

        tableResizers.set(table, controller);
        return controller;
      }

      function initializeTableMenu() {
        if (!tableMenu) return null;

        let selectedTable = null;
        let selectedCell = null;
        let highlightedColumnIndex = null;
        let currentResizer = null;

        const TABLE_HORIZONTAL_STEP = 16;
        const TABLE_HORIZONTAL_LIMIT = 320;

        const actionButtons = Array.from(tableMenu.querySelectorAll('[data-action]'));

        function isCellInTopRow(cell, table) {
          if (!cell || !table) return false;
          const row = cell.closest('tr');
          if (!row) return false;
          if (row.closest('table') !== table) return false;
          const rowIndex = typeof row.rowIndex === 'number' ? row.rowIndex : -1;
          return rowIndex === 0;
        }

        function getTopRowFirstCell(table) {
          if (!table) return null;
          const firstRow = table.rows && table.rows.length ? table.rows[0] : null;
          if (!firstRow) return null;
          return firstRow.cells && firstRow.cells.length ? firstRow.cells[0] : firstRow.querySelector('td,th');
        }

        function hideMenu(options = {}) {
          tableMenu.classList.remove('show');
          tableMenu.setAttribute('aria-hidden', 'true');
          if (!options.preserveSelection) {
            if (selectedTable) {
              selectedTable.classList.remove('table-menu-selected');
            }
            clearColumnHighlight();
            selectedTable = null;
            selectedCell = null;
          }
        }

        function showMenu(table, cell) {
          if (!isEditMode || !table) return;
          if (!table.closest('[contenteditable="true"]')) return;
          if (cell && !isCellInTopRow(cell, table)) {
            hideMenu();
            return;
          }
          if (selectedTable && selectedTable !== table) {
            selectedTable.classList.remove('table-menu-selected');
            clearColumnHighlight();
          }
          selectedTable = table;
          if (cell) {
            selectedCell = cell;
          } else if (!selectedCell || !selectedTable.contains(selectedCell) || !isCellInTopRow(selectedCell, selectedTable)) {
            selectedCell = getTopRowFirstCell(selectedTable);
          }
          if (!selectedCell || !isCellInTopRow(selectedCell, selectedTable)) {
            hideMenu();
            return;
          }

          if (selectedTable) {
            selectedTable.classList.add('table-menu-selected');
          }

          updateMenuState();
          tableMenu.classList.add('show');
          tableMenu.setAttribute('aria-hidden', 'false');
        }

        function clearColumnHighlight() {
          if (!selectedTable) return;
          if (highlightedColumnIndex == null) return;
          Array.from(selectedTable.rows).forEach(row => {
            const cell = row.cells[highlightedColumnIndex];
            if (cell) cell.classList.remove('table-column-highlight');
          });
          highlightedColumnIndex = null;
        }

        function highlightColumn(index) {
          clearColumnHighlight();
          if (index == null || !selectedTable) return;
          Array.from(selectedTable.rows).forEach(row => {
            const cell = row.cells[index];
            if (cell) cell.classList.add('table-column-highlight');
          });
          highlightedColumnIndex = index;
        }

        function ensureTableDefaults(table) {
          if (!table.dataset.lineHeight) table.dataset.lineHeight = '1.25';
          if (!table.dataset.paddingY) table.dataset.paddingY = '4';
          if (!table.dataset.tableMargin) table.dataset.tableMargin = '6';
          if (!table.dataset.borderColor) table.dataset.borderColor = '#dee2e6';
          if (!table.dataset.borderWidth) table.dataset.borderWidth = '1';
          if (!table.dataset.hideVerticalBorders) table.dataset.hideVerticalBorders = 'false';
          if (!table.dataset.hideHorizontalBorders) table.dataset.hideHorizontalBorders = 'false';
          if (!table.dataset.outerBorderEnabled) table.dataset.outerBorderEnabled = 'true';
          if (!table.dataset.outerBorderColor) table.dataset.outerBorderColor = table.dataset.borderColor || '#dee2e6';
          if (!table.dataset.outerBorderWidth) table.dataset.outerBorderWidth = table.dataset.borderWidth || '1';
          if (!table.dataset.tableOffsetX) table.dataset.tableOffsetX = '0';
        }

        function countColumns(table) {
          return Array.from(table.rows).reduce((max, row) => Math.max(max, row.cells.length), 0);
        }

        function countRows(table) {
          return Array.from(table.rows).length;
        }

        function updateSizeDisplay() {
          if (!selectedTable) return;
          const rows = countRows(selectedTable);
          const cols = countColumns(selectedTable);
          tableMenuSize.textContent = `${rows} × ${cols}`;
        }

        function applySpacing() {
          if (!selectedTable) return;
          const lineHeight = parseFloat(selectedTable.dataset.lineHeight || '1.25');
          const paddingY = parseInt(selectedTable.dataset.paddingY || '4', 10);
          const margin = parseInt(selectedTable.dataset.tableMargin || '6', 10);
          const cells = selectedTable.querySelectorAll('th,td');
          cells.forEach(cell => {
            cell.style.lineHeight = lineHeight.toString();
            cell.style.paddingTop = paddingY + 'px';
            cell.style.paddingBottom = paddingY + 'px';
          });
          selectedTable.style.marginTop = margin + 'px';
          selectedTable.style.marginBottom = margin + 'px';
          selectedTable.style.marginLeft = margin + 'px';
          selectedTable.style.marginRight = margin + 'px';
        }

        function getTableWrapper(table) {
          if (!table) return null;
          return table.closest('.table-wrap') || table;
        }

        function applyHorizontalOffset() {
          if (!selectedTable) return;
          const offset = parseInt(selectedTable.dataset.tableOffsetX || '0', 10);
          const wrapper = getTableWrapper(selectedTable);
          if (!wrapper) return;
          if (typeof wrapper.dataset.originalTransform === 'undefined') {
            wrapper.dataset.originalTransform = wrapper.style.transform || '';
          }
          const original = wrapper.dataset.originalTransform;
          const hasOriginal = original && original !== 'none';
          if (offset === 0) {
            if (hasOriginal) {
              wrapper.style.transform = original;
            } else {
              wrapper.style.removeProperty('transform');
            }
          } else {
            const prefix = hasOriginal ? `${original} ` : '';
            wrapper.style.transform = `${prefix}translateX(${offset}px)`;
          }
        }

        function adjustTableOffset(direction) {
          if (!selectedTable) return;
          const current = parseInt(selectedTable.dataset.tableOffsetX || '0', 10);
          const delta = direction === 'left' ? -TABLE_HORIZONTAL_STEP : TABLE_HORIZONTAL_STEP;
          let next = current + delta;
          if (next > TABLE_HORIZONTAL_LIMIT) next = TABLE_HORIZONTAL_LIMIT;
          if (next < -TABLE_HORIZONTAL_LIMIT) next = -TABLE_HORIZONTAL_LIMIT;
          selectedTable.dataset.tableOffsetX = String(next);
          applyHorizontalOffset();
        }

        function updateSpacingControls() {
          if (!selectedTable) return;
          tableLineHeightInput.value = selectedTable.dataset.lineHeight || '1.25';
          tablePaddingYInput.value = selectedTable.dataset.paddingY || '4';
          tableMarginInput.value = selectedTable.dataset.tableMargin || '6';
          tableLineHeightValue.textContent = parseFloat(tableLineHeightInput.value).toFixed(2);
          tablePaddingYValue.textContent = `${tablePaddingYInput.value}px`;
          tableMarginValue.textContent = `${tableMarginInput.value}px`;
        }

        function updateThemeButtons() {
          if (!selectedTable) return;
          const currentTheme = selectedTable.dataset.themeClass || '';
          tableThemeButtons.forEach(btn => {
            const theme = btn.dataset.tableTheme || '';
            btn.classList.toggle('active', theme === currentTheme);
          });
        }

        function applyTheme(themeClass) {
          if (!selectedTable) return;
          const previous = selectedTable.dataset.themeClass;
          if (previous) {
            selectedTable.classList.remove(previous);
          }
          if (themeClass) {
            selectedTable.classList.add(themeClass);
            selectedTable.dataset.themeClass = themeClass;
          } else {
            delete selectedTable.dataset.themeClass;
          }
          updateThemeButtons();
        }

        const spacingPresets = {
          compacta: { lineHeight: 1.15, paddingY: 3, margin: 4 },
          equilibrada: { lineHeight: 1.3, paddingY: 5, margin: 8 },
          amplia: { lineHeight: 1.5, paddingY: 8, margin: 12 }
        };

        function updatePresetButtons() {
          if (!selectedTable) return;
          const current = {
            lineHeight: parseFloat(selectedTable.dataset.lineHeight || '1.25'),
            paddingY: parseInt(selectedTable.dataset.paddingY || '4', 10),
            margin: parseInt(selectedTable.dataset.tableMargin || '6', 10)
          };
          tablePresetButtons.forEach(btn => {
            const preset = spacingPresets[btn.dataset.tablePreset];
            if (!preset) {
              btn.classList.remove('active');
              return;
            }
            const isMatch = Math.abs(preset.lineHeight - current.lineHeight) < 0.01
              && preset.paddingY === current.paddingY
              && preset.margin === current.margin;
            btn.classList.toggle('active', isMatch);
          });
        }

        function applySpacingPreset(key) {
          const preset = spacingPresets[key];
          if (!preset || !selectedTable) return;
          selectedTable.dataset.lineHeight = preset.lineHeight.toString();
          selectedTable.dataset.paddingY = preset.paddingY.toString();
          selectedTable.dataset.tableMargin = preset.margin.toString();
          applySpacing();
          applyHorizontalOffset();
          updateSpacingControls();
          updatePresetButtons();
        }

        function applyBorderStyles() {
          if (!selectedTable) return;
          const color = selectedTable.dataset.borderColor || '#dee2e6';
          const width = parseFloat(selectedTable.dataset.borderWidth || '1');
          const hideVertical = selectedTable.dataset.hideVerticalBorders === 'true';
          const hideHorizontal = selectedTable.dataset.hideHorizontalBorders === 'true';
          const outerEnabled = selectedTable.dataset.outerBorderEnabled !== 'false';
          const outerColor = selectedTable.dataset.outerBorderColor || color;
          const outerWidth = parseFloat(selectedTable.dataset.outerBorderWidth || String(width));
          const cells = selectedTable.querySelectorAll('th,td');

          if (outerEnabled && outerWidth > 0) {
            selectedTable.style.borderStyle = 'solid';
            selectedTable.style.borderWidth = `${outerWidth}px`;
            selectedTable.style.borderColor = outerColor;
          } else {
            selectedTable.style.borderStyle = 'none';
            selectedTable.style.borderWidth = '0';
            selectedTable.style.borderColor = outerColor;
          }

          cells.forEach(cell => {
            cell.style.borderColor = color;
            cell.style.borderStyle = 'solid';
            cell.style.borderWidth = width + 'px';
            cell.style.borderLeftWidth = hideVertical ? '0px' : width + 'px';
            cell.style.borderRightWidth = hideVertical ? '0px' : width + 'px';
            cell.style.borderTopWidth = hideHorizontal ? '0px' : width + 'px';
            cell.style.borderBottomWidth = hideHorizontal ? '0px' : width + 'px';
          });
        }

        function updateBorderControls() {
          if (!selectedTable) return;
          const color = selectedTable.dataset.borderColor || '#dee2e6';
          const width = selectedTable.dataset.borderWidth || '1';
          const hideVertical = selectedTable.dataset.hideVerticalBorders === 'true';
          const hideHorizontal = selectedTable.dataset.hideHorizontalBorders === 'true';
          const outerEnabled = selectedTable.dataset.outerBorderEnabled !== 'false';
          const outerColor = selectedTable.dataset.outerBorderColor || color;
          const outerWidth = selectedTable.dataset.outerBorderWidth || width;

          tableBorderColorButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.borderColor === color);
          });
          if (tableBorderColorCustom) {
            tableBorderColorCustom.value = normalizeColorToHex(color, color);
          }
          tableBorderWidthInput.value = width;
          tableBorderWidthValue.textContent = `${width}px`;
          toggleVerticalBorders.checked = hideVertical;
          toggleHorizontalBorders.checked = hideHorizontal;
          if (tableOuterBorderToggle) {
            tableOuterBorderToggle.checked = outerEnabled;
          }
          if (tableOuterBorderWidthInput) {
            tableOuterBorderWidthInput.value = outerWidth;
            tableOuterBorderWidthInput.disabled = !outerEnabled;
          }
          if (tableOuterBorderWidthValue) {
            tableOuterBorderWidthValue.textContent = `${outerWidth}px`;
          }
          tableOuterBorderColorButtons.forEach(btn => {
            const btnColor = btn.dataset.borderColor || '';
            btn.classList.toggle('active', normalizeColorToHex(btnColor, btnColor).toLowerCase() === normalizeColorToHex(outerColor, outerColor).toLowerCase());
            btn.disabled = !outerEnabled;
          });
          if (tableOuterBorderColorCustom) {
            tableOuterBorderColorCustom.value = normalizeColorToHex(outerColor, outerColor);
            tableOuterBorderColorCustom.disabled = !outerEnabled;
          }
        }

        function updateStatefulButtons() {
          actionButtons.forEach(btn => {
            if (!btn.dataset.stateful) return;
            if (!selectedTable) {
              btn.classList.remove('active');
              return;
            }
            const action = btn.dataset.action;
            if (action === 'toggle-header') {
              const hasHeader = !!selectedTable.tHead;
              btn.classList.toggle('active', hasHeader);
            }
            if (action === 'toggle-zebra') {
              const isZebra = selectedTable.classList.contains('table-zebra');
              btn.classList.toggle('active', isZebra);
            }
          });
        }

        function updateMenuState() {
          if (!selectedTable) return;
          ensureTableDefaults(selectedTable);
          updateSizeDisplay();
          updateSpacingControls();
          updatePresetButtons();
          updateThemeButtons();
          updateBorderControls();
          updateStatefulButtons();
          applySpacing();
          applyBorderStyles();
          applyHorizontalOffset();
        }

        function ensureCellContext() {
          if (!selectedCell || !selectedTable || !selectedTable.contains(selectedCell)) {
            selectedCell = selectedTable?.querySelector('td,th') || null;
          }
          return selectedCell;
        }

        function insertRow(relativePosition) {
          const cell = ensureCellContext();
          if (!cell || !selectedTable) return;
          const row = cell.parentElement;
          if (!row) return;
          const section = row.parentElement;
          const columnCount = countColumns(selectedTable) || row.cells.length;
          const isHeader = section?.tagName === 'THEAD';
          const newRow = document.createElement('tr');
          for (let i = 0; i < columnCount; i++) {
            const newCell = document.createElement(isHeader ? 'th' : 'td');
            newCell.innerHTML = '<br>';
            newRow.appendChild(newCell);
          }
          if (relativePosition === 'before') {
            row.parentElement?.insertBefore(newRow, row);
          } else {
            row.parentElement?.insertBefore(newRow, row.nextSibling);
          }
          selectedCell = newRow.cells[cell.cellIndex] || newRow.cells[0] || selectedCell;
        }

        function deleteRow() {
          const cell = ensureCellContext();
          if (!cell || !selectedTable) return;
          const row = cell.parentElement;
          if (!row) return;
          const section = row.parentElement;
          const isBody = section?.tagName === 'TBODY';
          const isHeader = section?.tagName === 'THEAD';

          if (isHeader) {
            const thead = selectedTable.tHead;
            if (!thead) return;
            if (thead.rows.length <= 1) {
              thead.remove();
            } else {
              row.remove();
            }
          } else if (isBody) {
            const tbody = section;
            if (tbody && tbody.rows.length <= 1) return;
            row.remove();
          } else {
            row.remove();
          }
          selectedCell = selectedTable.querySelector('td,th');
        }

        function insertColumn(position) {
          const cell = ensureCellContext();
          if (!cell || !selectedTable) return;
          const index = cell.cellIndex;
          const rows = Array.from(selectedTable.rows);
          rows.forEach(row => {
            const tag = row.parentElement?.tagName === 'THEAD' ? 'th' : 'td';
            const newCell = document.createElement(tag);
            newCell.innerHTML = '<br>';
            const reference = row.cells[index] || null;
            if (position === 'left') {
              row.insertBefore(newCell, reference);
            } else {
              if (reference) {
                row.insertBefore(newCell, reference.nextSibling);
              } else {
                row.appendChild(newCell);
              }
            }
          });
        }

        function deleteColumn() {
          const cell = ensureCellContext();
          if (!cell || !selectedTable) return;
          const index = cell.cellIndex;
          const columnCount = countColumns(selectedTable);
          if (columnCount <= 1) return;
          Array.from(selectedTable.rows).forEach(row => {
            const target = row.cells[index];
            if (target) target.remove();
          });
          selectedCell = selectedTable.querySelector('td,th');
          clearColumnHighlight();
        }

        function clearColumn() {
          const cell = ensureCellContext();
          if (!cell || !selectedTable) return;
          const index = cell.cellIndex;
          Array.from(selectedTable.rows).forEach(row => {
            const target = row.cells[index];
            if (target) target.innerHTML = '<br>';
          });
        }

        function toggleHeaderRow() {
          if (!selectedTable) return;
          if (selectedTable.tHead) {
            const headerRow = selectedTable.tHead.rows[0];
            if (headerRow) {
              const tbody = selectedTable.tBodies[0] || selectedTable.createTBody();
              const bodyRow = document.createElement('tr');
              Array.from(headerRow.cells).forEach(th => {
                const td = document.createElement('td');
                td.innerHTML = th.innerHTML;
                td.style.cssText = th.style.cssText;
                bodyRow.appendChild(td);
              });
              tbody.insertBefore(bodyRow, tbody.firstChild || null);
              selectedCell = bodyRow.cells[0] || null;
            }
            selectedTable.tHead.remove();
            selectedTable.dataset.headerRow = 'false';
          } else {
            const tbody = selectedTable.tBodies[0];
            if (!tbody || !tbody.rows.length) return;
            const firstRow = tbody.rows[0];
            const thead = selectedTable.createTHead();
            const headerRow = document.createElement('tr');
            Array.from(firstRow.cells).forEach(td => {
              const th = document.createElement('th');
              th.innerHTML = td.innerHTML;
              th.style.cssText = td.style.cssText;
              headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            firstRow.remove();
            selectedCell = headerRow.cells[0] || null;
            selectedTable.dataset.headerRow = 'true';
          }
        }

        function toggleZebra() {
          if (!selectedTable) return;
          const isActive = selectedTable.classList.toggle('table-zebra');
          selectedTable.dataset.zebra = isActive ? 'true' : 'false';
        }

        function selectColumn() {
          const cell = ensureCellContext();
          if (!cell) return;
          highlightColumn(cell.cellIndex);
        }

        function openTools() {
          if (!selectedTable) return;
          const event = new CustomEvent('tableMenu:tools', { detail: { table: selectedTable } });
          document.dispatchEvent(event);
        }

        function handleAction(action) {
          switch (action) {
            case 'insert-row-above':
              insertRow('before');
              break;
            case 'insert-row-below':
              insertRow('after');
              break;
            case 'delete-row':
              deleteRow();
              break;
            case 'insert-column-left':
              insertColumn('left');
              break;
            case 'insert-column-right':
              insertColumn('right');
              break;
            case 'delete-column':
              deleteColumn();
              break;
            case 'clear-column':
              clearColumn();
              break;
            case 'toggle-header':
              toggleHeaderRow();
              break;
            case 'toggle-zebra':
              toggleZebra();
              break;
            case 'select-column':
              selectColumn();
              break;
            case 'move-left':
              adjustTableOffset('left');
              break;
            case 'move-right':
              adjustTableOffset('right');
              break;
            case 'open-tools':
              openTools();
              break;
          }
          updateMenuState();
        }

        actionButtons.forEach(btn => {
          btn.addEventListener('click', () => handleAction(btn.dataset.action));
        });

        tableMenuTabs.forEach(tab => {
          tab.addEventListener('click', () => {
            if (tab.classList.contains('active')) return;
            tableMenuTabs.forEach(t => {
              t.classList.toggle('active', t === tab);
              t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
            });
            const target = tab.dataset.tab;
            tableMenuPanels.forEach(panel => {
              panel.classList.toggle('active', panel.dataset.panel === target);
            });
          });
        });

        tableThemeButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            applyTheme(btn.dataset.tableTheme || '');
          });
        });

        tableLineHeightInput?.addEventListener('input', () => {
          if (!selectedTable) return;
          selectedTable.dataset.lineHeight = tableLineHeightInput.value;
          tableLineHeightValue.textContent = parseFloat(tableLineHeightInput.value).toFixed(2);
          applySpacing();
          applyHorizontalOffset();
        });

        tablePaddingYInput?.addEventListener('input', () => {
          if (!selectedTable) return;
          selectedTable.dataset.paddingY = tablePaddingYInput.value;
          tablePaddingYValue.textContent = `${tablePaddingYInput.value}px`;
          applySpacing();
          applyHorizontalOffset();
        });

        tableMarginInput?.addEventListener('input', () => {
          if (!selectedTable) return;
          selectedTable.dataset.tableMargin = tableMarginInput.value;
          tableMarginValue.textContent = `${tableMarginInput.value}px`;
          applySpacing();
          applyHorizontalOffset();
        });

        tablePresetButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            applySpacingPreset(btn.dataset.tablePreset);
          });
        });

        tableBorderColorButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            if (!selectedTable) return;
            selectedTable.dataset.borderColor = btn.dataset.borderColor || '#dee2e6';
            updateBorderControls();
            applyBorderStyles();
          });
        });

        tableBorderColorCustom?.addEventListener('input', () => {
          if (!selectedTable || !tableBorderColorCustom) return;
          selectedTable.dataset.borderColor = tableBorderColorCustom.value;
          updateBorderControls();
          applyBorderStyles();
        });

        tableBorderWidthInput?.addEventListener('input', () => {
          if (!selectedTable) return;
          selectedTable.dataset.borderWidth = tableBorderWidthInput.value;
          tableBorderWidthValue.textContent = `${tableBorderWidthInput.value}px`;
          applyBorderStyles();
        });

        tableOuterBorderToggle?.addEventListener('change', () => {
          if (!selectedTable) return;
          selectedTable.dataset.outerBorderEnabled = tableOuterBorderToggle.checked ? 'true' : 'false';
          applyBorderStyles();
          updateBorderControls();
        });

        tableOuterBorderWidthInput?.addEventListener('input', () => {
          if (!selectedTable) return;
          selectedTable.dataset.outerBorderWidth = tableOuterBorderWidthInput.value;
          tableOuterBorderWidthValue.textContent = `${tableOuterBorderWidthInput.value}px`;
          applyBorderStyles();
        });

        tableOuterBorderColorButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            if (!selectedTable || tableOuterBorderToggle?.checked === false) return;
            const normalized = normalizeColorToHex(btn.dataset.borderColor || '', '#dee2e6');
            selectedTable.dataset.outerBorderColor = normalized;
            updateBorderControls();
            applyBorderStyles();
          });
        });

        tableOuterBorderColorCustom?.addEventListener('input', () => {
          if (!selectedTable || tableOuterBorderToggle?.checked === false) return;
          selectedTable.dataset.outerBorderColor = tableOuterBorderColorCustom.value;
          updateBorderControls();
          applyBorderStyles();
        });

        toggleVerticalBorders?.addEventListener('change', () => {
          if (!selectedTable) return;
          selectedTable.dataset.hideVerticalBorders = toggleVerticalBorders.checked ? 'true' : 'false';
          applyBorderStyles();
        });

        toggleHorizontalBorders?.addEventListener('change', () => {
          if (!selectedTable) return;
          selectedTable.dataset.hideHorizontalBorders = toggleHorizontalBorders.checked ? 'true' : 'false';
          applyBorderStyles();
        });

        tableBorderResetBtn?.addEventListener('click', () => {
          if (!selectedTable) return;
          selectedTable.dataset.borderColor = '#dee2e6';
          selectedTable.dataset.borderWidth = '1';
          selectedTable.dataset.hideVerticalBorders = 'false';
          selectedTable.dataset.hideHorizontalBorders = 'false';
          selectedTable.dataset.outerBorderEnabled = 'true';
          selectedTable.dataset.outerBorderColor = '#dee2e6';
          selectedTable.dataset.outerBorderWidth = '1';
          updateBorderControls();
          applyBorderStyles();
        });

        tableMenuClose?.addEventListener('click', () => hideMenu());

        tableResizeBtn?.addEventListener('click', () => {
          if (!selectedTable) return;
          currentResizer = makeTableResizable(selectedTable);
          currentResizer?.activate({
            onFinish: () => {
              currentResizer = null;
              showMenu(selectedTable, selectedCell);
            },
            onCancel: () => {
              currentResizer = null;
              showMenu(selectedTable, selectedCell);
            }
          });
          hideMenu({ preserveSelection: true });
        });

        function cancelResizeMode() {
          if (currentResizer) {
            currentResizer.cancel();
            currentResizer = null;
          } else if (selectedTable && tableResizers.has(selectedTable)) {
            tableResizers.get(selectedTable)?.cancel();
          }
        }

        document.addEventListener('click', (event) => {
          if (!isEditMode) return;
          if (tableMenu.contains(event.target)) return;
          const table = event.target.closest('table');
          if (!table) {
            if (!tableMenu.contains(event.target)) {
              hideMenu();
            }
            return;
          }
          const cell = event.target.closest('td,th');
          if (!cell || !isCellInTopRow(cell, table)) {
            hideMenu();
            return;
          }
          showMenu(table, cell);
        });

        document.addEventListener('selectionchange', () => {
          if (!isEditMode) return;
          const selection = window.getSelection();
          if (!selection || !selection.rangeCount) return;
          const node = selection.anchorNode;
          if (!node) return;
          const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
          if (!element) return;
          const table = element.closest('table');
          if (!table) {
            if (tableMenu.classList.contains('show')) {
              hideMenu();
            }
            return;
          }
          const cell = element.closest('td,th');
          if (!cell || !isCellInTopRow(cell, table)) {
            hideMenu();
            return;
          }
          showMenu(table, cell);
        });

        return {
          hide: hideMenu,
          show: showMenu,
          refresh: updateMenuState,
          cancelResize: cancelResizeMode
        };
      }

      tableMenuAPI = initializeTableMenu();

      /* === MODAL === */
      function showModal(content) {
        hideTopicMenu();
        modalContent.innerHTML = content;
        modalOverlay.classList.add('show');
      }

      function hideModal() {
        modalOverlay.classList.remove('show');
        modalContent.innerHTML = '';
        clearToolbarInsertionSnapshot();
      }

      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) hideModal();
      });

      /* === INICIALIZACIÓN === */
      function initializeSections() {
        const sectionMap = new Map();
        const newThemeMap = new Map(sectionThemes);

        pages.forEach(page => {
          const sectionId = page.dataset.sectionId || 'seccion-default';
          let topicId = (page.dataset.topicId || '').trim();
          if (!topicId) {
            topicId = generateUniqueId('topic');
          }
          page.dataset.topicId = topicId;
          const h1 = page.querySelector('h1');
          const titleSpan = h1?.querySelector('span:first-child');
          const title = (titleSpan?.textContent || h1?.textContent || 'Sin título').trim();
          const existingTheme = newThemeMap.get(sectionId) || page.dataset.theme || getPageTheme(page);

          applyThemeToPage(page, existingTheme);
          newThemeMap.set(sectionId, existingTheme);

          if (!sectionMap.has(sectionId)) {
            sectionMap.set(sectionId, {
              id: sectionId,
              nombre: page.dataset.sectionName || 'Sección Principal',
              collapsed: false,
              temas: [],
              theme: existingTheme
            });
          }

          sectionMap.get(sectionId).temas.push({
            id: topicId,
            titulo: title,
            page: page,
            theme: existingTheme
          });
        });

        sectionThemes = newThemeMap;
        sections = Array.from(sectionMap.values());
        ensureVisibleSection({ force: true });
      }

      pages.forEach(p => {
        afterContentSanitize(p);
        if (!p.dataset.sectionId) {
          p.dataset.sectionId = 'seccion-1';
        }
      });
      
      document.querySelectorAll('.magic-topic').forEach(m => afterContentSanitize(m));
      initializeSections();

      (function setSpecialtyFromBuildComment() {
        try {
          const html = document.documentElement.innerHTML;
          const m = html.match(/build:topics\s{([\s\S]*?)}/);
          if (m) {
            const json = JSON.parse('{' + m[1] + '}');
            if (json.especialidad && specialtySpan) {
              setDocumentTitle(json.especialidad);
            }
          }
        } catch (e) {}
      })();

      /* === ICONOS MÁGICOS EN PÁGINAS === */
      function setupMagicIcons() {
        pages.forEach(page => {
          const h1 = page.querySelector('h1');
          if (!h1) return;

          let titleSpan = h1.querySelector('.topic-title-text');
          if (!titleSpan) {
            const existingSpan = h1.querySelector('span:first-child');
            const currentTitle = (existingSpan?.textContent || h1.textContent || '').trim();
            const existingMagic = h1.querySelector('.magic-icon');

            if (existingSpan) {
              titleSpan = existingSpan;
              titleSpan.classList.add('topic-title-text');
            } else {
              titleSpan = document.createElement('span');
              titleSpan.className = 'topic-title-text';
              titleSpan.textContent = currentTitle;
            }

            h1.innerHTML = '';
            h1.appendChild(titleSpan);
            if (existingMagic) {
              h1.appendChild(existingMagic);
            }
          }

          let magicIcon = h1.querySelector('.magic-icon');
          if (!magicIcon) {
            magicIcon = document.createElement('span');
            magicIcon.className = 'magic-icon';
            magicIcon.title = 'Ver contenido mágico';
            magicIcon.textContent = '✨';
            h1.appendChild(magicIcon);
          }

          let noteIcon = h1.querySelector('.topic-note-icon');
          if (!noteIcon) {
            noteIcon = document.createElement('span');
            noteIcon.className = 'topic-note-icon';
            noteIcon.textContent = '📝';
            h1.appendChild(noteIcon);
          }
          noteIcon.setAttribute('role', 'button');
          noteIcon.setAttribute('tabindex', '0');
          noteIcon.setAttribute('aria-haspopup', 'true');
          if (!noteIcon.dataset.bound) {
            noteIcon.title = 'Notas del tema';
            noteIcon.addEventListener('click', (event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleTopicNotesPopover(page, noteIcon);
            });
            noteIcon.addEventListener('keydown', (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleTopicNotesPopover(page, noteIcon);
              }
            });
            noteIcon.dataset.bound = 'true';
          }

          const getTitle = () => (titleSpan?.textContent || '').trim() || getTopicTitle(page) || 'Tema';

          if (!magicIcon.dataset.bound) {
            magicIcon.addEventListener('click', (e) => {
              e.stopPropagation();
              closePanel();
              activateMagicTopic(magicAnchorFor(page), getTitle(), page);
            });
            magicIcon.dataset.bound = 'true';
          }

          if (!titleSpan.dataset.bound) {
            titleSpan.title = 'Doble clic para opciones del tema';
            titleSpan.addEventListener('dblclick', (event) => {
              event.preventDefault();
              event.stopPropagation();
              showTopicMenu(event, { page, titulo: getTitle() });
            });
            titleSpan.addEventListener('click', (event) => event.stopPropagation());
            titleSpan.dataset.bound = 'true';
          }

          if (titleSpan.nextSibling !== magicIcon) {
            h1.insertBefore(magicIcon, titleSpan.nextSibling);
          }
          if (magicIcon.nextSibling !== noteIcon) {
            if (magicIcon.nextSibling) {
              h1.insertBefore(noteIcon, magicIcon.nextSibling);
            } else {
              h1.appendChild(noteIcon);
            }
          }
          noteIcon.setAttribute('aria-expanded', isTopicNotesPopoverOpen() && topicNotesPopoverTopicId === (page.dataset.topicId || '') ? 'true' : 'false');
        });
        refreshTopicNoteIndicators();
      }

      setupMagicIcons();

      /* === MODO LECTURA === */
      function toggleReadingMode() {
        isReadingMode = !isReadingMode;
        closeTopicNotesPopover();
        document.body.classList.toggle('reading-mode', isReadingMode);
        readingModeBtn.classList.toggle('active', isReadingMode);
        
        if (isReadingMode) {
          closePanel();
          if (isEditMode) {
            toggleEditMode();
          }
        }
      }

      readingModeBtn?.addEventListener('click', toggleReadingMode);
      readingModeExit?.addEventListener('click', toggleReadingMode);

      function closeTopbarDropdowns() {
        if (!activeTopbarDropdown) return;
        const { trigger, dropdown } = activeTopbarDropdown;
        dropdown.classList.remove('open');
        trigger.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
        activeTopbarDropdown = null;
      }

      function toggleTopbarDropdown(trigger, dropdown) {
        if (!trigger || !dropdown) return;
        const isCurrent = activeTopbarDropdown?.dropdown === dropdown;
        if (isCurrent) {
          closeTopbarDropdowns();
          return;
        }
        closeTopbarDropdowns();
        dropdown.classList.add('open');
        trigger.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        activeTopbarDropdown = { trigger, dropdown };
      }

      function applyTopbarTheme(theme, { persist = true } = {}) {
        if (!topbar) return;
        const resolved = AVAILABLE_TOPBAR_THEMES.includes(theme) ? theme : AVAILABLE_TOPBAR_THEMES[0];
        if (currentTopbarTheme !== resolved) {
          AVAILABLE_TOPBAR_THEMES.forEach(cls => topbar.classList.remove(cls));
          topbar.classList.add(resolved);
          currentTopbarTheme = resolved;
        }
        topbarThemeButtons.forEach(btn => {
          const btnTheme = btn.dataset.theme;
          btn.classList.toggle('active', btnTheme === resolved);
        });
        if (persist) {
          try {
            window.localStorage?.setItem(TOPBAR_THEME_STORAGE_KEY, resolved);
          } catch (error) {
            console.warn('No se pudo guardar la preferencia de la barra:', error);
          }
        }
      }

      if (topbarToolsToggle && topbarToolsDropdown) {
        topbarToolsToggle.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleTopbarDropdown(topbarToolsToggle, topbarToolsDropdown);
        });
        topbarToolsDropdown.addEventListener('click', (event) => {
          event.stopPropagation();
          requestAnimationFrame(() => closeTopbarDropdowns());
        });
      }

      if (topbarThemeToggle && topbarThemeDropdown) {
        topbarThemeToggle.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleTopbarDropdown(topbarThemeToggle, topbarThemeDropdown);
        });
        topbarThemeDropdown.addEventListener('click', (event) => event.stopPropagation());
      }

      topbarThemeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const { theme } = btn.dataset;
          if (theme) {
            applyTopbarTheme(theme, { persist: true });
          }
          closeTopbarDropdowns();
        });
      });

      if (topbar) {
        let storedTheme = null;
        try {
          storedTheme = window.localStorage?.getItem(TOPBAR_THEME_STORAGE_KEY) || null;
        } catch (error) {
          console.warn('No se pudo cargar la preferencia de la barra:', error);
        }
        const fallbackTheme = topbarThemeButtons.find(btn => AVAILABLE_TOPBAR_THEMES.includes(btn.dataset.theme))?.dataset.theme
          || AVAILABLE_TOPBAR_THEMES[0];
        const themeToApply = storedTheme && AVAILABLE_TOPBAR_THEMES.includes(storedTheme)
          ? storedTheme
          : fallbackTheme;
        applyTopbarTheme(themeToApply, { persist: false });
      }

      document.addEventListener('click', () => {
        closeTopbarDropdowns();
      });

      if (magicBackFloating) {
        magicBackFloating.addEventListener('click', (event) => {
          event.preventDefault();
          if (magicBackFloating.disabled) return;
          returnFromMagicView();
        });
        setMagicFloatingBackVisibility(false);
      }

      /* === EXPORTAR MARKDOWN === */
      exportMarkdownBtn?.addEventListener('click', () => {
        let markdown = `# ${getDocumentTitle() || 'Documento'}\n\n`;
        
        pages.forEach(page => {
          const clone = page.cloneNode(true);
          markdown += htmlToMarkdown(clone.innerHTML) + '\n\n---\n\n';
        });
        
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const specialty = getDocumentTitle() || 'documento';
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        a.download = `${specialty.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      function htmlToMarkdown(html) {
        let md = html;
        
        md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
        md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
        md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
        md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
        
        md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
        md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
        md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
        md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
        md = md.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');
        
        md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
        md = md.replace(/<ul[^>]*>/gi, '\n');
        md = md.replace(/<\/ul>/gi, '\n');
        md = md.replace(/<ol[^>]*>/gi, '\n');
        md = md.replace(/<\/ol>/gi, '\n');
        
        md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
        
        md = md.replace(/<[^>]+>/g, '');
        
        md = md.replace(/&nbsp;/g, ' ');
        md = md.replace(/&amp;/g, '&');
        md = md.replace(/&lt;/g, '<');
        md = md.replace(/&gt;/g, '>');
        
        md = md.replace(/\n{3,}/g, '\n\n');
        
        return md.trim();
      }

      /* === MANEJO DE IMÁGENES === */
      function getImageContainer(img) {
        if (img.parentElement && img.parentElement.classList.contains('image-figure')) {
          return img.parentElement;
        }
        return img;
      }

      function setActiveAlignButton(activeClass) {
        Object.values(alignButtons).forEach(btn => btn?.classList.remove('active'));
        switch (activeClass) {
          case 'float-left':
            alignButtons.left?.classList.add('active');
            break;
          case 'center-block':
            alignButtons.center?.classList.add('active');
            break;
          case 'float-right':
            alignButtons.right?.classList.add('active');
            break;
          case 'inline-image':
            alignButtons.inline?.classList.add('active');
            break;
        }
      }

      function getImageNaturalWidth(img) {
        if (!img) return 0;
        const attrWidth = parseFloat(img.getAttribute('width') || '');
        const natural = img.naturalWidth || attrWidth || img.width || img.getBoundingClientRect().width || 0;
        if (natural > 0) {
          img.dataset.originalWidth = String(Math.round(natural));
          return natural;
        }
        const stored = parseFloat(img.dataset.originalWidth || '');
        if (!Number.isNaN(stored) && stored > 0) {
          return stored;
        }
        return 0;
      }

      function getImageWidthPx(img) {
        if (!img) return 0;
        const styleWidth = parseFloat(img.style.width || '');
        if (!Number.isNaN(styleWidth) && styleWidth > 0) {
          return styleWidth;
        }
        if (img.width) {
          return img.width;
        }
        const rectWidth = img.getBoundingClientRect().width;
        if (rectWidth > 0) {
          return rectWidth;
        }
        return getImageNaturalWidth(img) || 0;
      }

      function setImageWidthPx(img, width) {
        if (!img) return 0;
        const clamped = Math.max(IMAGE_MIN_WIDTH, Math.min(IMAGE_MAX_WIDTH, Math.round(width)));
        img.style.width = clamped + 'px';
        if (!img.style.height) {
          img.style.height = 'auto';
        }
        return clamped;
      }

      function ensureFloatingNoteImageInitialSize(img, container) {
        if (!img || !container) return;
        if (img.dataset.initialSizeLocked === 'true') {
          return;
        }

        const finalize = () => {
          const containerWidth = container.clientWidth || container.getBoundingClientRect().width || 0;
          if (containerWidth <= 0) {
            img.dataset.initialSizeLocked = 'true';
            return;
          }

          const naturalWidth = getImageNaturalWidth(img);
          const rectWidth = img.getBoundingClientRect().width || 0;
          const currentWidth = rectWidth || naturalWidth || 0;

          if (currentWidth > containerWidth) {
            const targetWidth = Math.min(containerWidth, naturalWidth || containerWidth);
            img.style.width = Math.round(targetWidth) + 'px';
            img.style.height = 'auto';
          }

          img.dataset.initialSizeLocked = 'true';
        };

        if (img.complete) {
          finalize();
        } else {
          img.addEventListener('load', finalize, { once: true });
          img.addEventListener('error', () => {
            img.dataset.initialSizeLocked = 'true';
          }, { once: true });
        }
      }

      function markFloatingNoteImagesInitialized(container) {
        if (!container) return;
        container.querySelectorAll('img').forEach(img => {
          if (!img.dataset.initialSizeLocked) {
            img.dataset.initialSizeLocked = 'true';
          }
        });
      }

      function updateWidthDisplayForImage(img) {
        if (!widthDisplay) return;
        if (!img) {
          widthDisplay.textContent = '';
          return;
        }
        const current = getImageWidthPx(img);
        const natural = getImageNaturalWidth(img);
        const percent = natural > 0 ? Math.round((current / natural) * 100) : null;
        const roundedWidth = Math.max(1, Math.round(current));
        if (percent !== null && Number.isFinite(percent)) {
          widthDisplay.textContent = `${percent}% (${roundedWidth}px)`;
        } else {
          widthDisplay.textContent = `${roundedWidth}px`;
        }
      }

      function changeSelectedImageWidth(multiplier) {
        if (!selectedImage) return;
        const current = getImageWidthPx(selectedImage) || getImageNaturalWidth(selectedImage) || 200;
        setImageWidthPx(selectedImage, current * multiplier);
        updateWidthDisplayForImage(selectedImage);
        repositionImageToolbar();
      }

      function updateToolbarPosition(img) {
        if (!imageToolbar || !img) return;

        if (!document.body.contains(imageToolbar)) {
          document.body.appendChild(imageToolbar);
        }

        imageToolbar.classList.add('show');

        const rect = img.getBoundingClientRect();
        const toolbarWidth = imageToolbar.offsetWidth || 240;
        const toolbarHeight = imageToolbar.offsetHeight || 160;

        let left = rect.left;
        let top = rect.top - toolbarHeight - 10;

        if (top < 10) {
          top = rect.bottom + 10;
        }

        if (top + toolbarHeight > window.innerHeight - 10) {
          top = Math.max(10, window.innerHeight - toolbarHeight - 10);
        }

        if (left + toolbarWidth > window.innerWidth - 10) {
          left = window.innerWidth - toolbarWidth - 10;
        }

        if (left < 10) {
          left = 10;
        }

        imageToolbar.style.left = left + 'px';
        imageToolbar.style.top = top + 'px';
      }

      function updateToolbarState(img) {
        if (!img) return;

        if (imageAltInput) {
          imageAltInput.value = img.getAttribute('alt') || '';
        }

        if (imageFrameToggle) {
          imageFrameToggle.checked = img.classList.contains('image-frame');
        }

        if (wrapFigureBtn && unwrapFigureBtn) {
          const isWrapped = img.parentElement?.classList.contains('image-figure') || false;
          wrapFigureBtn.disabled = isWrapped;
          unwrapFigureBtn.disabled = !isWrapped;
        }

        const container = getImageContainer(img);
        const activeFloat = floatClasses.find(cls => container.classList.contains(cls));
        setActiveAlignButton(activeFloat);

        updateWidthDisplayForImage(img);

        if (cropImageBtn) {
          cropImageBtn.disabled = false;
        }
      }

      function updateCropScale() {
        if (!imageCropPreview) return;
        const rect = imageCropPreview.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          cropState.scaleX = imageCropPreview.naturalWidth / rect.width;
          cropState.scaleY = imageCropPreview.naturalHeight / rect.height;
        }
      }

      function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
      }

      function setCropSelection(startX, startY, currentX, currentY) {
        if (!imageCropStage || !imageCropSelection || !imageCropPreview) return;
        const stageRect = imageCropStage.getBoundingClientRect();
        const imageRect = imageCropPreview.getBoundingClientRect();
        const x1 = clamp(startX, imageRect.left, imageRect.right);
        const y1 = clamp(startY, imageRect.top, imageRect.bottom);
        const x2 = clamp(currentX, imageRect.left, imageRect.right);
        const y2 = clamp(currentY, imageRect.top, imageRect.bottom);
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const width = Math.abs(x1 - x2);
        const height = Math.abs(y1 - y2);

        cropState.currentRect = { left, top, width, height };
        imageCropSelection.style.left = (left - stageRect.left) + 'px';
        imageCropSelection.style.top = (top - stageRect.top) + 'px';
        imageCropSelection.style.width = width + 'px';
        imageCropSelection.style.height = height + 'px';

        if (width < 3 || height < 3) {
          if (imageCropSizeLabel) imageCropSizeLabel.textContent = '0 × 0 px';
          if (imageCropApplyBtn) imageCropApplyBtn.disabled = true;
          return;
        }

        const naturalWidth = Math.round(width * cropState.scaleX);
        const naturalHeight = Math.round(height * cropState.scaleY);
        if (imageCropSizeLabel) {
          imageCropSizeLabel.textContent = `${naturalWidth} × ${naturalHeight} px`;
        }
        if (imageCropApplyBtn) {
          imageCropApplyBtn.disabled = !(naturalWidth > 0 && naturalHeight > 0);
        }
      }

      function openImageCropModal(img) {
        if (!imageCropModal || !imageCropPreview) return;
        cropState.image = img;
        cropState.isSelecting = false;
        cropState.currentRect = null;
        cropState.scaleX = 1;
        cropState.scaleY = 1;
        if (imageCropSelection) {
          imageCropSelection.classList.remove('show');
        }
        if (imageCropSizeLabel) {
          imageCropSizeLabel.textContent = '0 × 0 px';
        }
        if (imageCropApplyBtn) {
          imageCropApplyBtn.disabled = true;
        }
        imageCropPreview.src = img.src;
        imageCropModal.classList.add('show');
        imageCropModal.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(updateCropScale);
      }

      function closeImageCropModal() {
        if (!imageCropModal) return;
        imageCropModal.classList.remove('show');
        imageCropModal.setAttribute('aria-hidden', 'true');
        cropState.image = null;
        cropState.isSelecting = false;
        cropState.currentRect = null;
        if (imageCropSelection) {
          imageCropSelection.classList.remove('show');
        }
        if (imageCropApplyBtn) {
          imageCropApplyBtn.disabled = true;
        }
        if (imageCropSizeLabel) {
          imageCropSizeLabel.textContent = '0 × 0 px';
        }
      }

      function repositionImageToolbar() {
        if (selectedImage) {
          updateToolbarPosition(selectedImage);
        }
      }

      window.addEventListener('scroll', repositionImageToolbar, { passive: true });
      window.addEventListener('resize', repositionImageToolbar);
      window.addEventListener('scroll', repositionTemplateToolbar, { passive: true });
      window.addEventListener('resize', repositionTemplateToolbar);
      window.addEventListener('scroll', () => {
        closeFloatingNoteStyleMenu();
        if (isTopicNotesPopoverOpen()) {
          positionTopicNotesPopover(topicNotesAnchor);
        }
      }, { passive: true });
      window.addEventListener('resize', () => {
        closeFloatingNoteStyleMenu();
        if (isTopicNotesPopoverOpen()) {
          positionTopicNotesPopover(topicNotesAnchor);
        }
      });

      imageCropPreview?.addEventListener('load', updateCropScale);

      window.addEventListener('resize', () => {
        if (imageCropModal?.classList.contains('show')) {
          requestAnimationFrame(updateCropScale);
        }
      });

      cropImageBtn?.addEventListener('click', () => {
        if (!selectedImage) {
          alert('Selecciona una imagen para recortar.');
          return;
        }
        openImageCropModal(selectedImage);
      });

      const finishCropSelection = (event) => {
        if (!cropState.isSelecting) return;
        cropState.isSelecting = false;
        try {
          imageCropStage?.releasePointerCapture(event.pointerId);
        } catch (err) {
          /* ignore */
        }
        if (!cropState.currentRect || cropState.currentRect.width < 3 || cropState.currentRect.height < 3) {
          cropState.currentRect = null;
          imageCropSelection?.classList.remove('show');
          if (imageCropSizeLabel) imageCropSizeLabel.textContent = '0 × 0 px';
          if (imageCropApplyBtn) imageCropApplyBtn.disabled = true;
        }
      };

      imageCropStage?.addEventListener('pointerdown', (event) => {
        if (!imageCropModal?.classList.contains('show') || !cropState.image || !imageCropPreview?.complete) return;
        const imageRect = imageCropPreview.getBoundingClientRect();
        if (imageRect.width === 0 || imageRect.height === 0) return;
        const withinImage = event.clientX >= imageRect.left && event.clientX <= imageRect.right
          && event.clientY >= imageRect.top && event.clientY <= imageRect.bottom;
        if (!withinImage) return;
        cropState.isSelecting = true;
        cropState.startX = event.clientX;
        cropState.startY = event.clientY;
        setCropSelection(cropState.startX, cropState.startY, cropState.startX, cropState.startY);
        imageCropSelection?.classList.add('show');
        if (imageCropApplyBtn) imageCropApplyBtn.disabled = true;
        if (imageCropSizeLabel) imageCropSizeLabel.textContent = '0 × 0 px';
        try {
          imageCropStage.setPointerCapture(event.pointerId);
        } catch (err) {
          /* ignore */
        }
        event.preventDefault();
      });

      imageCropStage?.addEventListener('pointermove', (event) => {
        if (!cropState.isSelecting) return;
        setCropSelection(cropState.startX, cropState.startY, event.clientX, event.clientY);
        event.preventDefault();
      });

      imageCropStage?.addEventListener('pointerup', finishCropSelection);
      imageCropStage?.addEventListener('pointerleave', finishCropSelection);
      imageCropStage?.addEventListener('pointercancel', finishCropSelection);

      imageCropApplyBtn?.addEventListener('click', () => {
        if (!cropState.image || !cropState.currentRect || !imageCropPreview) return;
        const { left, top, width, height } = cropState.currentRect;
        if (width < 3 || height < 3) {
          alert('Selecciona un área mayor para recortar.');
          return;
        }
        const imageRect = imageCropPreview.getBoundingClientRect();
        const sx = Math.round((left - imageRect.left) * cropState.scaleX);
        const sy = Math.round((top - imageRect.top) * cropState.scaleY);
        const sw = Math.round(width * cropState.scaleX);
        const sh = Math.round(height * cropState.scaleY);
        if (sw <= 1 || sh <= 1) {
          alert('El recorte seleccionado es demasiado pequeño.');
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          alert('No se pudo preparar el recorte.');
          return;
        }

        const source = new Image();
        source.crossOrigin = 'anonymous';
        source.onload = () => {
          try {
            ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
            const dataUrl = canvas.toDataURL('image/png');
            cropState.image.src = dataUrl;
            cropState.image.removeAttribute('height');
            cropState.image.style.height = 'auto';
            updateToolbarState(cropState.image);
            repositionImageToolbar();
            closeImageCropModal();
          } catch (error) {
            console.error('Error al recortar la imagen:', error);
            alert('No se pudo recortar la imagen.');
          }
        };
        source.onerror = () => {
          alert('No se pudo cargar la imagen para recortar.');
        };
        source.src = cropState.image.src;
      });

      imageCropCancelBtn?.addEventListener('click', closeImageCropModal);
      imageCropCloseBtn?.addEventListener('click', closeImageCropModal);

      imageCropModal?.addEventListener('click', (event) => {
        if (event.target === imageCropModal) {
          closeImageCropModal();
        }
      });

      function showImageToolbar(img) {
        hideTemplateToolbar();
        if (selectedImage && selectedImage !== img) {
          selectedImage.classList.remove('selected-image');
        }
        selectedImage = img;
        img.classList.add('selected-image');

        updateToolbarState(img);
        updateToolbarPosition(img);
      }

      function hideImageToolbar() {
        if (selectedImage) {
          selectedImage.classList.remove('selected-image');
          selectedImage = null;
        }
        imageToolbar.classList.remove('show');
        if (cropImageBtn) {
          cropImageBtn.disabled = true;
        }
      }

      document.addEventListener('click', (e) => {
        if (isEditMode && e.target.tagName === 'IMG') {
          if (document.body.classList.contains('image-viewer-open')) {
            hideImageToolbar();
          } else {
            e.preventDefault();
            showImageToolbar(e.target);
          }
        } else if (!e.target.closest('#imageToolbar') && !e.target.closest('img') && !e.target.closest('.image-figure')) {
          hideImageToolbar();
        }

        if (isEditMode) {
          const templateBlock = e.target.closest('.template-block');
          if (templateBlock) {
            showTemplateToolbar(templateBlock);
          } else if (!e.target.closest('#templateToolbar')) {
            hideTemplateToolbar();
          }
        } else if (!e.target.closest('#templateToolbar')) {
          hideTemplateToolbar();
        }
      });

      document.addEventListener('click', (event) => {
        const toggle = event.target.closest('.collapse-card-toggle');
        if (!toggle) return;
        const card = toggle.closest('.collapse-card');
        if (!card) return;
        const collapsed = card.classList.toggle('collapsed');
        toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      });

      document.addEventListener('click', (event) => {
        if (!activeFloatingNoteStyleMenu) return;
        if (event.target.closest('.floating-note-style-menu')) return;
        if (event.target.closest('.floating-note-header')) return;
        closeFloatingNoteStyleMenu();
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          closeFloatingNoteStyleMenu();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (!isEditMode || !selectedImage) return;
        if (event.defaultPrevented) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const activeElement = document.activeElement;
        if (activeElement && /^(INPUT|TEXTAREA|SELECT)$/i.test(activeElement.tagName)) {
          return;
        }
        if (event.key === '+' || (event.key === '=' && event.shiftKey)) {
          event.preventDefault();
          changeSelectedImageWidth(1 + IMAGE_RESIZE_STEP);
        } else if (event.key === '-' || event.key === '_') {
          event.preventDefault();
          changeSelectedImageWidth(1 - IMAGE_RESIZE_STEP);
        }
      });

      /* === NOTAS FLOTANTES === */
      function getFloatingNoteStyle(styleId) {
        const preset = NOTE_STYLE_PRESETS.find(preset => preset.id === styleId);
        if (preset) {
          return preset;
        }
        return NOTE_STYLE_PRESETS.find(preset => preset.id === DEFAULT_NOTE_STYLE) || NOTE_STYLE_PRESETS[0];
      }

      function resolveFloatingNoteBorderBase(note) {
        if (!note) {
          return {
            color: FLOATING_NOTE_BORDER_DEFAULT_COLOR,
            width: FLOATING_NOTE_BORDER_DEFAULT_WIDTH
          };
        }
        const computed = window.getComputedStyle(note);
        const widthValue = parseFloat(computed.borderTopWidth);
        return {
          color: normalizeColorToHex(computed.borderTopColor, FLOATING_NOTE_BORDER_DEFAULT_COLOR),
          width: Number.isFinite(widthValue) ? widthValue : FLOATING_NOTE_BORDER_DEFAULT_WIDTH
        };
      }

      function applyFloatingNoteBorderState(note, options = {}, { persist = true } = {}) {
        if (!note) return null;
        const { color, width, enabled } = options || {};
        const noteId = note.dataset.noteId || null;
        const currentData = noteId ? notesRegistry.get(noteId) : null;
        const base = resolveFloatingNoteBorderBase(note);

        const requestedColor = typeof color === 'string' && color.trim()
          ? normalizeColorToHex(color.trim(), color.trim())
          : null;
        const requestedWidth = Number.isFinite(width) ? Math.max(Number(width), 0) : null;
        const requestedEnabled = enabled === undefined ? null : !!enabled;

        const datasetColor = typeof note.dataset.borderColor === 'string' && note.dataset.borderColor.trim()
          ? note.dataset.borderColor.trim()
          : null;
        const datasetWidth = Number.isFinite(parseFloat(note.dataset.borderWidth))
          ? Math.max(parseFloat(note.dataset.borderWidth), 0)
          : null;
        const datasetEnabled = note.dataset.borderEnabled === 'false' ? false : (note.dataset.borderEnabled === 'true' ? true : null);

        const currentColor = requestedColor
          || (datasetColor ? normalizeColorToHex(datasetColor, datasetColor) : null)
          || (typeof currentData?.borderColor === 'string' && currentData.borderColor ? normalizeColorToHex(currentData.borderColor, currentData.borderColor) : null)
          || base.color;
        const currentWidth = requestedWidth
          ?? (datasetWidth ?? (Number.isFinite(currentData?.borderWidth) ? Math.max(Number(currentData.borderWidth), 0) : base.width));
        const currentEnabled = requestedEnabled
          ?? (datasetEnabled ?? (currentData?.borderEnabled === false ? false : true));

        const finalWidth = currentEnabled
          ? (currentWidth > 0 ? currentWidth : FLOATING_NOTE_BORDER_DEFAULT_WIDTH)
          : currentWidth;
        const finalColor = normalizeColorToHex(currentColor, base.color).toLowerCase();

        note.dataset.borderEnabled = currentEnabled ? 'true' : 'false';
        note.dataset.borderWidth = String(Math.max(finalWidth, 0));
        note.dataset.borderColor = finalColor;

        if (currentEnabled && Math.max(finalWidth, 0) > 0) {
          note.style.borderStyle = 'solid';
          note.style.borderWidth = `${Math.max(finalWidth, 0)}px`;
          note.style.borderColor = finalColor;
        } else {
          note.style.borderStyle = 'none';
          note.style.borderWidth = '0';
          note.style.borderColor = finalColor;
        }

        if (persist && noteId) {
          const updates = {
            borderEnabled: currentEnabled,
            borderColor: finalColor,
            borderWidth: Math.max(finalWidth, 0)
          };
          updateNoteData(noteId, updates, { silent: true });
        }

        return {
          enabled: currentEnabled,
          color: finalColor,
          width: Math.max(finalWidth, 0)
        };
      }

      function applyFloatingNoteStyle(note, styleId) {
        if (!note) return;
        const preset = getFloatingNoteStyle(styleId);
        NOTE_STYLE_PRESETS.forEach(presetOption => {
          if (presetOption.className) {
            note.classList.remove(presetOption.className);
          }
        });
        if (preset?.className) {
          note.classList.add(preset.className);
        }
        note.dataset.style = preset?.id || 'default';
        const noteId = note.dataset.noteId;
        if (noteId) {
          updateNoteData(noteId, { style: note.dataset.style }, { silent: true });
        }
        const menu = note.querySelector('.floating-note-style-menu');
        if (menu) {
          syncFloatingNoteStyleMenu(menu, note.dataset.style);
          const noteData = noteId ? notesRegistry.get(noteId) : null;
          if (noteData) {
            syncNoteOptionsMenu(menu, noteData);
          }
        }
        applyFloatingNoteBorderState(note, {}, { persist: false });
      }

      function sanitizeFloatingNotePasteHtml(rawHtml) {
        if (typeof rawHtml !== 'string' || !rawHtml.trim()) {
          return '';
        }

        const container = document.createElement('div');
        container.innerHTML = rawHtml;

        const nodes = container.querySelectorAll('*');
        nodes.forEach(node => {
          if (!(node instanceof HTMLElement)) {
            return;
          }
          if (node.hasAttribute('bgcolor')) {
            node.removeAttribute('bgcolor');
          }
          if (node.style) {
            node.style.removeProperty('background');
            node.style.removeProperty('background-color');
            node.style.removeProperty('background-image');
            node.style.removeProperty('-webkit-text-fill-color');
            if (!node.getAttribute('style')?.trim()) {
              node.removeAttribute('style');
            }
          }
        });

        return container.innerHTML;
      }

      function cloneSuperTabs(tabs = []) {
        return Array.isArray(tabs)
          ? tabs.map(tab => ({
              ...tab,
              pages: Array.isArray(tab.pages)
                ? tab.pages.map(page => ({ ...page }))
                : []
            }))
          : [];
      }

      function updateSuperNoteBody(note, noteData) {
        const body = note.querySelector('.floating-note-body');
        if (!body) {
          return;
        }
        const html = noteData?.html || '';
        if (body.innerHTML !== html) {
          body.innerHTML = html;
          markFloatingNoteImagesInitialized(body);
        }
      }

      function getSuperNoteTabFallbackTitle(index) {
        return `Pestaña ${index + 1}`;
      }

      function getSuperNoteTabDisplayTitle(tab, index) {
        const fallback = getSuperNoteTabFallbackTitle(index);
        const sourceTitle = typeof tab?.title === 'string' && tab.title.trim().length
          ? tab.title.trim()
          : fallback;
        const normalized = sourceTitle.slice(0, SUPER_NOTE_TAB_TITLE_MAX_LENGTH);
        const shouldEllipsize = tab?.titleOverflow === true || sourceTitle.length > SUPER_NOTE_TAB_TITLE_MAX_LENGTH;
        if (!shouldEllipsize) {
          return normalized;
        }
        const base = normalized.slice(0, Math.max(SUPER_NOTE_TAB_TITLE_MAX_LENGTH - 3, 0)).trimEnd();
        return base.length ? `${base}...` : '...';
      }

      function selectElementContents(element) {
        if (!element) return;
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        if (!selection) return;
        selection.removeAllRanges();
        selection.addRange(range);
      }

      function hideSuperNoteColorPanel(note, { clearTarget = true } = {}) {
        if (!note) return;
        const ui = note._ui || {};
        const panel = ui.tabColorPanel;
        if (panel) {
          panel.dataset.visible = 'false';
        }
        if (clearTarget) {
          delete note.dataset.colorTargetTab;
          note.querySelectorAll('.super-note-tab').forEach(button => {
            button.classList.remove('super-note-tab-coloring');
          });
        }
      }

      function showSuperNoteColorPanel(note) {
        if (!note) return;
        const ui = note._ui || {};
        const panel = ui.tabColorPanel;
        if (panel) {
          panel.dataset.visible = 'true';
        }
      }

      function syncSuperNoteColorPanel(note, noteData) {
        if (!note) return;
        const ui = note._ui || {};
        const panel = ui.tabColorPanel;
        if (!panel) {
          return;
        }
        const targetId = note.dataset.colorTargetTab;
        if (!targetId) {
          panel.dataset.visible = 'false';
          ui.colorSwatches?.forEach(button => {
            button.classList.remove('active');
            button.setAttribute('aria-pressed', 'false');
          });
          note.querySelectorAll('.super-note-tab').forEach(button => {
            button.classList.remove('super-note-tab-coloring');
          });
          return;
        }
        const current = noteData || (note.dataset.noteId ? notesRegistry.get(note.dataset.noteId) : null);
        const targetTab = (current?.superTabs || []).find(tab => tab.id === targetId) || null;
        const targetColor = normalizeColorValue(targetTab?.color || SUPER_NOTE_DEFAULT_TAB_COLOR);
        note.querySelectorAll('.super-note-tab').forEach(button => {
          const isTarget = button.dataset.tabId === targetId;
          button.classList.toggle('super-note-tab-coloring', isTarget);
        });
        ui.colorSwatches?.forEach(button => {
          const buttonColor = normalizeColorValue(button.dataset.color);
          const isActive = buttonColor === targetColor;
          button.classList.toggle('active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        panel.dataset.visible = 'true';
      }

      function startSuperNoteTabInlineEdit(note, tabId) {
        if (!note || !tabId) return false;
        const noteId = note.dataset.noteId;
        if (!noteId) return false;
        const ui = note._ui || {};
        const selector = `.super-note-tab[data-tab-id="${CSS.escape(tabId)}"]`;
        const tabButton = note.querySelector(selector);
        if (!tabButton) return false;
        if (tabButton.dataset.editing === 'true') {
          return true;
        }
        const titleSpan = tabButton.querySelector('.super-note-tab-title');
        if (!titleSpan) return false;
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        if (!current) return false;
        const tabs = Array.isArray(current.superTabs) ? current.superTabs : [];
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return false;
        const tab = tabs[tabIndex];
        const baseTitle = typeof tab?.title === 'string' && tab.title.trim().length
          ? tab.title.trim()
          : getSuperNoteTabFallbackTitle(tabIndex);
        tabButton.dataset.editing = 'true';
        titleSpan.setAttribute('contenteditable', 'true');
        titleSpan.dataset.editing = 'true';
        titleSpan.spellcheck = false;
        titleSpan.textContent = baseTitle;
        requestAnimationFrame(() => {
          titleSpan.focus();
          selectElementContents(titleSpan);
        });
        hideSuperNoteColorPanel(note);
        ui.activeEditingTabId = tabId;
        note._ui = ui;
        return true;
      }

      function finishSuperNoteTabInlineEdit(note, tabId, { cancel = false } = {}) {
        if (!note || !tabId) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const ui = note._ui || {};
        const selector = `.super-note-tab[data-tab-id="${CSS.escape(tabId)}"]`;
        const tabButton = note.querySelector(selector);
        const titleSpan = tabButton?.querySelector('.super-note-tab-title');
        if (titleSpan) {
          titleSpan.removeAttribute('contenteditable');
          delete titleSpan.dataset.editing;
        }
        if (tabButton) {
          delete tabButton.dataset.editing;
        }
        if (ui.activeEditingTabId === tabId) {
          delete ui.activeEditingTabId;
        }
        note._ui = ui;

        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        if (!current) return;
        if (cancel) {
          syncNoteElementMeta(note, current);
          return;
        }
        const rawText = titleSpan ? (titleSpan.textContent || '') : '';
        const normalized = rawText.replace(/[\s\u00A0]+/g, ' ').trim();
        const tabs = cloneSuperTabs(current.superTabs);
        const index = tabs.findIndex(tab => tab.id === tabId);
        if (index === -1) {
          syncNoteElementMeta(note, current);
          return;
        }
        const existing = tabs[index];
        const overflow = normalized.length > SUPER_NOTE_TAB_TITLE_MAX_LENGTH;
        const truncated = normalized.slice(0, Math.max(SUPER_NOTE_TAB_TITLE_MAX_LENGTH, 0));
        const finalTitle = truncated.length ? truncated : null;
        const overflowFlag = overflow && !!finalTitle;
        if (finalTitle === (existing.title || null) && overflowFlag === (existing.titleOverflow === true)) {
          syncNoteElementMeta(note, current);
          return;
        }
        const nowIso = new Date().toISOString();
        tabs[index] = {
          ...existing,
          title: finalTitle,
          titleOverflow: overflowFlag,
          updatedAt: nowIso
        };
        const updated = updateNoteData(noteId, { superTabs: tabs, updatedAt: nowIso });
        syncNoteElementMeta(note, updated);
      }


      function renderSuperNoteUI(note, noteData) {
        if (!note) return;
        const ui = note._ui || {};
        const isSuper = noteData?.superNote === true;
        if (!isSuper) {
          note.classList.remove('super-note');
          delete note.dataset.superNote;
          hideSuperNoteColorPanel(note);
          delete note.dataset.colorTargetTab;
          if (ui.tabBar?.parentNode) {
            ui.tabBar.remove();
          }
          ui.tabBar = null;
          ui.tabList = null;
          ui.tabControls = null;
          ui.tabAddButton = null;
          if (ui.tabColorInput?.parentNode) {
            ui.tabColorInput.remove();
          }
          ui.tabColorInput = null;
          ui.tabColorPanel = null;
          ui.colorSwatches = null;
          if (ui.colorPanelDismissHandler) {
            document.removeEventListener('pointerdown', ui.colorPanelDismissHandler);
            ui.colorPanelDismissHandler = null;
          }
          if (ui.categoryWrap) {
            ui.categoryWrap.classList.remove('super-note-hidden-title');
            ui.categoryWrap.removeAttribute('aria-hidden');
            if (ui.categoryLabel) {
              ui.categoryWrap.dataset.editableTitle = ui.categoryLabel.contentEditable === 'true' ? 'true' : 'false';
            }
          }
          delete ui.activeEditingTabId;
          note._ui = ui;
          return;
        }

        note.classList.add('super-note');
        note.dataset.superNote = 'true';
        if (ui.categoryWrap) {
          ui.categoryWrap.classList.add('super-note-hidden-title');
          ui.categoryWrap.setAttribute('aria-hidden', 'true');
          ui.categoryWrap.dataset.editableTitle = 'false';
        }

        let tabBar = ui.tabBar;
        let tabList = ui.tabList;
        let tabControls = ui.tabControls;
        if (!tabBar || !note.contains(tabBar)) {
          tabBar = document.createElement('div');
          tabBar.className = 'super-note-tab-bar';
          tabList = document.createElement('div');
          tabList.className = 'super-note-tab-list';
          tabControls = document.createElement('div');
          tabControls.className = 'super-note-tab-controls';
          tabBar.append(tabList, tabControls);
          note.insertBefore(tabBar, note.firstChild);
          ui.tabBar = tabBar;
          ui.tabList = tabList;
          ui.tabControls = tabControls;
        } else {
          tabList = ui.tabList || tabBar.querySelector('.super-note-tab-list');
          tabControls = ui.tabControls || tabBar.querySelector('.super-note-tab-controls');
        }
        if (!tabList) {
          tabList = document.createElement('div');
          tabList.className = 'super-note-tab-list';
          tabBar.insertBefore(tabList, tabBar.firstChild);
          ui.tabList = tabList;
        }
        if (!tabControls) {
          tabControls = document.createElement('div');
          tabControls.className = 'super-note-tab-controls';
          tabBar.appendChild(tabControls);
          ui.tabControls = tabControls;
        }
        tabList.innerHTML = '';
        tabControls.innerHTML = '';

        let colorInput = ui.tabColorInput;
        if (!colorInput || colorInput.parentNode !== note) {
          if (colorInput?.parentNode) {
            colorInput.parentNode.removeChild(colorInput);
          }
          colorInput = document.createElement('input');
          colorInput.type = 'color';
          colorInput.className = 'super-note-color-input';
          colorInput.tabIndex = -1;
          colorInput.style.position = 'absolute';
          colorInput.style.opacity = '0';
          colorInput.style.pointerEvents = 'none';
          note.appendChild(colorInput);
          colorInput.addEventListener('input', () => {
            const targetTab = note.dataset.colorTargetTab;
            if (!targetTab) return;
            applySuperNoteTabColor(note, targetTab, colorInput.value);
          });
          colorInput.addEventListener('change', () => {
            hideSuperNoteColorPanel(note);
          });
          ui.tabColorInput = colorInput;
        }

        const tabs = Array.isArray(noteData?.superTabs) ? noteData.superTabs : [];
        const activeId = noteData?.activeSuperTabId || (tabs[0]?.id ?? null);
        const colorTargetId = note.dataset.colorTargetTab || '';

        const colorPanel = document.createElement('div');
        colorPanel.className = 'super-note-color-panel';
        colorPanel.dataset.visible = 'false';
        const swatches = SUPER_NOTE_PRESET_COLORS.map(color => {
          const swatch = document.createElement('button');
          swatch.type = 'button';
          swatch.className = 'super-note-color-swatch';
          swatch.dataset.color = color;
          swatch.style.setProperty('--super-tab-swatch-color', color);
          swatch.title = `Usar color ${color}`;
          swatch.addEventListener('click', (event) => {
            event.stopPropagation();
            const targetTab = note.dataset.colorTargetTab || activeId || (tabs[0]?.id ?? null);
            if (!targetTab) return;
            applySuperNoteTabColor(note, targetTab, color);
            hideSuperNoteColorPanel(note);
          });
          return swatch;
        });
        swatches.forEach(button => colorPanel.appendChild(button));

        const customColorBtn = document.createElement('button');
        customColorBtn.type = 'button';
        customColorBtn.className = 'super-note-color-custom';
        customColorBtn.title = 'Elegir color personalizado';
        customColorBtn.textContent = '🎨';
        customColorBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          const noteId = note.dataset.noteId;
          if (!noteId) return;
          const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
          const targetTabId = note.dataset.colorTargetTab || activeId || (tabs[0]?.id ?? null);
          if (!targetTabId) {
            return;
          }
          const targetTab = (current?.superTabs || []).find(tab => tab.id === targetTabId);
          const normalizedColor = normalizeColorValue(targetTab?.color || SUPER_NOTE_DEFAULT_TAB_COLOR);
          note.dataset.colorTargetTab = targetTabId;
          if (colorInput) {
            colorInput.value = normalizedColor;
            colorInput.click();
          }
        });
        colorPanel.appendChild(customColorBtn);

        tabControls.appendChild(colorPanel);
        ui.tabColorPanel = colorPanel;
        ui.colorSwatches = swatches;

        let addBtn = ui.tabAddButton;
        if (!addBtn) {
          addBtn = document.createElement('button');
          addBtn.type = 'button';
          addBtn.className = 'super-note-tab-add';
          addBtn.title = 'Agregar pestaña';
          addBtn.textContent = '+';
          addBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            addSuperNoteTab(note);
          });
          ui.tabAddButton = addBtn;
        }
        tabControls.appendChild(addBtn);

        if (!ui.colorPanelDismissHandler) {
          const handler = (event) => {
            if (!note.isConnected) {
              document.removeEventListener('pointerdown', handler);
              ui.colorPanelDismissHandler = null;
              return;
            }
            if (event.target.closest('.super-note-color-panel')) {
              return;
            }
            if (event.target.closest('.super-note-tab-color-indicator')) {
              return;
            }
            hideSuperNoteColorPanel(note);
          };
          document.addEventListener('pointerdown', handler);
          ui.colorPanelDismissHandler = handler;
        }

        tabs.forEach((tab, index) => {
          const tabButton = document.createElement('button');
          tabButton.type = 'button';
          tabButton.className = 'super-note-tab';
          tabButton.dataset.tabId = tab.id;
          tabButton.style.setProperty('--super-tab-color', tab.color || SUPER_NOTE_DEFAULT_TAB_COLOR);
          tabButton.setAttribute('aria-pressed', tab.id === activeId ? 'true' : 'false');
          if (tab.id === activeId) {
            tabButton.classList.add('active');
          }
          if (colorTargetId && colorTargetId === tab.id) {
            tabButton.classList.add('super-note-tab-coloring');
          }

          const colorIndicator = document.createElement('span');
          colorIndicator.className = 'super-note-tab-color-indicator';
          colorIndicator.title = 'Cambiar color de pestaña';
          colorIndicator.addEventListener('click', (event) => {
            event.stopPropagation();
            openSuperNoteTabColorPicker(note, tab.id);
          });

          const titleSpan = document.createElement('span');
          titleSpan.className = 'super-note-tab-title';
          titleSpan.dataset.tabId = tab.id;
          titleSpan.textContent = getSuperNoteTabDisplayTitle(tab, index);
          const fullTitle = typeof tab?.title === 'string' && tab.title.trim().length
            ? tab.title.trim()
            : getSuperNoteTabFallbackTitle(index);
          titleSpan.title = fullTitle;
          tabButton.title = fullTitle;

          titleSpan.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              finishSuperNoteTabInlineEdit(note, tab.id);
            } else if (event.key === 'Escape') {
              event.preventDefault();
              finishSuperNoteTabInlineEdit(note, tab.id, { cancel: true });
            }
            event.stopPropagation();
          });

          titleSpan.addEventListener('blur', () => {
            if (titleSpan.dataset.editing === 'true') {
              finishSuperNoteTabInlineEdit(note, tab.id);
            }
          });

          tabButton.append(colorIndicator, titleSpan);

          if (tabs.length > 1) {
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'super-note-tab-remove';
            removeBtn.title = 'Eliminar pestaña';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', (event) => {
              event.stopPropagation();
              removeSuperNoteTab(note, tab.id);
            });
            tabButton.appendChild(removeBtn);
          }

          tabButton.addEventListener('click', (event) => {
            if (event.target.closest('.super-note-tab-remove')) {
              return;
            }
            if (event.target.closest('.super-note-tab-color-indicator')) {
              return;
            }
            if (tabButton.dataset.editing === 'true') {
              return;
            }
            if (tab.id !== activeId) {
              hideSuperNoteColorPanel(note);
              activateSuperNoteTab(note, tab.id);
            } else {
              startSuperNoteTabInlineEdit(note, tab.id);
            }
          });

          tabList.appendChild(tabButton);

          if (ui.activeEditingTabId === tab.id) {
            requestAnimationFrame(() => {
              startSuperNoteTabInlineEdit(note, tab.id);
            });
          }
        });

        syncSuperNoteColorPanel(note, noteData);
        note._ui = ui;
      }

      function activateSuperNoteTab(note, tabId) {
        if (!note || !tabId) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        hideSuperNoteColorPanel(note);
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        if (!current || current.activeSuperTabId === tabId) {
          return;
        }
        bringNoteToFront(note);
        const updated = updateNoteData(noteId, { activeSuperTabId: tabId });
        updateSuperNoteBody(note, updated);
        syncNoteElementMeta(note, updated);
      }

      function addSuperNoteTab(note) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        hideSuperNoteColorPanel(note);
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        if (!current) return;
        const tabs = cloneSuperTabs(current.superTabs);
        const nowIso = new Date().toISOString();
        const newTabId = generateUniqueId('super-tab');
        const newTab = {
          id: newTabId,
          title: `Pestaña ${tabs.length + 1}`,
          titleOverflow: false,
          color: SUPER_NOTE_DEFAULT_TAB_COLOR,
          pages: [{
            id: generateUniqueId('note-page'),
            title: null,
            html: '',
            content: '',
            createdAt: nowIso,
            updatedAt: nowIso
          }],
          currentPageIndex: 0,
          html: '',
          content: '',
          createdAt: nowIso,
          updatedAt: nowIso
        };
        const updated = updateNoteData(noteId, {
          superNote: true,
          superTabs: [...tabs, newTab],
          activeSuperTabId: newTabId,
          pages: newTab.pages,
          currentPageIndex: 0,
          html: '',
          content: ''
        });
        updateSuperNoteBody(note, updated);
        syncNoteElementMeta(note, updated);
        if (isEditMode) {
          setTimeout(() => {
            const body = note.querySelector('.floating-note-body');
            body?.focus();
          }, 0);
        }
      }

      function removeSuperNoteTab(note, tabId) {
        if (!note || !tabId) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        if (note.dataset.colorTargetTab === tabId) {
          hideSuperNoteColorPanel(note);
        }
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        if (!current) return;
        const tabs = cloneSuperTabs(current.superTabs);
        if (tabs.length <= 1) {
          window.alert('La super nota debe tener al menos una pestaña.');
          return;
        }
        const filtered = tabs.filter(tab => tab.id !== tabId);
        if (filtered.length === tabs.length) {
          return;
        }
        const nextActiveId = current.activeSuperTabId === tabId
          ? (filtered[0]?.id ?? null)
          : current.activeSuperTabId;
        const updated = updateNoteData(noteId, {
          superTabs: filtered,
          activeSuperTabId: nextActiveId
        });
        updateSuperNoteBody(note, updated);
        syncNoteElementMeta(note, updated);
      }

      function openSuperNoteTabColorPicker(note, tabId) {
        if (!note || !tabId) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        if (!current) return;
        const target = (current.superTabs || []).find(tab => tab.id === tabId);
        if (!target) return;
        const ui = note._ui || {};
        note.dataset.colorTargetTab = tabId;
        bringNoteToFront(note);
        if (ui.tabColorInput) {
          ui.tabColorInput.value = normalizeColorValue(target.color || SUPER_NOTE_DEFAULT_TAB_COLOR);
        }
        syncSuperNoteColorPanel(note, current);
        showSuperNoteColorPanel(note);
      }

      function applySuperNoteTabColor(note, tabId, color) {
        if (!note || !tabId) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        if (!current) return;
        const tabs = cloneSuperTabs(current.superTabs);
        const index = tabs.findIndex(tab => tab.id === tabId);
        if (index === -1) {
          return;
        }
        const normalizedColor = normalizeColorValue(color) || SUPER_NOTE_DEFAULT_TAB_COLOR;
        const nowIso = new Date().toISOString();
        tabs[index] = { ...tabs[index], color: normalizedColor, updatedAt: nowIso };
        const updated = updateNoteData(noteId, { superTabs: tabs, updatedAt: nowIso });
        syncNoteElementMeta(note, updated);
      }

      function toggleSuperNoteMode(note) {
        if (!note) return null;
        const noteId = note.dataset.noteId;
        if (!noteId) return null;
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        if (!current) return null;
        bringNoteToFront(note);

        if (current.superNote) {
          const activeTab = (current.superTabs || []).find(tab => tab.id === current.activeSuperTabId)
            || (current.superTabs || [])[0];
          const fallbackPages = activeTab?.pages?.map(page => ({ ...page }))
            || (current.pages || []).map(page => ({ ...page }));
          const updated = updateNoteData(noteId, {
            superNote: false,
            superTabs: [],
            activeSuperTabId: null,
            pages: fallbackPages,
            currentPageIndex: activeTab?.currentPageIndex ?? current.currentPageIndex ?? 0,
            html: activeTab?.html ?? current.html ?? '',
            content: activeTab?.content ?? current.content ?? '',
            type: NOTE_TYPES.FLOATING
          });
          updateSuperNoteBody(note, updated);
          syncNoteElementMeta(note, updated);
          return updated;
        }

        const basePages = Array.isArray(current.pages) && current.pages.length
          ? current.pages.map(page => ({ ...page }))
          : [{
              id: generateUniqueId('note-page'),
              title: null,
              html: current.html || '',
              content: current.content || '',
              createdAt: current.createdAt || new Date().toISOString(),
              updatedAt: current.updatedAt || new Date().toISOString()
            }];
        const nowIso = new Date().toISOString();
        const tabId = generateUniqueId('super-tab');
        const baseTitle = typeof current.title === 'string' ? current.title.trim() : '';
        const fallbackTitle = baseTitle || getSuperNoteTabFallbackTitle(0);
        const overflow = fallbackTitle.length > SUPER_NOTE_TAB_TITLE_MAX_LENGTH;
        const normalizedTitle = overflow
          ? fallbackTitle.slice(0, Math.max(SUPER_NOTE_TAB_TITLE_MAX_LENGTH, 0))
          : fallbackTitle.slice(0, Math.max(SUPER_NOTE_TAB_TITLE_MAX_LENGTH, 0));
        const storedTitle = normalizedTitle.length ? normalizedTitle : null;
        const defaultIndex = Math.min(
          Math.max(current.currentPageIndex || 0, 0),
          Math.max(basePages.length - 1, 0)
        );
        const tab = {
          id: tabId,
          title: storedTitle,
          titleOverflow: overflow && !!storedTitle,
          color: SUPER_NOTE_DEFAULT_TAB_COLOR,
          pages: basePages,
          currentPageIndex: defaultIndex,
          html: current.html || basePages[defaultIndex]?.html || '',
          content: current.content || basePages[defaultIndex]?.content || '',
          createdAt: nowIso,
          updatedAt: nowIso
        };
        const updated = updateNoteData(noteId, {
          superNote: true,
          superTabs: [tab],
          activeSuperTabId: tabId,
          pages: basePages,
          currentPageIndex: defaultIndex,
          html: tab.html,
          content: tab.content,
          type: NOTE_TYPES.SUPER
        });
        updateSuperNoteBody(note, updated);
        syncNoteElementMeta(note, updated);
        if (isEditMode) {
          setTimeout(() => {
            const body = note.querySelector('.floating-note-body');
            body?.focus();
          }, 0);
        }
        return updated;
      }

      function normalizeCustomIconValue(value) {
        if (typeof value !== 'string') {
          return null;
        }
        const trimmed = value.trim();
        if (!trimmed) {
          return null;
        }
        const glyphs = Array.from(trimmed);
        return glyphs.slice(0, 2).join('');
      }

      function applyNoteHeaderCompactState(note, compact, { persist = true } = {}) {
        if (!note) return false;
        const shouldCompact = !!compact;
        note.classList.toggle('floating-note-compact-header', shouldCompact);
        if (shouldCompact) {
          note.dataset.compactHeader = 'true';
        } else {
          delete note.dataset.compactHeader;
        }

        if (persist) {
          const noteId = note.dataset.noteId;
          if (noteId) {
            updateNoteData(noteId, { compactHeader: shouldCompact }, { silent: true });
          }
        }

        return shouldCompact;
      }

      function applyNoteUltraCompactState(note, ultraCompact, { persist = true } = {}) {
        if (!note) return false;
        const shouldUltra = ultraCompact === true;
        note.classList.toggle('floating-note-ultra-compact', shouldUltra);
        if (shouldUltra) {
          note.dataset.ultraCompact = 'true';
          applyNoteHeaderCompactState(note, false, { persist });
        } else {
          delete note.dataset.ultraCompact;
        }

        if (persist) {
          const noteId = note.dataset.noteId;
          if (noteId) {
            updateNoteData(noteId, { ultraCompact: shouldUltra }, { silent: true });
          }
        }

        return shouldUltra;
      }

      function applyNoteBehindState(note, behind, { persist = true } = {}) {
        if (!note) return false;
        const shouldBeBehind = !!behind;
        note.classList.toggle('floating-note-behind', shouldBeBehind);
        if (shouldBeBehind) {
          note.dataset.behindMainContent = 'true';
          note.setAttribute('aria-hidden', 'true');
        } else {
          delete note.dataset.behindMainContent;
          note.removeAttribute('aria-hidden');
        }
        if (persist) {
          const noteId = note.dataset.noteId;
          if (noteId) {
            updateNoteData(noteId, { behindMainContent: shouldBeBehind }, { silent: true });
          }
        }
        return shouldBeBehind;
      }

      function applyNoteHoverAnimationState(note, enabled, { persist = true } = {}) {
        if (!note) return false;
        const shouldAnimate = enabled === true;
        note.classList.toggle('floating-note-hover-animated', shouldAnimate);
        if (shouldAnimate) {
          note.dataset.hoverAnimation = 'true';
        } else {
          delete note.dataset.hoverAnimation;
        }
        if (persist) {
          const noteId = note.dataset.noteId;
          if (noteId) {
            updateNoteData(noteId, { hoverAnimation: shouldAnimate }, { silent: true });
          }
        }
        return shouldAnimate;
      }

      function toggleNoteHoverAnimation(note) {
        if (!note) return false;
        const nextState = !note.classList.contains('floating-note-hover-animated');
        return applyNoteHoverAnimationState(note, nextState);
      }

      function applyFloatingNoteTextNeutralState(note, keepNeutral, { persist = true } = {}) {
        if (!note) return false;
        const shouldKeepNeutral = keepNeutral === true;
        note.classList.toggle('floating-note-text-neutral', shouldKeepNeutral);
        if (shouldKeepNeutral) {
          note.dataset.textNeutral = 'true';
        } else {
          delete note.dataset.textNeutral;
        }
        if (persist) {
          const noteId = note.dataset.noteId;
          if (noteId) {
            updateNoteData(noteId, { styleNeutralText: shouldKeepNeutral }, { silent: true });
          }
        }
        return shouldKeepNeutral;
      }

      function toggleFloatingNoteNeutralText(note) {
        if (!note) return false;
        const nextState = note.dataset.textNeutral === 'true' ? false : true;
        return applyFloatingNoteTextNeutralState(note, nextState);
      }

      function setNoteCustomIcon(note, symbol) {
        if (!note) return null;
        const finalSymbol = normalizeCustomIconValue(symbol);
        const noteId = note.dataset.noteId;
        if (!noteId) {
          if (finalSymbol) {
            note.dataset.customIcon = finalSymbol;
          } else {
            delete note.dataset.customIcon;
          }
          const ui = note._ui || {};
          if (ui.categoryIcon) {
            const categoryInfo = getNoteCategoryInfo(note.dataset.category);
            ui.categoryIcon.textContent = finalSymbol || categoryInfo.icon;
          }
          return null;
        }

        const updated = updateNoteData(noteId, { customIcon: finalSymbol }, { silent: true })
          || notesRegistry.get(noteId);
        if (updated) {
          syncNoteElementMeta(note, updated);
        }
        return updated;
      }

      function toggleNoteHeaderCompact(note) {
        if (!note) return false;
        const nextState = !note.classList.contains('floating-note-compact-header');
        if (nextState) {
          applyNoteUltraCompactState(note, false);
        }
        applyNoteHeaderCompactState(note, nextState);
        return nextState;
      }

      function toggleNoteUltraCompact(note) {
        if (!note) return false;
        const nextState = note.dataset.ultraCompact === 'true' ? false : true;
        return applyNoteUltraCompactState(note, nextState);
      }

      function toggleNoteBehindMain(note) {
        if (!note) return false;
        const nextState = !note.classList.contains('floating-note-behind');
        applyNoteBehindState(note, nextState);
        if (!nextState) {
          bringNoteToFront(note);
        }
        return nextState;
      }

      function resolveNoteTopicId(note) {
        if (!note) return '';
        const datasetTopicId = (note.dataset.topicId || '').trim();
        if (datasetTopicId) {
          return datasetTopicId;
        }
        const noteId = note.dataset.noteId;
        if (noteId) {
          const noteData = notesRegistry.get(noteId);
          if (noteData?.topicId) {
            const topicValue = String(noteData.topicId).trim();
            note.dataset.topicId = topicValue;
            return topicValue;
          }
        }
        return '';
      }

      function invalidateActiveTopicViewportState() {
        cachedActiveTopicViewportState = null;
      }

      function getActiveTopicViewportState() {
        if (cachedActiveTopicViewportState) {
          return cachedActiveTopicViewportState;
        }
        if (!currentPageRef) {
          return null;
        }
        const scrollY = window.scrollY
          || window.pageYOffset
          || document.documentElement.scrollTop
          || document.body.scrollTop
          || 0;
        const rect = currentPageRef.getBoundingClientRect();
        const pageTop = scrollY + rect.top;
        const pageHeight = Math.max(currentPageRef.scrollHeight || rect.height || 0, 1);
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const rawOffset = scrollY - pageTop;
        const maxOffset = Math.max(pageHeight - viewportHeight, 0);
        const viewportTopOffset = Math.min(Math.max(rawOffset, 0), maxOffset);
        const viewportCenterOffset = viewportTopOffset + viewportHeight * 0.5;
        const relativeCenter = Math.min(Math.max(viewportCenterOffset / pageHeight, 0), 1);
        cachedActiveTopicViewportState = {
          topicId: currentPageRef.dataset.topicId || '',
          pageHeight,
          viewportHeight,
          viewportTopOffset,
          relativeCenter
        };
        return cachedActiveTopicViewportState;
      }

      function captureActiveTopicViewportContext() {
        const state = getActiveTopicViewportState();
        if (!state) {
          return null;
        }
        return {
          pageOffsetTop: state.viewportTopOffset,
          relativeTop: state.relativeCenter,
          pageHeight: state.pageHeight,
          viewportHeight: state.viewportHeight
        };
      }

      const FLOATING_NOTE_VIEWPORT_REANCHOR_OFFSET_EPSILON = 2;
      const FLOATING_NOTE_VIEWPORT_REANCHOR_RATIO_EPSILON = 0.002;

      function consumeFloatingNotesRelaxedMatching() {
        const shouldRelax = floatingNotesViewportRelaxedMatching;
        floatingNotesViewportRelaxedMatching = false;
        return shouldRelax;
      }

      function syncNoteViewportAnchors(note, viewportState, { force = false } = {}) {
        if (!note || !viewportState) return;
        const noteId = note.dataset.noteId;
        if (!noteId || !notesRegistry.has(noteId)) {
          return;
        }

        const currentData = notesRegistry.get(noteId);
        const updates = {};
        const hasViewportOffset = Number.isFinite(viewportState.viewportTopOffset);
        const hasRelativePosition = Number.isFinite(viewportState.relativeCenter);

        if (hasViewportOffset) {
          const newOffset = Math.round(viewportState.viewportTopOffset);
          const previousOffset = Number.isFinite(currentData?.pageOffsetTop)
            ? Math.round(currentData.pageOffsetTop)
            : Number.parseFloat(note.dataset.pageOffsetTop || '');

          if (
            force
            || !Number.isFinite(previousOffset)
            || Math.abs(previousOffset - newOffset) > FLOATING_NOTE_VIEWPORT_REANCHOR_OFFSET_EPSILON
          ) {
            updates.pageOffsetTop = newOffset;
          }
          note.dataset.pageOffsetTop = String(newOffset);
        } else {
          delete note.dataset.pageOffsetTop;
          if (Number.isFinite(currentData?.pageOffsetTop)) {
            updates.pageOffsetTop = null;
          }
        }

        if (hasRelativePosition) {
          const newRelative = Number(Math.max(Math.min(viewportState.relativeCenter, 1), 0).toFixed(4));
          const previousRelative = Number.isFinite(currentData?.relativeTop)
            ? Number(currentData.relativeTop)
            : Number.parseFloat(note.dataset.relativeTop || '');

          if (
            force
            || !Number.isFinite(previousRelative)
            || Math.abs(previousRelative - newRelative) > FLOATING_NOTE_VIEWPORT_REANCHOR_RATIO_EPSILON
          ) {
            updates.relativeTop = newRelative;
          }
          note.dataset.relativeTop = String(newRelative);
        } else {
          delete note.dataset.relativeTop;
          if (Number.isFinite(currentData?.relativeTop)) {
            updates.relativeTop = null;
          }
        }

        if (Object.keys(updates).length > 0) {
          const updated = updateNoteData(noteId, updates, { silent: true }) || notesRegistry.get(noteId);
          if (updated) {
            if (Number.isFinite(updated.pageOffsetTop)) {
              note.dataset.pageOffsetTop = String(updated.pageOffsetTop);
            } else {
              delete note.dataset.pageOffsetTop;
            }
            if (Number.isFinite(updated.relativeTop)) {
              note.dataset.relativeTop = String(updated.relativeTop);
            } else {
              delete note.dataset.relativeTop;
            }
          }
        }
      }

      function applyFloatingNoteTopicVisibility(note, options = {}) {
        if (!note) return;
        const { relaxMatching = false } = options;
        const currentTopic = getCurrentTopicId();
        const noteTopicId = resolveNoteTopicId(note);

        const shouldShow = currentTopic && noteTopicId ? noteTopicId === currentTopic : false;

        if (shouldShow) {
          const viewportState = getActiveTopicViewportState();
          if (viewportState) {
            syncNoteViewportAnchors(note, viewportState, { force: relaxMatching });
          }
        }

        if (!shouldShow && floatingNoteDragState.note === note) {
          endFloatingNoteDrag();
        }
        const activeMenuNoteId = activeFloatingNoteStyleMenu?.dataset?.noteId;
        if (!shouldShow && activeMenuNoteId && activeMenuNoteId === note.dataset.noteId) {
          closeFloatingNoteStyleMenu();
        }
        note.hidden = !shouldShow;
        note.style.display = shouldShow ? '' : 'none';
        note.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        note.classList.toggle('floating-note-visible', shouldShow);
      }

      function refreshFloatingNotesTopicVisibility({ relaxMatching = false } = {}) {
        if (!floatingNotesLayer) return;
        let shouldRelax = !!relaxMatching;
        if (!shouldRelax) {
          shouldRelax = consumeFloatingNotesRelaxedMatching();
        }
        floatingNotesLayer.querySelectorAll('.floating-note').forEach(note => {
          applyFloatingNoteTopicVisibility(note, { relaxMatching: shouldRelax });
        });
      }

      function scheduleFloatingNotesViewportRefresh(options = {}) {
        if (pendingFloatingNoteViewportRefresh) return;
        pendingFloatingNoteViewportRefresh = true;
        requestAnimationFrame(() => {
          pendingFloatingNoteViewportRefresh = false;
          invalidateActiveTopicViewportState();
          refreshFloatingNotesTopicVisibility(options);
        });
      }

      function resolveFloatingNoteInitialPosition(noteData, fallbackLeft, fallbackTop) {
        const left = Number.isFinite(noteData?.left) ? noteData.left : fallbackLeft;
        const top = Number.isFinite(noteData?.top) ? noteData.top : fallbackTop;
        return { left, top };
      }

      function syncFloatingNoteStyleMenu(menu, styleId) {
        if (!menu) return;
        menu.querySelectorAll('button[data-style-id]').forEach(button => {
          const isActive = button.dataset.styleId === styleId;
          button.classList.toggle('active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
      }

      function updateFloatingNoteSizeDataset(note) {
        if (!note) return;
        const writeSize = () => {
          const width = Math.round(note.offsetWidth || note.getBoundingClientRect().width || 0);
          const height = Math.round(note.offsetHeight || note.getBoundingClientRect().height || 0);
          if (Number.isFinite(width) && width > 0) {
            note.dataset.width = String(width);
          }
          if (Number.isFinite(height) && height > 0) {
            note.dataset.height = String(height);
          }
          const noteId = note.dataset.noteId;
          if (noteId) {
            updateNoteData(noteId, { width, height }, { silent: true });
          }
        };
        if (!note.isConnected || ((note.offsetWidth || 0) === 0 && (note.offsetHeight || 0) === 0)) {
          requestAnimationFrame(writeSize);
        } else {
          writeSize();
        }
      }

      function applyFloatingNoteSize(note, width, height) {
        if (!note) return;
        if (Number.isFinite(width)) {
          const safeWidth = Math.max(width, FLOATING_NOTE_MIN_WIDTH);
          note.style.width = `${safeWidth}px`;
        } else {
          note.style.width = `${FLOATING_NOTE_DEFAULT_WIDTH}px`;
        }
        if (Number.isFinite(height)) {
          const safeHeight = Math.max(height, FLOATING_NOTE_MIN_HEIGHT);
          note.style.height = `${safeHeight}px`;
        } else {
          note.style.height = '';
        }
        updateFloatingNoteSizeDataset(note);
      }

      function resetFloatingNoteSize(note) {
        if (!note) return;
        note.style.width = `${FLOATING_NOTE_DEFAULT_WIDTH}px`;
        note.style.height = '';
        updateFloatingNoteSizeDataset(note);
        const currentLeft = Number.parseFloat(note.dataset.left || note.style.left || '0');
        const currentTop = Number.parseFloat(note.dataset.top || note.style.top || '0');
        positionFloatingNote(note, currentLeft, currentTop);
      }

      function positionFloatingNoteMenu(menu, anchorElement) {
        if (!menu || !anchorElement) return;
        const padding = 12;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        menu.style.visibility = 'hidden';
        menu.style.left = '0px';
        menu.style.top = '0px';
        const anchorRect = anchorElement.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        let left = anchorRect.right - menuRect.width;
        if (left < padding) {
          left = padding;
        }
        if (left + menuRect.width > viewportWidth - padding) {
          left = Math.max(padding, viewportWidth - menuRect.width - padding);
        }
        let top = anchorRect.bottom + 8;
        if (top + menuRect.height > viewportHeight - padding) {
          top = anchorRect.top - menuRect.height - 8;
          if (top < padding) {
            top = Math.max(padding, viewportHeight - menuRect.height - padding);
          }
        }
        menu.style.left = `${Math.round(left)}px`;
        menu.style.top = `${Math.round(top)}px`;
        menu.style.visibility = '';
      }

      function openFloatingNoteStyleMenu(menu, anchorElement = null) {
        if (!menu) return;
        if (activeFloatingNoteStyleMenu && activeFloatingNoteStyleMenu !== menu) {
          activeFloatingNoteStyleMenu.classList.remove('show');
          activeFloatingNoteStyleMenu.setAttribute('aria-hidden', 'true');
        }
        menu.classList.add('show');
        menu.setAttribute('aria-hidden', 'false');
        if (anchorElement) {
          positionFloatingNoteMenu(menu, anchorElement);
        } else {
          menu.style.left = '';
          menu.style.top = '';
        }
        activeFloatingNoteStyleMenu = menu;
      }

      function closeFloatingNoteStyleMenu(menu = null) {
        const targetMenu = menu || activeFloatingNoteStyleMenu;
        if (!targetMenu) return;
        targetMenu.classList.remove('show');
        targetMenu.setAttribute('aria-hidden', 'true');
        targetMenu.style.left = '';
        targetMenu.style.top = '';
        targetMenu.style.visibility = '';
        if (activeFloatingNoteStyleMenu === targetMenu) {
          activeFloatingNoteStyleMenu = null;
        }
      }

      function bringNoteToFront(note) {
        if (!note) return;
        floatingNoteZIndex += 1;
        note.style.zIndex = String(floatingNoteZIndex);
      }

      function clampNotePosition(note, left, top) {
        if (!floatingNotesLayer) {
          return {
            left: Number.isFinite(left) ? left : 0,
            top: Number.isFinite(top) ? top : 0
          };
        }
        const layerRect = floatingNotesLayer.getBoundingClientRect();
        const viewportWidth = window.innerWidth || layerRect.width || 0;
        const viewportHeight = window.innerHeight || (layerRect.height + layerRect.top) || 0;
        const layerWidth = layerRect.width || viewportWidth;
        const layerHeight = layerRect.height || Math.max(0, viewportHeight - layerRect.top);
        const noteRect = note.getBoundingClientRect();
        const noteWidth = note.offsetWidth || noteRect.width || FLOATING_NOTE_DEFAULT_WIDTH;
        const noteHeight = note.offsetHeight || noteRect.height || FLOATING_NOTE_MIN_HEIGHT;
        const maxLeft = Math.max(0, layerWidth - noteWidth);
        const clampedLeft = Math.min(Math.max(Number.isFinite(left) ? left : 0, 0), maxLeft);
        const clampedTop = Math.max(Number.isFinite(top) ? top : 0, 0);
        return { left: clampedLeft, top: clampedTop };
      }

      function positionFloatingNote(note, left, top, options = {}) {
        if (!note) return;
        const { skipClamp = false } = options;
        const applyPosition = () => {
          const coords = skipClamp
            ? { left: Number.isFinite(left) ? left : 0, top: Number.isFinite(top) ? top : 0 }
            : clampNotePosition(note, left, top);
          const finalLeft = Number.isFinite(coords.left) ? coords.left : 0;
          const finalTop = Number.isFinite(coords.top) ? coords.top : 0;
          note.style.left = `${finalLeft}px`;
          note.style.top = `${finalTop}px`;
          note.dataset.left = String(finalLeft);
          note.dataset.top = String(finalTop);
          const noteId = note.dataset.noteId;
          if (noteId) {
            updateNoteData(noteId, { left: finalLeft, top: finalTop }, { silent: true });
          }
        };

        if ((note.offsetWidth || note.getBoundingClientRect().width) === 0) {
          requestAnimationFrame(applyPosition);
        } else {
          applyPosition();
        }
      }

      function refreshToggleNotesButton() {
        if (!toggleNotesBtn) return;
        toggleNotesBtn.classList.toggle('active', !floatingNotesHidden);
        toggleNotesBtn.setAttribute('aria-pressed', floatingNotesHidden ? 'false' : 'true');
        toggleNotesBtn.title = floatingNotesHidden ? 'Mostrar notas flotantes' : 'Ocultar notas flotantes';
        toggleNotesBtn.textContent = floatingNotesHidden ? '🙈' : '👁️';
      }

      function setFloatingNotesVisibility(hidden) {
        floatingNotesHidden = !!hidden;
        document.body.classList.toggle('notes-hidden', floatingNotesHidden);
        refreshToggleNotesButton();
        if (floatingNotesHidden) {
          closeFloatingNoteStyleMenu();
        } else {
          clampAllFloatingNotes();
          scheduleFloatingNotesViewportRefresh();
        }
      }

      function setFloatingNotesEditable(editable) {
        if (!floatingNotesLayer) return;
        const notes = floatingNotesLayer.querySelectorAll('.floating-note');
        notes.forEach(note => {
          const body = note.querySelector('.floating-note-body');
          if (body) {
            body.contentEditable = editable ? 'true' : 'false';
          }
          const label = note.querySelector('.note-category .note-label');
          if (label) {
            label.contentEditable = editable ? 'true' : 'false';
            label.setAttribute('role', 'textbox');
            label.setAttribute('aria-label', 'Título de la nota');
            label.spellcheck = false;
            if (!editable) {
              label.dataset.editing = 'false';
              delete label.dataset.initialTitleHtml;
            }
          }
          const category = note.querySelector('.note-category');
          if (category) {
            category.dataset.editableTitle = editable ? 'true' : 'false';
          }
        });
      }

      function updateFloatingNotesPrintControl() {
        if (!printFloatingNotesViewBtn) return;
        const shouldShow = mainContentHidden === true;
        printFloatingNotesViewBtn.hidden = !shouldShow;
        printFloatingNotesViewBtn.disabled = !shouldShow;
        printFloatingNotesViewBtn.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      }

      function printVisibleFloatingNotes() {
        if (!floatingNotesLayer) return;
        closeFloatingNoteStyleMenu();

        const layerRect = floatingNotesLayer.getBoundingClientRect();
        if (!layerRect || layerRect.width <= 0 || layerRect.height <= 0) {
          alert('No hay notas visibles para imprimir en este tema.');
          return;
        }

        const topicId = getCurrentTopicId();
        const previousPage = getCurrentPage();
        const previousTheme = getPageTheme(previousPage);
        const previousSectionId = getCurrentSectionId();
        const layerStyles = window.getComputedStyle(floatingNotesLayer);
        const visibleNotes = [];

        floatingNotesLayer.querySelectorAll('.floating-note').forEach(note => {
          if (!note.isConnected) return;
          if (note.classList.contains('floating-note-behind')) return;
          const style = window.getComputedStyle(note);
          if (style.display === 'none' || style.visibility === 'hidden' || Number.parseFloat(style.opacity || '1') === 0) {
            return;
          }
          if ((note.offsetWidth || 0) === 0 || (note.offsetHeight || 0) === 0) {
            return;
          }
          const noteTopicId = resolveNoteTopicId(note);
          if (topicId && noteTopicId && topicId !== noteTopicId) {
            return;
          }
          const rect = note.getBoundingClientRect();
          if (rect.bottom < layerRect.top || rect.top > layerRect.bottom) {
            return;
          }
          if (rect.right < layerRect.left || rect.left > layerRect.right) {
            return;
          }
          visibleNotes.push({ note, rect });
        });

        if (!visibleNotes.length) {
          alert('No hay notas visibles para imprimir en este tema.');
          return;
        }

        const printContainer = document.createElement('div');
        printContainer.className = 'floating-notes-print-area';

        const stage = document.createElement('div');
        stage.className = 'floating-notes-print-stage';
        stage.style.width = `${Math.round(layerRect.width)}px`;
        stage.style.height = `${Math.round(layerRect.height)}px`;
        stage.style.position = 'relative';
        stage.style.backgroundColor = layerStyles.backgroundColor || '#ffffff';
        stage.style.backgroundImage = layerStyles.backgroundImage || 'none';
        stage.style.backgroundPosition = layerStyles.backgroundPosition || '0 0';
        stage.style.backgroundRepeat = layerStyles.backgroundRepeat || 'no-repeat';
        stage.style.backgroundSize = layerStyles.backgroundSize || 'auto';
        stage.style.flex = '0 0 auto';

        printContainer.style.backgroundColor = stage.style.backgroundColor;
        const wrapper = document.createElement('div');
        wrapper.className = 'floating-notes-print-wrapper';
        wrapper.style.flex = '0 0 auto';
        wrapper.appendChild(stage);
        printContainer.appendChild(wrapper);

        const pxPerMillimetre = 96 / 25.4;
        const pageWidthPx = 297 * pxPerMillimetre;
        const pageHeightPx = 210 * pxPerMillimetre;
        const scaleX = pageWidthPx / layerRect.width;
        const scaleY = pageHeightPx / layerRect.height;
        const targetScale = Number.isFinite(scaleX) && Number.isFinite(scaleY)
          ? Math.min(1, scaleX, scaleY)
          : 1;

        printContainer.style.setProperty('--floating-notes-print-width', `${Math.round(layerRect.width)}px`);
        printContainer.style.setProperty('--floating-notes-print-height', `${Math.round(layerRect.height)}px`);
        printContainer.style.setProperty('--floating-notes-print-scale', `${targetScale}`);

        const landscapeStyle = document.createElement('style');
        landscapeStyle.dataset.floatingNotesPrint = 'orientation';
        landscapeStyle.media = 'print';
        landscapeStyle.textContent = '@page { size: A4 landscape; margin: 0; }';
        document.head.appendChild(landscapeStyle);

        visibleNotes.forEach(({ note, rect }) => {
          const clone = note.cloneNode(true);
          clone.classList.remove('dragging', 'resizing');
          clone.removeAttribute('id');
          clone.querySelectorAll('.floating-note-resize-handle').forEach(handle => handle.remove());
          clone.querySelectorAll('.floating-note-style-menu').forEach(menu => menu.remove());
          clone.classList.add('floating-note-compact-header');
          clone.style.position = 'absolute';
          clone.style.left = `${Math.round(rect.left - layerRect.left)}px`;
          clone.style.top = `${Math.round(rect.top - layerRect.top)}px`;
          clone.style.width = `${Math.round(rect.width)}px`;
          clone.style.height = `${Math.round(rect.height)}px`;
          const computed = window.getComputedStyle(note);
          if (computed.zIndex) {
            clone.style.zIndex = computed.zIndex;
          }
          clone.removeAttribute('data-note-id');
          clone.querySelectorAll('[contenteditable]').forEach(el => el.setAttribute('contenteditable', 'false'));
          const originalBody = note.querySelector('.floating-note-body');
          const cloneBody = clone.querySelector('.floating-note-body');
          if (originalBody && cloneBody) {
            cloneBody.scrollTop = originalBody.scrollTop;
            cloneBody.scrollLeft = originalBody.scrollLeft;
          }
          stage.appendChild(clone);
        });

        let fallbackTimer = null;
        let didCleanup = false;
        const cleanup = () => {
          if (didCleanup) {
            return;
          }
          didCleanup = true;
          if (fallbackTimer) {
            window.clearTimeout(fallbackTimer);
            fallbackTimer = null;
          }
          document.body.classList.remove('printing-floating-notes');
          if (printContainer.isConnected) {
            printContainer.remove();
          }
          if (landscapeStyle.isConnected) {
            landscapeStyle.remove();
          }
          if (previousSectionId) {
            sectionThemes.set(previousSectionId, previousTheme);
          }
          if (previousTheme) {
            syncBodyTheme(previousTheme);
            updateThemeSelectControl(previousTheme);
          }
          if (previousPage && previousPage.isConnected) {
            setActivePage(previousPage);
          } else {
            ensureVisibleSection({ force: true });
          }
          window.removeEventListener('afterprint', cleanup);
        };

        window.addEventListener('afterprint', cleanup, { once: true });
        document.body.appendChild(printContainer);
        document.body.classList.add('printing-floating-notes');

        fallbackTimer = window.setTimeout(() => {
          fallbackTimer = null;
          cleanup();
        }, 2000);

        requestAnimationFrame(() => {
          window.print();
        });
      }

      function isPointerInNoteLeftCorner(note, clientX, clientY) {
        if (!note) {
          return false;
        }
        const category = note.querySelector('.note-category');
        if (!category) {
          return false;
        }
        const rect = category.getBoundingClientRect();
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      }

      function shouldUseFloatingNoteDragHandle(note, event) {
        if (!note || !event) {
          return false;
        }
        if (event.button !== 0 || event.detail > 1) {
          return false;
        }
        const target = event.target;
        if (target.closest('button') || target.closest('.floating-note-style-menu') || target.closest('.floating-note-resize-handle')) {
          return false;
        }
        if (target.closest('.note-category')) {
          return false;
        }
        const noteRect = note.getBoundingClientRect();
        const pointerY = event.clientY;
        const pointerX = event.clientX;
        const topEdgeLimit = note.classList.contains('floating-note-ultra-compact') ? 22 : 32;
        const isWithinHeader = !!target.closest('.floating-note-header');
        const isWithinTopEdge = pointerY >= noteRect.top - 2 && pointerY <= noteRect.top + topEdgeLimit;
        if (!isWithinHeader && !isWithinTopEdge) {
          return false;
        }
        if (isPointerInNoteLeftCorner(note, pointerX, pointerY)) {
          return false;
        }
        return true;
      }

      function tryBeginFloatingNoteDrag(note, event, menu = null) {
        if (!shouldUseFloatingNoteDragHandle(note, event)) {
          return false;
        }
        bringNoteToFront(note);
        closeFloatingNoteStyleMenu(menu || null);
        startFloatingNoteDrag(note, event);
        return true;
      }

      function startFloatingNoteDrag(note, event) {
        if (!note || !floatingNotesLayer) return;
        floatingNoteDragState.note = note;
        floatingNoteDragState.pointerId = event.pointerId;
        const rect = note.getBoundingClientRect();
        floatingNoteDragState.offsetX = event.clientX - rect.left;
        floatingNoteDragState.offsetY = event.clientY - rect.top;
        note.classList.add('dragging');
        bringNoteToFront(note);
        try {
          note.setPointerCapture(event.pointerId);
        } catch (err) {
          // Ignore pointer capture errors
        }
        event.preventDefault();
      }

      function startFloatingNoteHorizontalResize(note, edge, event) {
        if (!note || !floatingNotesLayer) return;
        floatingNoteResizeState.note = note;
        floatingNoteResizeState.pointerId = event.pointerId;
        floatingNoteResizeState.orientation = 'horizontal';
        floatingNoteResizeState.edge = edge === 'left' ? 'left' : 'right';
        floatingNoteResizeState.corner = null;
        floatingNoteResizeState.startWidth = note.getBoundingClientRect().width || note.offsetWidth || FLOATING_NOTE_DEFAULT_WIDTH;
        floatingNoteResizeState.startHeight = note.getBoundingClientRect().height || note.offsetHeight || FLOATING_NOTE_MIN_HEIGHT;
        floatingNoteResizeState.startLeft = Number.parseFloat(note.dataset.left || note.style.left || '0');
        floatingNoteResizeState.startTop = Number.parseFloat(note.dataset.top || note.style.top || '0');
        floatingNoteResizeState.startRight = floatingNoteResizeState.startLeft + floatingNoteResizeState.startWidth;
        floatingNoteResizeState.startBottom = floatingNoteResizeState.startTop + floatingNoteResizeState.startHeight;
        floatingNoteResizeState.startX = event.clientX;
        floatingNoteResizeState.startY = event.clientY;
        note.classList.add('resizing');
        note.classList.add('resizing-horizontal');
        note.classList.remove('resizing-vertical');
        note.classList.remove('resizing-corner');
        bringNoteToFront(note);
        try {
          note.setPointerCapture(event.pointerId);
        } catch (err) {
          // Ignore pointer capture errors
        }
        event.preventDefault();
      }

      function startFloatingNoteCornerResize(note, corner, event) {
        if (!note || !floatingNotesLayer) return;
        floatingNoteResizeState.note = note;
        floatingNoteResizeState.pointerId = event.pointerId;
        floatingNoteResizeState.orientation = 'corner';
        floatingNoteResizeState.corner = corner;
        floatingNoteResizeState.edge = null;
        floatingNoteResizeState.startWidth = note.getBoundingClientRect().width || note.offsetWidth || FLOATING_NOTE_DEFAULT_WIDTH;
        floatingNoteResizeState.startHeight = note.getBoundingClientRect().height || note.offsetHeight || FLOATING_NOTE_MIN_HEIGHT;
        floatingNoteResizeState.startLeft = Number.parseFloat(note.dataset.left || note.style.left || '0');
        floatingNoteResizeState.startTop = Number.parseFloat(note.dataset.top || note.style.top || '0');
        floatingNoteResizeState.startRight = floatingNoteResizeState.startLeft + floatingNoteResizeState.startWidth;
        floatingNoteResizeState.startBottom = floatingNoteResizeState.startTop + floatingNoteResizeState.startHeight;
        floatingNoteResizeState.startX = event.clientX;
        floatingNoteResizeState.startY = event.clientY;
        note.classList.add('resizing');
        note.classList.add('resizing-corner');
        note.classList.remove('resizing-horizontal');
        note.classList.remove('resizing-vertical');
        bringNoteToFront(note);
        try {
          note.setPointerCapture(event.pointerId);
        } catch (err) {
          // Ignore pointer capture errors
        }
        event.preventDefault();
      }

      function handleFloatingNotePointerMove(event) {
        if (floatingNoteResizeState.note && floatingNoteResizeState.pointerId === event.pointerId) {
          const state = floatingNoteResizeState;
          const note = state.note;
          if (state.orientation === 'horizontal') {
            const rawDelta = event.clientX - state.startX;
            let newWidth = state.startWidth;
            if (state.edge === 'right') {
              newWidth = state.startWidth + rawDelta;
            } else {
              newWidth = state.startWidth - rawDelta;
            }
            newWidth = Math.max(FLOATING_NOTE_MIN_WIDTH, newWidth);
            note.style.width = `${Math.round(newWidth)}px`;
            if (state.edge === 'left') {
              const desiredLeft = state.startRight - newWidth;
              positionFloatingNote(note, desiredLeft, state.startTop);
            } else {
              const currentLeft = Number.parseFloat(note.dataset.left || note.style.left || '0');
              positionFloatingNote(note, currentLeft, state.startTop);
            }
            updateFloatingNoteSizeDataset(note);
            state.startWidth = newWidth;
            state.startLeft = Number.parseFloat(note.dataset.left || note.style.left || String(state.startLeft));
            state.startRight = state.startLeft + newWidth;
            state.startX = event.clientX;
            state.startY = event.clientY;
            event.preventDefault();
            return;
          }

          if (state.orientation === 'corner' && state.corner === 'top-left') {
            const rawDeltaX = event.clientX - state.startX;
            const rawDeltaY = event.clientY - state.startY;
            let newWidth = state.startWidth - rawDeltaX;
            let newHeight = state.startHeight - rawDeltaY;
            newWidth = Math.max(FLOATING_NOTE_MIN_WIDTH, newWidth);
            newHeight = Math.max(FLOATING_NOTE_MIN_HEIGHT, newHeight);
            const desiredLeft = state.startRight - newWidth;
            const desiredTop = state.startBottom - newHeight;
            note.style.width = `${Math.round(newWidth)}px`;
            note.style.height = `${Math.round(newHeight)}px`;
            positionFloatingNote(note, desiredLeft, desiredTop);
            updateFloatingNoteSizeDataset(note);
            state.startWidth = newWidth;
            state.startHeight = newHeight;
            state.startLeft = Number.parseFloat(note.dataset.left || note.style.left || String(desiredLeft));
            state.startTop = Number.parseFloat(note.dataset.top || note.style.top || String(desiredTop));
            state.startRight = state.startLeft + newWidth;
            state.startBottom = state.startTop + newHeight;
            state.startX = event.clientX;
            state.startY = event.clientY;
            event.preventDefault();
            return;
          }

          return;
        }

        const state = floatingNoteDragState;
        if (!state.note || state.pointerId !== event.pointerId || !floatingNotesLayer) {
          return;
        }
        const layerRect = floatingNotesLayer.getBoundingClientRect();
        const newLeft = event.clientX - layerRect.left - state.offsetX;
        const newTop = event.clientY - layerRect.top - state.offsetY;
        positionFloatingNote(state.note, newLeft, newTop);
        event.preventDefault();
      }

      function endFloatingNoteDrag(event) {
        const resizeState = floatingNoteResizeState;
        if (resizeState.note && (event === undefined || resizeState.pointerId === (event?.pointerId))) {
          try {
            resizeState.note.releasePointerCapture(resizeState.pointerId);
          } catch (err) {
            // Ignore errors when releasing pointer capture
          }
          resizeState.note.classList.remove('resizing', 'resizing-horizontal', 'resizing-vertical', 'resizing-corner');
          updateFloatingNoteSizeDataset(resizeState.note);
          floatingNoteResizeState.note = null;
          floatingNoteResizeState.pointerId = null;
          floatingNoteResizeState.orientation = null;
          floatingNoteResizeState.edge = null;
          floatingNoteResizeState.corner = null;
          floatingNoteResizeState.startWidth = 0;
          floatingNoteResizeState.startHeight = 0;
          floatingNoteResizeState.startLeft = 0;
          floatingNoteResizeState.startTop = 0;
          floatingNoteResizeState.startRight = 0;
          floatingNoteResizeState.startBottom = 0;
          floatingNoteResizeState.startX = 0;
          floatingNoteResizeState.startY = 0;
        }

        const state = floatingNoteDragState;
        if (!state.note) return;
        if (event && state.pointerId !== undefined && event.pointerId !== state.pointerId) {
          return;
        }
        try {
          state.note.releasePointerCapture(state.pointerId);
        } catch (err) {
          // Ignore errors when releasing pointer capture
        }
        state.note.classList.remove('dragging');
        floatingNoteDragState.note = null;
        floatingNoteDragState.pointerId = null;
      }

      function clearFloatingNotes() {
        if (!floatingNotesLayer) return;
        closeTopicNotesPopover();
        closeFloatingNoteStyleMenu();
        floatingNotesLayer.innerHTML = '';
        document.querySelectorAll('.note-options-menu').forEach(menu => menu.remove());
        floatingNoteCreationOffset = 0;
        floatingNoteZIndex = 10;
        if (floatingNoteResizeObserver) {
          floatingNoteResizeObserver.disconnect();
        }
        document.querySelectorAll('.note-anchor').forEach(anchor => anchor.remove());
        notesRegistry.clear({ silent: true });
        scheduleNotesViewRefresh();
        scheduleTopicNoteIndicatorRefresh();
      }

      function clampAllFloatingNotes() {
        if (!floatingNotesLayer) return;
        floatingNotesLayer.querySelectorAll('.floating-note').forEach(note => {
          const left = Number.parseFloat(note.dataset.left || note.style.left || '0');
          const top = Number.parseFloat(note.dataset.top || note.style.top || '0');
          positionFloatingNote(note, left, top);
        });
      }

      function createFloatingNote(data = {}) {
        if (!floatingNotesLayer) return null;
        const note = document.createElement('div');
        note.className = 'floating-note enhanced-note';

        let noteId = data.id ? String(data.id).trim() : '';
        if (!noteId) {
          noteId = generateUniqueId('floating-note');
        }
        note.dataset.noteId = noteId;

        const metaSource = data.meta && typeof data.meta === 'object' ? data.meta : {};
        const resolvedStyleId = (() => {
          const incoming = data.style || metaSource.style;
          if (incoming && getFloatingNoteStyle(String(incoming).trim())) {
            return String(incoming).trim();
          }
          return DEFAULT_NOTE_STYLE;
        })();

        applyFloatingNoteStyle(note, resolvedStyleId);

        const resolvedCompactHeader = (() => {
          if (data.compactHeader !== undefined) {
            return !!data.compactHeader;
          }
          if (metaSource.compactHeader !== undefined) {
            return !!metaSource.compactHeader;
          }
          if (typeof data.meta?.compactHeader !== 'undefined') {
            return !!data.meta.compactHeader;
          }
          return false;
        })();

        const resolvedUltraCompact = (() => {
          if (data.ultraCompact !== undefined) {
            return !!data.ultraCompact;
          }
          if (metaSource.ultraCompact !== undefined) {
            return !!metaSource.ultraCompact;
          }
          if (typeof data.meta?.ultraCompact !== 'undefined') {
            return !!data.meta.ultraCompact;
          }
          return false;
        })();

        const resolvedBehindState = (() => {
          const source = data.behindMainContent !== undefined
            ? data.behindMainContent
            : metaSource.behindMainContent;
          if (typeof source === 'string') {
            return source === 'true';
          }
          return !!source;
        })();

        const resolvedCustomIcon = normalizeCustomIconValue(
          data.customIcon ?? metaSource.customIcon ?? data.meta?.customIcon
        );

        const resolvedHoverAnimation = (() => {
          if (data.hoverAnimation !== undefined) {
            return resolveBooleanFlag(data.hoverAnimation, false);
          }
          if (metaSource.hoverAnimation !== undefined) {
            return resolveBooleanFlag(metaSource.hoverAnimation, false);
          }
          if (typeof data.meta?.hoverAnimation !== 'undefined') {
            return resolveBooleanFlag(data.meta.hoverAnimation, false);
          }
          return false;
        })();

        const resolvedNeutralText = (() => {
          if (data.styleNeutralText !== undefined) {
            return resolveBooleanFlag(data.styleNeutralText, false);
          }
          if (metaSource.styleNeutralText !== undefined) {
            return resolveBooleanFlag(metaSource.styleNeutralText, false);
          }
          if (typeof data.meta?.styleNeutralText !== 'undefined') {
            return resolveBooleanFlag(data.meta.styleNeutralText, false);
          }
          return false;
        })();

        const resolvedBorderEnabled = resolveBooleanFlag(
          data.borderEnabled !== undefined ? data.borderEnabled : metaSource.borderEnabled,
          true
        );
        const resolvedBorderWidth = (() => {
          const candidate = Number.parseFloat(data.borderWidth ?? metaSource.borderWidth);
          if (Number.isFinite(candidate)) {
            return Math.max(candidate, 0);
          }
          return null;
        })();
        const resolvedBorderColor = (() => {
          const candidate = typeof data.borderColor === 'string'
            ? data.borderColor
            : (typeof metaSource.borderColor === 'string' ? metaSource.borderColor : null);
          if (candidate && candidate.trim()) {
            return normalizeColorToHex(candidate.trim(), candidate.trim());
          }
          return null;
        })();

        const resolvedSuperNote = resolveBooleanFlag(
          data.superNote !== undefined ? data.superNote : metaSource.superNote,
          false
        );
        const incomingSuperTabs = Array.isArray(data.superTabs)
          ? data.superTabs
          : (Array.isArray(metaSource.superTabs) ? metaSource.superTabs : undefined);
        const incomingActiveSuperTabId = data.activeSuperTabId
          ?? metaSource.activeSuperTabId
          ?? undefined;

        const htmlContent = typeof data.html === 'string'
          ? data.html
          : (typeof metaSource.html === 'string' ? metaSource.html : '');

        const initialTitle = (() => {
          if (typeof data.title === 'string') {
            return data.title.trim();
          }
          if (data.title === null) {
            return null;
          }
          if (typeof metaSource.title === 'string') {
            return metaSource.title.trim();
          }
          if (metaSource.title === null) {
            return null;
          }
          return null;
        })();

        const initialTitleHtml = (() => {
          if (typeof data.titleHtml === 'string') {
            return data.titleHtml;
          }
          if (typeof metaSource.titleHtml === 'string') {
            return metaSource.titleHtml;
          }
          if (typeof initialTitle === 'string' && initialTitle.length) {
            return escapeHtml(initialTitle);
          }
          return '';
        })();

        const topicId = data.topicId || metaSource.topicId || currentPageRef?.dataset.topicId || null;
        const sectionId = data.sectionId || metaSource.sectionId || currentSectionId || currentPageRef?.dataset.sectionId || null;
        const noteType = data.type || metaSource.type || DEFAULT_NOTE_TYPE;
        const category = (data.category || metaSource.category || DEFAULT_NOTE_CATEGORY);
        const priority = data.priority || metaSource.priority || DEFAULT_NOTE_PRIORITY;
        const tags = Array.isArray(data.tags) ? data.tags : metaSource.tags;
        const reviewed = (data.reviewed ?? metaSource.reviewed) ?? false;
        const reviewCount = Number.isFinite(data.reviewCount) ? data.reviewCount : (Number.isFinite(metaSource.reviewCount) ? metaSource.reviewCount : 0);
        const lastReviewed = data.lastReviewed || metaSource.lastReviewed || null;
        const createdAt = data.createdAt || metaSource.createdAt || null;
        const updatedAt = data.updatedAt || metaSource.updatedAt || null;
        const linkedTo = data.linkedTo || metaSource.linkedTo || null;
        const anchorId = data.anchorId || metaSource.anchorId || null;
        const parsedLeft = Number.parseFloat(data.left ?? metaSource.left);
        const parsedTop = Number.parseFloat(data.top ?? metaSource.top);
        const parsedWidth = Number.parseFloat(data.width ?? metaSource.width);
        const parsedHeight = Number.parseFloat(data.height ?? metaSource.height);
        const parsedPageOffsetLeft = Number.parseFloat(data.pageOffsetLeft ?? metaSource.pageOffsetLeft);
        const parsedPageOffsetTop = Number.parseFloat(data.pageOffsetTop ?? metaSource.pageOffsetTop);
        const parsedRelativeLeft = Number.parseFloat(data.relativeLeft ?? metaSource.relativeLeft);
        const parsedRelativeTop = Number.parseFloat(data.relativeTop ?? metaSource.relativeTop);
        const hasIncomingOffsetTop = Number.isFinite(parsedPageOffsetTop);
        const hasIncomingRelativeTop = Number.isFinite(parsedRelativeTop);
        let viewportContext = null;
        if (!hasIncomingOffsetTop || !hasIncomingRelativeTop) {
          invalidateActiveTopicViewportState();
          viewportContext = captureActiveTopicViewportContext();
        }
        const resolvedPageOffsetTop = hasIncomingOffsetTop
          ? parsedPageOffsetTop
          : Number.isFinite(viewportContext?.pageOffsetTop)
            ? viewportContext.pageOffsetTop
            : null;
        const resolvedRelativeTop = hasIncomingRelativeTop
          ? parsedRelativeTop
          : Number.isFinite(viewportContext?.relativeTop)
            ? viewportContext.relativeTop
            : null;
        const incomingPages = Array.isArray(data.pages)
          ? data.pages
          : (Array.isArray(metaSource.pages) ? metaSource.pages : undefined);
        const incomingPageIndex = Number.isInteger(data.currentPageIndex)
          ? data.currentPageIndex
          : (Number.isInteger(metaSource.currentPageIndex) ? metaSource.currentPageIndex : undefined);

        const noteData = ensureNoteData(noteId, {
          id: noteId,
          style: resolvedStyleId,
          title: initialTitle,
          titleHtml: initialTitleHtml,
          html: htmlContent,
          content: getNotePlainTextFromHtml(htmlContent),
          type: noteType,
          category,
          priority,
          tags,
          topicId,
          sectionId,
          linkedTo,
          anchorId,
          reviewed,
          reviewCount,
          lastReviewed,
          createdAt,
          updatedAt,
          left: Number.isFinite(parsedLeft) ? parsedLeft : null,
          top: Number.isFinite(parsedTop) ? parsedTop : null,
          width: Number.isFinite(parsedWidth) ? parsedWidth : null,
          height: Number.isFinite(parsedHeight) ? parsedHeight : null,
          pageOffsetLeft: Number.isFinite(parsedPageOffsetLeft) ? parsedPageOffsetLeft : null,
          pageOffsetTop: Number.isFinite(resolvedPageOffsetTop) ? resolvedPageOffsetTop : null,
          relativeLeft: Number.isFinite(parsedRelativeLeft) ? parsedRelativeLeft : null,
          relativeTop: Number.isFinite(resolvedRelativeTop) ? resolvedRelativeTop : null,
          element: note,
          pages: incomingPages,
          currentPageIndex: incomingPageIndex,
          behindMainContent: resolvedBehindState,
          compactHeader: resolvedCompactHeader,
          ultraCompact: resolvedUltraCompact,
          hoverAnimation: resolvedHoverAnimation,
          styleNeutralText: resolvedNeutralText,
          borderEnabled: resolvedBorderEnabled,
          borderWidth: Number.isFinite(resolvedBorderWidth) ? resolvedBorderWidth : null,
          borderColor: resolvedBorderColor,
          customIcon: resolvedCustomIcon,
          superNote: resolvedSuperNote,
          superTabs: incomingSuperTabs,
          activeSuperTabId: incomingActiveSuperTabId
        });
        notesRegistry.set(noteId, noteData);
        applyNoteBehindState(note, resolvedBehindState, { persist: false });
        applyNoteHeaderCompactState(note, resolvedCompactHeader, { persist: false });
        applyNoteUltraCompactState(note, resolvedUltraCompact, { persist: false });
        applyNoteHoverAnimationState(note, resolvedHoverAnimation, { persist: false });
        applyFloatingNoteTextNeutralState(note, resolvedNeutralText, { persist: false });
        applyFloatingNoteBorderState(note, {
          enabled: resolvedBorderEnabled,
          width: Number.isFinite(resolvedBorderWidth) ? resolvedBorderWidth : undefined,
          color: resolvedBorderColor || undefined
        }, { persist: false });
        if (resolvedCustomIcon) {
          note.dataset.customIcon = resolvedCustomIcon;
        } else {
          delete note.dataset.customIcon;
        }

        const header = document.createElement('div');
        header.className = 'note-header floating-note-header';

        const categoryWrap = document.createElement('div');
        categoryWrap.className = 'note-category';
        const categoryIcon = document.createElement('span');
        categoryIcon.className = 'note-icon';
        const categoryLabel = document.createElement('span');
        categoryLabel.className = 'note-label';
        categoryLabel.contentEditable = isEditMode ? 'true' : 'false';
        categoryLabel.setAttribute('role', 'textbox');
        categoryLabel.setAttribute('aria-label', 'Título de la nota');
        categoryLabel.spellcheck = false;
        categoryLabel.dataset.editing = 'false';
        categoryWrap.append(categoryIcon, categoryLabel);
        categoryWrap.dataset.editableTitle = isEditMode ? 'true' : 'false';

        const navigation = document.createElement('div');
        navigation.className = 'note-navigation';

        const prevPageBtn = document.createElement('button');
        prevPageBtn.type = 'button';
        prevPageBtn.className = 'note-nav-btn note-nav-prev';
        prevPageBtn.title = 'Nota anterior';
        prevPageBtn.textContent = '‹';

        const pageIndicator = document.createElement('span');
        pageIndicator.className = 'note-page-indicator';

        const nextPageBtn = document.createElement('button');
        nextPageBtn.type = 'button';
        nextPageBtn.className = 'note-nav-btn note-nav-next';
        nextPageBtn.title = 'Nota siguiente';
        nextPageBtn.textContent = '›';

        const addPageBtn = document.createElement('button');
        addPageBtn.type = 'button';
        addPageBtn.className = 'note-nav-btn note-nav-add';
        addPageBtn.title = 'Agregar subnota';
        addPageBtn.textContent = '+';

        const removePageBtn = document.createElement('button');
        removePageBtn.type = 'button';
        removePageBtn.className = 'note-nav-btn note-nav-remove';
        removePageBtn.title = 'Eliminar subnota actual';
        removePageBtn.textContent = '−';

        navigation.append(prevPageBtn, pageIndicator, nextPageBtn, addPageBtn, removePageBtn);

        const actions = document.createElement('div');
        actions.className = 'note-actions floating-note-actions';

        const menuBtn = document.createElement('button');
        menuBtn.type = 'button';
        menuBtn.className = 'note-menu';
        menuBtn.title = 'Más opciones';
        menuBtn.textContent = '⋮';

        const optionsMenu = buildNoteOptionsMenu(note);
        if (optionsMenu) {
          optionsMenu.dataset.noteId = noteId;
          if (!document.body.contains(optionsMenu)) {
            document.body.appendChild(optionsMenu);
          }
        }

        actions.append(menuBtn);
        header.append(categoryWrap, navigation, actions);

        const body = document.createElement('div');
        body.className = 'floating-note-body note-body';
        body.spellcheck = true;
        body.contentEditable = isEditMode ? 'true' : 'false';
        body.innerHTML = noteData.html || '';
        markFloatingNoteImagesInitialized(body);

        body.addEventListener('focus', () => {
          bringNoteToFront(note);
        });

        body.addEventListener('input', () => {
          const html = body.innerHTML;
          const textContent = getNotePlainTextFromHtml(html);
          const nowIso = new Date().toISOString();
          const currentData = notesRegistry.get(noteId) || ensureNoteData(noteId);
          const currentIndex = Math.min(
            Math.max(Number(currentData?.currentPageIndex) || 0, 0),
            Math.max((currentData?.pages?.length || 1) - 1, 0)
          );
          const updatedPages = Array.isArray(currentData?.pages)
            ? currentData.pages.map((page, index) => {
                if (index !== currentIndex) {
                  return { ...page };
                }
                return {
                  ...page,
                  html,
                  content: textContent,
                  updatedAt: nowIso
                };
              })
            : [{
                id: generateUniqueId('note-page'),
                title: null,
                html,
                content: textContent,
                createdAt: nowIso,
                updatedAt: nowIso
              }];
          const updated = updateNoteData(noteId, {
            html,
            content: textContent,
            pages: updatedPages,
            updatedAt: nowIso
          });
          syncNoteElementMeta(note, updated);
        });

        body.addEventListener('paste', (event) => {
          const clipboard = event.clipboardData;
          if (!clipboard) {
            return;
          }
          event.preventDefault();
          const rawHtml = clipboard.getData('text/html');
          const fallbackText = clipboard.getData('text/plain');
          let toInsert = rawHtml ? sanitizeFloatingNotePasteHtml(rawHtml) : '';
          if (!toInsert && fallbackText) {
            toInsert = escapeHtml(fallbackText).replace(/\r?\n/g, '<br>');
          }
          if (toInsert) {
            const existingImages = new Set(body.querySelectorAll('img'));
            document.execCommand('insertHTML', false, toInsert);
            requestAnimationFrame(() => {
              const container = body;
              const newImages = Array.from(container.querySelectorAll('img')).filter(img => !existingImages.has(img));
              newImages.forEach(img => {
                ensureFloatingNoteImageInitialSize(img, container);
              });
            });
          }
        });

        body.addEventListener('copy', (event) => {
          if (!event.clipboardData) {
            return;
          }
          const selection = document.getSelection();
          if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            return;
          }
          const range = selection.getRangeAt(0);
          if (!note.contains(range.commonAncestorContainer)) {
            return;
          }
          const fragment = range.cloneContents();
          const container = document.createElement('div');
          container.appendChild(fragment);
          const sanitizedHtml = sanitizeFloatingNotePasteHtml(container.innerHTML || '');
          const plainText = container.textContent || '';
          event.preventDefault();
          event.clipboardData.setData('text/plain', plainText);
          if (sanitizedHtml.trim()) {
            event.clipboardData.setData('text/html', sanitizedHtml);
          }
        });

        const footer = document.createElement('div');
        footer.className = 'note-footer';

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'note-tags';

        footer.append(tagsContainer);

        note.append(header, body, footer);
        floatingNotesLayer.appendChild(note);
        attachFloatingNoteResizeHandles(note);

        note._ui = {
          categoryIcon,
          categoryLabel,
          categoryWrap,
          tagsContainer,
          optionsMenu,
          pageIndicator,
          prevPageBtn,
          nextPageBtn,
          addPageBtn,
          removePageBtn,
          navigation,
          actions,
          menuBtn,
          header,
          tabBar: null,
          tabAddButton: null,
          tabColorInput: null
        };

        prevPageBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          bringNoteToFront(note);
          goToFloatingNotePage(note, -1);
        });

        nextPageBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          bringNoteToFront(note);
          goToFloatingNotePage(note, 1);
        });

        addPageBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          bringNoteToFront(note);
          addFloatingNotePage(note);
        });

        removePageBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          bringNoteToFront(note);
          removeFloatingNotePage(note);
        });

        menuBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          bringNoteToFront(note);
          const menu = optionsMenu;
          if (menu.classList.contains('show')) {
            closeFloatingNoteStyleMenu(menu);
          } else {
            syncNoteOptionsMenu(menu, notesRegistry.get(noteId));
            openFloatingNoteStyleMenu(menu, menuBtn);
          }
        });

        const finishTitleEdit = (restoreOriginal = false) => {
          if (categoryLabel.dataset.editing !== 'true') {
            return;
          }
          categoryLabel.dataset.editing = 'false';
          const currentData = notesRegistry.get(noteId) || ensureNoteData(noteId);
          const initialStoredHtml = categoryLabel.dataset.initialTitleHtml || '';
          delete categoryLabel.dataset.initialTitleHtml;
          if (restoreOriginal) {
            syncNoteElementMeta(note, currentData);
            return;
          }
          const rawHtml = categoryLabel.innerHTML;
          const sanitizedHtml = sanitizeNoteTitleHtml(rawHtml);
          const normalized = getNoteTitlePlainText(sanitizedHtml).replace(/[\s\u00A0]+/g, ' ').trim();
          const initialSanitized = sanitizeNoteTitleHtml(initialStoredHtml);
          const initialNormalized = getNoteTitlePlainText(initialSanitized).replace(/[\s\u00A0]+/g, ' ').trim();
          if (sanitizedHtml !== rawHtml) {
            categoryLabel.innerHTML = sanitizedHtml;
          }
          categoryLabel.classList.toggle('note-label-empty', !normalized);
          if (sanitizedHtml === initialSanitized) {
            syncNoteElementMeta(note, currentData);
            return;
          }
          const updated = updateNoteData(noteId, {
            title: normalized.length ? normalized : null,
            titleHtml: sanitizedHtml
          }, { silent: true });
          syncNoteElementMeta(note, updated);
          scheduleNotesViewRefresh();
        };

        categoryLabel.addEventListener('focus', () => {
          if (categoryLabel.contentEditable !== 'true') {
            return;
          }
          bringNoteToFront(note);
          closeFloatingNoteStyleMenu(optionsMenu);
          categoryLabel.dataset.editing = 'true';
          categoryLabel.dataset.initialTitleHtml = categoryLabel.innerHTML || '';
        });

        categoryLabel.addEventListener('blur', () => {
          if (categoryLabel.contentEditable !== 'true') {
            return;
          }
          finishTitleEdit(false);
        });

        categoryLabel.addEventListener('keydown', (event) => {
          if (categoryLabel.contentEditable !== 'true') {
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            categoryLabel.blur();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            finishTitleEdit(true);
            categoryLabel.blur();
          }
        });

        categoryLabel.addEventListener('paste', (event) => {
          if (categoryLabel.contentEditable !== 'true') {
            return;
          }
          event.preventDefault();
          const html = event.clipboardData?.getData('text/html');
          const text = event.clipboardData?.getData('text/plain') || '';
          const toInsert = html ? sanitizeNoteTitleHtml(html) : escapeHtml(text);
          if (toInsert) {
            document.execCommand('insertHTML', false, toInsert);
          }
        });

        header.addEventListener('pointerdown', (event) => {
          if (tryBeginFloatingNoteDrag(note, event, optionsMenu)) {
            event.stopPropagation();
          }
        });

        header.addEventListener('dblclick', (event) => {
          event.preventDefault();
          event.stopPropagation();
          bringNoteToFront(note);
          if (optionsMenu.classList.contains('show')) {
            closeFloatingNoteStyleMenu(optionsMenu);
          } else {
            syncNoteOptionsMenu(optionsMenu, notesRegistry.get(noteId));
            openFloatingNoteStyleMenu(optionsMenu, menuBtn);
          }
        });

        note.addEventListener('pointerdown', (event) => {
          if (event.target.closest('.floating-note-style-menu')) {
            return;
          }
          if (tryBeginFloatingNoteDrag(note, event, optionsMenu)) {
            return;
          }
          bringNoteToFront(note);
          closeFloatingNoteStyleMenu();
        });

        if (floatingNoteResizeObserver) {
          try {
            floatingNoteResizeObserver.observe(note);
          } catch (err) {
            // ignore observer errors
          }
        } else {
          updateFloatingNoteSizeDataset(note);
        }

        if (Number.isFinite(parsedWidth) || Number.isFinite(parsedHeight)) {
          applyFloatingNoteSize(note, parsedWidth, parsedHeight);
        }

        // ✅ CORRECCIÓN APLICADA AQUÍ
        const defaultOffset = (floatingNoteCreationOffset += 40);
        const layerRect = floatingNotesLayer.getBoundingClientRect();

        // ✓ Sin sumar scrollX/scrollY porque la capa es position:fixed
        const layerPageLeft = layerRect.left;
        const layerPageTop = layerRect.top;
        const baseViewportLeft = 80 + (defaultOffset % 160);
        const baseViewportTop = 120 + (defaultOffset % 240);
        const fallbackLeft = Math.max(0, baseViewportLeft - layerPageLeft);
        const fallbackTop = Math.max(0, baseViewportTop - layerPageTop);
        const initialPosition = resolveFloatingNoteInitialPosition(noteData, fallbackLeft, fallbackTop);

        positionFloatingNote(note, initialPosition.left, initialPosition.top);
        bringNoteToFront(note);

        syncNoteElementMeta(note, noteData);
        attachExistingAnchor(note, noteData.anchorId);

        if (data.focus !== false && isEditMode) {
          setTimeout(() => body.focus(), 0);
        }

        scheduleNotesViewRefresh();
        scheduleFloatingNotesViewportRefresh();
        return note;
      }

      function attachFloatingNoteResizeHandles(note) {
        if (!note) return;
        if (note.querySelector('.floating-note-resize-handle')) {
          return;
        }

        const createSideHandle = (edge) => {
          const handle = document.createElement('div');
          handle.className = `floating-note-resize-handle handle-${edge}`;
          handle.setAttribute('role', 'separator');
          handle.setAttribute('aria-orientation', 'horizontal');
          handle.tabIndex = -1;
          handle.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            event.stopPropagation();
            closeFloatingNoteStyleMenu();
            startFloatingNoteHorizontalResize(note, edge, event);
          });
          return handle;
        };

        const createCornerHandle = (corner) => {
          const handle = document.createElement('div');
          handle.className = `floating-note-resize-handle handle-corner handle-corner-${corner}`;
          handle.setAttribute('role', 'separator');
          const label = corner === 'top-left'
            ? 'Redimensionar nota desde la esquina superior izquierda'
            : 'Redimensionar nota';
          handle.setAttribute('aria-label', label);
          handle.tabIndex = -1;
          handle.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) return;
            event.stopPropagation();
            closeFloatingNoteStyleMenu();
            startFloatingNoteCornerResize(note, corner, event);
          });
          return handle;
        };

        const leftHandle = createSideHandle('left');
        const rightHandle = createSideHandle('right');
        const topLeftHandle = createCornerHandle('top-left');
        note.append(topLeftHandle, leftHandle, rightHandle);
      }

      function buildNoteOptionsMenu(note) {
        const menu = document.createElement('div');
        menu.className = 'floating-note-style-menu note-options-menu';
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-hidden', 'true');
        menu.setAttribute('aria-label', 'Opciones de nota');

        const quickWrapper = document.createElement('div');
        quickWrapper.className = 'note-menu-quick';

        const categorySection = document.createElement('div');
        categorySection.className = 'note-menu-section note-menu-categories';
        const categoryTitle = document.createElement('div');
        categoryTitle.className = 'note-menu-title';
        categoryTitle.textContent = '🏷️';
        categorySection.appendChild(categoryTitle);
        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'note-menu-category-grid';
        Object.entries(NOTE_CATEGORIES).forEach(([key, info]) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.dataset.categoryId = key;
          btn.className = 'note-category-btn';
          btn.textContent = info.icon;
          btn.title = info.label;
          btn.setAttribute('aria-label', info.label);
          btn.addEventListener('click', (event) => {
            event.stopPropagation();
            setNoteCategory(note, key);
            syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
            closeFloatingNoteStyleMenu(menu);
          });
          categoryGrid.appendChild(btn);
        });
        categorySection.appendChild(categoryGrid);
        quickWrapper.appendChild(categorySection);

        const prioritySection = document.createElement('div');
        prioritySection.className = 'note-menu-section note-menu-priority';
        const priorityTitle = document.createElement('div');
        priorityTitle.className = 'note-menu-title';
        priorityTitle.textContent = '⚑';
        prioritySection.appendChild(priorityTitle);
        const priorityOptions = document.createElement('div');
        priorityOptions.className = 'note-menu-priority-options';
        const priorityDefinitions = [
          { id: 'high', label: 'Alta', icon: '⭐' },
          { id: 'normal', label: 'Normal', icon: '⚑' },
          { id: 'low', label: 'Baja', icon: '⬇️' }
        ];
        priorityDefinitions.forEach(({ id, label, icon }) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'note-priority-option';
          button.dataset.priorityId = id;
          button.textContent = `${icon} ${label}`;
          button.setAttribute('aria-pressed', 'false');
          button.addEventListener('click', (event) => {
            event.stopPropagation();
            setNotePriority(note, id);
            syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
            closeFloatingNoteStyleMenu(menu);
          });
          priorityOptions.appendChild(button);
        });
        prioritySection.appendChild(priorityOptions);
        quickWrapper.appendChild(prioritySection);

        const iconSection = document.createElement('div');
        iconSection.className = 'note-menu-section note-menu-icons';
        const iconTitle = document.createElement('div');
        iconTitle.className = 'note-menu-title';
        iconTitle.textContent = '🔖';
        iconSection.appendChild(iconTitle);

        const iconResetBtn = document.createElement('button');
        iconResetBtn.type = 'button';
        iconResetBtn.className = 'note-icon-reset';
        iconResetBtn.dataset.iconSymbol = '';
        iconResetBtn.textContent = 'Icono predeterminado';
        iconResetBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          setNoteCustomIcon(note, null);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });
        iconSection.appendChild(iconResetBtn);

        const iconGrid = document.createElement('div');
        iconGrid.className = 'note-icon-grid';
        NOTE_ICON_SYMBOLS.forEach(symbol => {
          const iconBtn = document.createElement('button');
          iconBtn.type = 'button';
          iconBtn.dataset.iconSymbol = symbol;
          iconBtn.className = 'note-icon-option';
          iconBtn.textContent = symbol;
          iconBtn.title = `Usar icono ${symbol}`;
          iconBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            setNoteCustomIcon(note, symbol);
            syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
            closeFloatingNoteStyleMenu(menu);
          });
          iconGrid.appendChild(iconBtn);
        });
        iconSection.appendChild(iconGrid);
        quickWrapper.appendChild(iconSection);

        const styleSection = document.createElement('div');
        styleSection.className = 'note-menu-section note-menu-styles';
        const styleTitle = document.createElement('div');
        styleTitle.className = 'note-menu-title';
        styleTitle.textContent = '🎨';
        styleSection.appendChild(styleTitle);

        const styleGrid = document.createElement('div');
        styleGrid.className = 'note-menu-style-grid';
        NOTE_STYLE_PRESETS.forEach(preset => {
          const optionBtn = document.createElement('button');
          optionBtn.type = 'button';
          optionBtn.dataset.styleId = preset.id;
          optionBtn.className = 'note-style-btn';
          optionBtn.title = preset.name;
          optionBtn.setAttribute('aria-label', preset.name);

          const preview = document.createElement('span');
          preview.className = 'note-style-preview';
          if (preset.className) {
            preview.classList.add(preset.className);
          }

          optionBtn.append(preview);
          optionBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            applyFloatingNoteStyle(note, preset.id);
            const noteId = note.dataset.noteId;
            if (noteId) {
              updateNoteData(noteId, { style: preset.id });
            }
            syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
            closeFloatingNoteStyleMenu(menu);
          });
          styleGrid.appendChild(optionBtn);
        });
        styleSection.appendChild(styleGrid);

        const resetSizeBtn = document.createElement('button');
        resetSizeBtn.type = 'button';
        resetSizeBtn.className = 'floating-note-reset-size';
        resetSizeBtn.textContent = 'Tamaño original';
        resetSizeBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          resetFloatingNoteSize(note);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });
        styleSection.appendChild(resetSizeBtn);

        quickWrapper.appendChild(styleSection);

        const borderSection = document.createElement('div');
        borderSection.className = 'note-menu-section note-menu-border';
        const borderTitle = document.createElement('div');
        borderTitle.className = 'note-menu-title';
        borderTitle.textContent = '🖊️ Borde';
        borderSection.appendChild(borderTitle);

        const borderToggle = document.createElement('button');
        borderToggle.type = 'button';
        borderToggle.className = 'note-border-toggle';
        borderToggle.textContent = 'Borde visible';
        borderToggle.addEventListener('click', (event) => {
          event.stopPropagation();
          const noteId = note.dataset.noteId;
          const currentData = noteId ? notesRegistry.get(noteId) : null;
          const isEnabled = currentData?.borderEnabled === false ? false : note.dataset.borderEnabled !== 'false';
          applyFloatingNoteBorderState(note, { enabled: !isEnabled });
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
        });
        borderSection.appendChild(borderToggle);

        const borderPalette = document.createElement('div');
        borderPalette.className = 'note-border-colors';
        const borderColorButtons = [];
        FLOATING_NOTE_BORDER_COLORS.forEach(colorValue => {
          const colorBtn = document.createElement('button');
          colorBtn.type = 'button';
          colorBtn.className = 'note-border-color-btn';
          colorBtn.style.setProperty('--note-border-color', colorValue);
          colorBtn.dataset.borderColor = colorValue;
          colorBtn.title = `Color ${colorValue}`;
          colorBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            applyFloatingNoteBorderState(note, { color: colorValue });
            syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          });
          borderColorButtons.push(colorBtn);
          borderPalette.appendChild(colorBtn);
        });
        borderSection.appendChild(borderPalette);

        const borderColorInput = document.createElement('input');
        borderColorInput.type = 'color';
        borderColorInput.className = 'note-border-color-input';
        borderColorInput.value = FLOATING_NOTE_BORDER_DEFAULT_COLOR;
        borderColorInput.title = 'Color personalizado';
        borderColorInput.addEventListener('input', (event) => {
          event.stopPropagation();
          applyFloatingNoteBorderState(note, { color: borderColorInput.value });
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
        });
        borderSection.appendChild(borderColorInput);

        const borderWidthRow = document.createElement('div');
        borderWidthRow.className = 'note-border-width-row';
        const borderWidthLabel = document.createElement('span');
        borderWidthLabel.textContent = 'Grosor';
        borderWidthLabel.className = 'note-border-width-label';
        const borderWidthInput = document.createElement('input');
        borderWidthInput.type = 'range';
        borderWidthInput.min = '0';
        borderWidthInput.max = '12';
        borderWidthInput.step = '0.5';
        borderWidthInput.value = String(FLOATING_NOTE_BORDER_DEFAULT_WIDTH);
        borderWidthInput.className = 'note-border-width-input';
        const borderWidthValue = document.createElement('span');
        borderWidthValue.className = 'note-border-width-value';
        borderWidthValue.textContent = `${FLOATING_NOTE_BORDER_DEFAULT_WIDTH}px`;
        borderWidthInput.addEventListener('input', (event) => {
          event.stopPropagation();
          const numeric = Number.parseFloat(borderWidthInput.value);
          borderWidthValue.textContent = `${borderWidthInput.value}px`;
          applyFloatingNoteBorderState(note, { width: numeric });
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
        });
        borderWidthRow.append(borderWidthLabel, borderWidthInput, borderWidthValue);
        borderSection.appendChild(borderWidthRow);

        quickWrapper.appendChild(borderSection);
        menu._borderControls = {
          toggleBtn: borderToggle,
          colorButtons: borderColorButtons,
          colorInput: borderColorInput,
          widthInput: borderWidthInput,
          widthValue: borderWidthValue
        };

        menu.appendChild(quickWrapper);

        menu.appendChild(Object.assign(document.createElement('div'), { className: 'note-menu-divider' }));

        const actionsSection = document.createElement('div');
        actionsSection.className = 'note-menu-section note-menu-actions';
        const actionsTitle = document.createElement('div');
        actionsTitle.className = 'note-menu-title';
        actionsTitle.textContent = '⚙️';
        actionsSection.appendChild(actionsTitle);

        const inlineActions = document.createElement('div');
        inlineActions.className = 'note-menu-inline-actions';

        const compactHeaderBtn = document.createElement('button');
        compactHeaderBtn.type = 'button';
        compactHeaderBtn.dataset.action = 'toggle-compact-header';
        compactHeaderBtn.classList.add('note-compact-toggle');
        compactHeaderBtn.textContent = '🧩 Encabezado compacto';
        compactHeaderBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          toggleNoteHeaderCompact(note);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });

        const ultraCompactBtn = document.createElement('button');
        ultraCompactBtn.type = 'button';
        ultraCompactBtn.dataset.action = 'toggle-ultra-compact';
        ultraCompactBtn.classList.add('note-ultra-compact-toggle');
        ultraCompactBtn.textContent = '🎯 Modo ultracompacto';
        ultraCompactBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          toggleNoteUltraCompact(note);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });

        const neutralTextBtn = document.createElement('button');
        neutralTextBtn.type = 'button';
        neutralTextBtn.dataset.action = 'toggle-neutral-text';
        neutralTextBtn.classList.add('note-neutral-text-toggle');
        neutralTextBtn.textContent = '🖋️ Texto negro';
        neutralTextBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          toggleFloatingNoteNeutralText(note);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });

        const hoverAnimationBtn = document.createElement('button');
        hoverAnimationBtn.type = 'button';
        hoverAnimationBtn.dataset.action = 'toggle-hover-animation';
        hoverAnimationBtn.classList.add('note-hover-toggle');
        hoverAnimationBtn.textContent = '✨ Animación hover';
        hoverAnimationBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          toggleNoteHoverAnimation(note);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });

        const superNoteBtn = document.createElement('button');
        superNoteBtn.type = 'button';
        superNoteBtn.dataset.action = 'toggle-super-note';
        superNoteBtn.classList.add('note-super-toggle');
        superNoteBtn.textContent = '🪄 Convertir en super nota';
        superNoteBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          toggleSuperNoteMode(note);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });

        const tagsBtn = document.createElement('button');
        tagsBtn.type = 'button';
        tagsBtn.textContent = '🏷️ Etiquetas';
        tagsBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          promptNoteTags(note);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });

        const reviewBtn = document.createElement('button');
        reviewBtn.type = 'button';
        reviewBtn.dataset.action = 'toggle-reviewed';
        reviewBtn.textContent = '✓ Marcar revisada';
        reviewBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          toggleNoteReviewed(note);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });

        const behindBtn = document.createElement('button');
        behindBtn.type = 'button';
        behindBtn.dataset.action = 'toggle-behind';
        behindBtn.classList.add('note-behind-toggle');
        behindBtn.textContent = '🗂️ Usar espacio oculto';
        behindBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          toggleNoteBehindMain(note);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });

        inlineActions.append(
          compactHeaderBtn,
          ultraCompactBtn,
          neutralTextBtn,
          hoverAnimationBtn,
          superNoteBtn,
          tagsBtn,
          reviewBtn,
          behindBtn
        );
        actionsSection.appendChild(inlineActions);

        const duplicateBtn = document.createElement('button');
        duplicateBtn.type = 'button';
        duplicateBtn.className = 'note-menu-secondary';
        duplicateBtn.textContent = '📄 Duplicar nota';
        duplicateBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          duplicateFloatingNote(note);
          closeFloatingNoteStyleMenu(menu);
        });
        actionsSection.appendChild(duplicateBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'note-menu-danger';
        deleteBtn.textContent = '🗑️ Eliminar nota';
        deleteBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          deleteFloatingNote(note);
          closeFloatingNoteStyleMenu(menu);
        });
        actionsSection.appendChild(deleteBtn);

        menu.appendChild(actionsSection);
        return menu;
      }

      function syncNoteOptionsMenu(menu, noteData) {
        if (!menu || !noteData) return;
        syncFloatingNoteStyleMenu(menu, noteData.style || DEFAULT_NOTE_STYLE);
        menu.querySelectorAll('button[data-category-id]').forEach(button => {
          const isActive = button.dataset.categoryId === noteData.category;
          button.classList.toggle('active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        const activePriority = noteData.priority || DEFAULT_NOTE_PRIORITY;
        menu.querySelectorAll('button[data-priority-id]').forEach(button => {
          const isActive = button.dataset.priorityId === activePriority;
          button.classList.toggle('active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        const currentIcon = typeof noteData.customIcon === 'string' && noteData.customIcon.length
          ? noteData.customIcon
          : '';
        menu.querySelectorAll('button[data-icon-symbol]').forEach(button => {
          const symbol = button.dataset.iconSymbol || '';
          const isActive = symbol === currentIcon;
          button.classList.toggle('active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        const reviewBtn = menu.querySelector('button[data-action="toggle-reviewed"]');
        if (reviewBtn) {
          reviewBtn.textContent = noteData.reviewed ? '↺ Reiniciar revisión' : '✓ Marcar revisada';
        }
        const compactBtn = menu.querySelector('button[data-action="toggle-compact-header"]');
        if (compactBtn) {
          const isCompact = !!noteData.compactHeader;
          compactBtn.textContent = isCompact ? '🧩 Encabezado completo' : '🧩 Encabezado compacto';
          compactBtn.setAttribute('aria-pressed', isCompact ? 'true' : 'false');
          compactBtn.classList.toggle('active', isCompact);
        }
        const ultraBtn = menu.querySelector('button[data-action="toggle-ultra-compact"]');
        if (ultraBtn) {
          const isUltra = noteData.ultraCompact === true;
          ultraBtn.textContent = isUltra ? '🎯 Encabezado normal' : '🎯 Modo ultracompacto';
          ultraBtn.setAttribute('aria-pressed', isUltra ? 'true' : 'false');
          ultraBtn.classList.toggle('active', isUltra);
        }
        const hoverBtn = menu.querySelector('button[data-action="toggle-hover-animation"]');
        if (hoverBtn) {
          const isActive = noteData.hoverAnimation === true;
          hoverBtn.textContent = isActive ? '✨ Animación activa' : '✨ Animación desactivada';
          hoverBtn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          hoverBtn.classList.toggle('active', isActive);
        }
        const superBtn = menu.querySelector('button[data-action="toggle-super-note"]');
        if (superBtn) {
          const isSuper = noteData.superNote === true;
          superBtn.textContent = isSuper ? '🪄 Volver a nota simple' : '🪄 Convertir en super nota';
          superBtn.setAttribute('aria-pressed', isSuper ? 'true' : 'false');
          superBtn.classList.toggle('active', isSuper);
        }
        const neutralBtn = menu.querySelector('button[data-action="toggle-neutral-text"]');
        if (neutralBtn) {
          const isNeutral = noteData.styleNeutralText === true;
          neutralBtn.textContent = isNeutral ? '🖋️ Texto negro activo' : '🖋️ Texto del estilo';
          neutralBtn.setAttribute('aria-pressed', isNeutral ? 'true' : 'false');
          neutralBtn.classList.toggle('active', isNeutral);
        }
        const behindBtn = menu.querySelector('button[data-action="toggle-behind"]');
        if (behindBtn) {
          const isBehind = !!noteData.behindMainContent;
          behindBtn.textContent = isBehind ? '📄 Traer al frente' : '🗂️ Usar espacio oculto';
          behindBtn.setAttribute('aria-pressed', isBehind ? 'true' : 'false');
          behindBtn.classList.toggle('active', isBehind);
        }
        const borderControls = menu._borderControls;
        if (borderControls) {
          const { toggleBtn, colorButtons = [], colorInput, widthInput, widthValue } = borderControls;
          const noteId = noteData.id || menu.dataset.noteId;
          const noteElement = noteId
            ? floatingNotesLayer?.querySelector(`.floating-note[data-note-id="${safeCssEscape(noteId)}"]`)
            : null;
          const base = noteElement ? resolveFloatingNoteBorderBase(noteElement) : {
            color: FLOATING_NOTE_BORDER_DEFAULT_COLOR,
            width: FLOATING_NOTE_BORDER_DEFAULT_WIDTH
          };
          const enabled = noteData.borderEnabled === false ? false : noteElement?.dataset.borderEnabled === 'false' ? false : true;
          const rawWidth = Number.isFinite(noteData.borderWidth)
            ? Math.max(Number(noteData.borderWidth), 0)
            : (Number.isFinite(parseFloat(noteElement?.dataset.borderWidth)) ? Math.max(parseFloat(noteElement.dataset.borderWidth), 0) : base.width);
          const finalWidth = enabled ? (rawWidth > 0 ? rawWidth : FLOATING_NOTE_BORDER_DEFAULT_WIDTH) : rawWidth;
          const storedColor = noteData.borderColor
            || noteElement?.dataset.borderColor
            || base.color;
          const finalColor = normalizeColorToHex(storedColor || base.color, base.color);

          if (toggleBtn) {
            toggleBtn.textContent = enabled ? 'Borde visible' : 'Sin borde';
            toggleBtn.classList.toggle('active', enabled);
            toggleBtn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
          }
          if (widthInput) {
            widthInput.value = String(enabled ? finalWidth : Math.max(finalWidth, 0));
            widthInput.disabled = !enabled;
          }
          if (widthValue) {
            const displayWidth = enabled ? (finalWidth || FLOATING_NOTE_BORDER_DEFAULT_WIDTH) : Math.max(finalWidth || 0, 0);
            widthValue.textContent = `${displayWidth}px`;
          }
          colorButtons.forEach(btn => {
            const btnColor = btn?.dataset?.borderColor || '';
            const normalizedBtnColor = normalizeColorToHex(btnColor || '', btnColor || finalColor).toLowerCase();
            btn.classList.toggle('active', normalizedBtnColor === finalColor.toLowerCase());
            btn.disabled = !enabled;
          });
          if (colorInput) {
            colorInput.value = finalColor;
            colorInput.disabled = !enabled;
          }
        }
      }

      function deleteFloatingNote(note) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (floatingNoteResizeObserver) {
          try {
            floatingNoteResizeObserver.unobserve(note);
          } catch (err) {
            // ignore observer errors
          }
        }
        const ui = note._ui;
        if (ui?.optionsMenu) {
          closeFloatingNoteStyleMenu(ui.optionsMenu);
          ui.optionsMenu.remove();
        }
        note.remove();
        removeNoteAnchor(noteId);
        removeNoteData(noteId);
      }

      function duplicateFloatingNote(note) {
        if (!note) return null;
        const noteId = note.dataset.noteId;
        if (!noteId) return null;
        const original = notesRegistry.get(noteId);
        if (!original) return null;

        const baseLeft = Number.parseFloat(note.dataset.left || note.style.left || '0');
        const baseTop = Number.parseFloat(note.dataset.top || note.style.top || '0');
        const currentWidth = Math.round(note.offsetWidth || Number(original.width) || FLOATING_NOTE_DEFAULT_WIDTH);
        const currentHeight = Math.round(note.offsetHeight || Number(original.height) || FLOATING_NOTE_MIN_HEIGHT);
        const pagesClone = Array.isArray(original.pages)
          ? original.pages.map(page => ({ ...page }))
          : undefined;

        const metaClone = { ...original };
        delete metaClone.element;

        const duplicated = createFloatingNote({
          style: original.style,
          html: original.html,
          title: original.title,
          titleHtml: original.titleHtml,
          category: original.category,
          priority: original.priority,
          tags: Array.isArray(original.tags) ? [...original.tags] : undefined,
          reviewed: original.reviewed,
          reviewCount: original.reviewCount,
          lastReviewed: original.lastReviewed,
          topicId: original.topicId,
          sectionId: original.sectionId,
          type: original.type,
          linkedTo: null,
          anchorId: null,
          left: baseLeft + 32,
          top: baseTop + 32,
          width: currentWidth,
          height: currentHeight,
          pages: pagesClone,
          currentPageIndex: original.currentPageIndex,
          behindMainContent: original.behindMainContent,
          compactHeader: original.compactHeader,
          ultraCompact: original.ultraCompact,
          hoverAnimation: original.hoverAnimation,
          styleNeutralText: original.styleNeutralText,
          customIcon: original.customIcon,
          superNote: original.superNote,
          superTabs: cloneSuperTabs(original.superTabs),
          activeSuperTabId: original.activeSuperTabId,
          focus: true,
          meta: metaClone
        });

        if (duplicated) {
          bringNoteToFront(duplicated);
        }

        return duplicated;
      }

      function setNoteCategory(note, categoryId) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const normalized = (categoryId || '').toUpperCase();
        const finalCategory = NOTE_CATEGORIES[normalized] ? normalized : DEFAULT_NOTE_CATEGORY;
        const updated = updateNoteData(noteId, { category: finalCategory });
        syncNoteElementMeta(note, updated);
      }

      function setNoteTags(note, tags) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const updated = updateNoteData(noteId, { tags: sanitizeTags(tags) });
        syncNoteElementMeta(note, updated);
      }

      function promptNoteTags(note) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const currentData = notesRegistry.get(noteId) || ensureNoteData(noteId);
        const currentTags = (currentData.tags || []).join(', ');
        const input = prompt('Ingresa etiquetas separadas por coma:', currentTags);
        if (input === null) return;
        const tags = input.split(',').map(tag => tag.trim()).filter(Boolean);
        setNoteTags(note, tags);
      }

      function setNotePriority(note, priority) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const normalized = NOTE_PRIORITY_SEQUENCE.includes(priority)
          ? priority
          : DEFAULT_NOTE_PRIORITY;
        const updated = updateNoteData(noteId, { priority: normalized });
        syncNoteElementMeta(note, updated);
      }

      function cycleNotePriority(note) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        const currentIndex = NOTE_PRIORITY_SEQUENCE.indexOf(current.priority || DEFAULT_NOTE_PRIORITY);
        const nextPriority = NOTE_PRIORITY_SEQUENCE[(currentIndex + 1) % NOTE_PRIORITY_SEQUENCE.length];
        setNotePriority(note, nextPriority);
      }

      function toggleNoteReviewed(note, forceValue = null) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        const shouldMark = forceValue === null ? !current.reviewed : !!forceValue;
        const updated = updateNoteData(noteId, {
          reviewed: shouldMark,
          reviewCount: shouldMark ? (Number(current.reviewCount) || 0) + 1 : current.reviewCount || 0,
          lastReviewed: shouldMark ? new Date().toISOString() : null
        });
        syncNoteElementMeta(note, updated);
      }

      function beginNoteLinking(note) {
        if (!note) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          alert('Selecciona un texto para anclar la nota.');
          return;
        }
        const range = selection.getRangeAt(0);
        if (range.collapsed) {
          alert('Selecciona un fragmento de texto antes de anclar la nota.');
          return;
        }
        const noteId = note.dataset.noteId;
        removeNoteAnchor(noteId);
        const anchorId = generateUniqueId('note-anchor');
        const anchor = document.createElement('span');
        anchor.className = 'note-anchor';
        anchor.dataset.noteId = noteId;
        anchor.id = anchorId;
        range.collapse(false);
        range.insertNode(anchor);
        selection.removeAllRanges();
        attachAnchorEvents(anchor, note);
        const updated = updateNoteData(noteId, { anchorId, linkedTo: anchorId });
        syncNoteElementMeta(note, updated);
      }

      function attachExistingAnchor(note, anchorId) {
        if (!note || !anchorId) return;
        const existing = document.getElementById(anchorId) || document.querySelector(`.note-anchor[data-note-id="${note.dataset.noteId}"]`);
        if (existing) {
          existing.dataset.noteId = note.dataset.noteId;
          if (!existing.id) {
            existing.id = anchorId;
          }
          attachAnchorEvents(existing, note);
        }
      }

      function attachAnchorEvents(anchor, note) {
        if (!anchor || !note) return;
        anchor.addEventListener('click', () => {
          bringNoteToFront(note);
          note.classList.add('pulse-highlight');
          note.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          setTimeout(() => note.classList.remove('pulse-highlight'), 1600);
        });
      }

      function clearNoteAnchor(note) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        removeNoteAnchor(noteId);
        const updated = updateNoteData(noteId, { anchorId: null, linkedTo: null });
        syncNoteElementMeta(note, updated);
      }

      function removeNoteAnchor(noteId) {
        if (!noteId) return;
        document.querySelectorAll(`.note-anchor[data-note-id="${noteId}"]`).forEach(anchor => anchor.remove());
      }

      function updateFloatingNotePageUI(note, noteData) {
        if (!note) return;
        const ui = note._ui || {};
        const total = Math.max(Array.isArray(noteData?.pages) ? noteData.pages.length : 0, 1);
        const index = Math.min(
          Math.max(Number(noteData?.currentPageIndex) || 0, 0),
          total - 1
        );
        if (ui.pageIndicator) {
          ui.pageIndicator.textContent = `${index + 1}/${total}`;
        }
        if (ui.prevPageBtn) {
          ui.prevPageBtn.disabled = index <= 0;
        }
        if (ui.nextPageBtn) {
          ui.nextPageBtn.disabled = index >= total - 1;
        }
        if (ui.removePageBtn) {
          ui.removePageBtn.disabled = total <= 1;
        }
      }

      function goToFloatingNotePage(note, direction) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const currentData = notesRegistry.get(noteId) || ensureNoteData(noteId);
        const pages = Array.isArray(currentData?.pages) ? currentData.pages : [];
        if (!pages.length) {
          return;
        }
        const currentIndex = Math.min(
          Math.max(Number(currentData.currentPageIndex) || 0, 0),
          pages.length - 1
        );
        let nextIndex = currentIndex + (Number(direction) || 0);
        nextIndex = Math.min(Math.max(nextIndex, 0), pages.length - 1);
        if (nextIndex === currentIndex) {
          return;
        }
        const targetPage = pages[nextIndex] || { html: '', content: '' };
        const updated = updateNoteData(noteId, {
          currentPageIndex: nextIndex,
          html: targetPage.html || '',
          content: targetPage.content || ''
        });
        const body = note.querySelector('.floating-note-body');
        if (body) {
          body.innerHTML = targetPage.html || '';
          markFloatingNoteImagesInitialized(body);
          if (isEditMode) {
            setTimeout(() => body.focus(), 0);
          }
        }
        syncNoteElementMeta(note, updated);
      }

      function addFloatingNotePage(note) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const currentData = notesRegistry.get(noteId) || ensureNoteData(noteId);
        const existingPages = Array.isArray(currentData?.pages)
          ? currentData.pages.map(page => ({ ...page }))
          : [];
        const nowIso = new Date().toISOString();
        const newPage = {
          id: generateUniqueId('note-page'),
          title: null,
          html: '',
          content: '',
          createdAt: nowIso,
          updatedAt: nowIso
        };
        const pages = [...existingPages, newPage];
        const updated = updateNoteData(noteId, {
          pages,
          currentPageIndex: pages.length - 1,
          html: '',
          content: '',
          updatedAt: nowIso
        });
        const body = note.querySelector('.floating-note-body');
        if (body) {
          body.innerHTML = '';
          markFloatingNoteImagesInitialized(body);
          if (isEditMode) {
            setTimeout(() => body.focus(), 0);
          }
        }
        syncNoteElementMeta(note, updated);
      }

      function removeFloatingNotePage(note) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const currentData = notesRegistry.get(noteId) || ensureNoteData(noteId);
        const existingPages = Array.isArray(currentData?.pages)
          ? currentData.pages.map(page => ({ ...page }))
          : [];
        if (existingPages.length <= 1) {
          return;
        }
        if (!window.confirm('¿Eliminar esta subnota?')) {
          return;
        }
        const currentIndex = Math.min(
          Math.max(Number(currentData.currentPageIndex) || 0, 0),
          existingPages.length - 1
        );
        existingPages.splice(currentIndex, 1);
        const nextIndex = Math.min(currentIndex, existingPages.length - 1);
        const activePage = existingPages[nextIndex] || { html: '', content: '' };
        const nowIso = new Date().toISOString();
        const updated = updateNoteData(noteId, {
          pages: existingPages,
          currentPageIndex: nextIndex,
          html: activePage.html || '',
          content: activePage.content || '',
          updatedAt: nowIso
        });
        const body = note.querySelector('.floating-note-body');
        if (body) {
          body.innerHTML = activePage.html || '';
          markFloatingNoteImagesInitialized(body);
          if (isEditMode) {
            setTimeout(() => body.focus(), 0);
          }
        }
        syncNoteElementMeta(note, updated);
      }

      function syncNoteElementMeta(note, noteData) {
        if (!note || !noteData) return;
        note.dataset.category = noteData.category || DEFAULT_NOTE_CATEGORY;
        note.dataset.priority = noteData.priority || DEFAULT_NOTE_PRIORITY;
        note.dataset.reviewed = noteData.reviewed ? 'true' : 'false';
        applyNoteHoverAnimationState(note, noteData.hoverAnimation === true, { persist: false });
        applyFloatingNoteTextNeutralState(note, noteData.styleNeutralText === true, { persist: false });
        updateSuperNoteBody(note, noteData);
        if (noteData.topicId) {
          note.dataset.topicId = noteData.topicId;
        } else {
          delete note.dataset.topicId;
        }
        if (noteData.sectionId) {
          note.dataset.sectionId = noteData.sectionId;
        } else {
          delete note.dataset.sectionId;
        }
        if (Number.isFinite(noteData.pageOffsetTop)) {
          note.dataset.pageOffsetTop = String(noteData.pageOffsetTop);
        } else {
          delete note.dataset.pageOffsetTop;
        }
        if (Number.isFinite(noteData.relativeTop)) {
          note.dataset.relativeTop = String(noteData.relativeTop);
        } else {
          delete note.dataset.relativeTop;
        }

        applyNoteBehindState(note, !!noteData.behindMainContent, { persist: false });

        const ui = note._ui || {};
        renderSuperNoteUI(note, noteData);
        const categoryInfo = getNoteCategoryInfo(noteData.category);
        if (ui.categoryIcon) {
          const iconSymbol = typeof noteData.customIcon === 'string' && noteData.customIcon.length
            ? noteData.customIcon
            : categoryInfo.icon;
          ui.categoryIcon.textContent = iconSymbol;
        }
        if (noteData.customIcon) {
          note.dataset.customIcon = noteData.customIcon;
        } else {
          delete note.dataset.customIcon;
        }
        if (ui.categoryLabel) {
          const displayTitle = getNoteDisplayTitle(noteData.title, '');
          const hasCustomTitle = displayTitle.length > 0;
          if (ui.categoryLabel.dataset.editing !== 'true') {
            const titleHtml = noteData.titleHtml || (hasCustomTitle ? escapeHtml(displayTitle) : '');
            ui.categoryLabel.innerHTML = titleHtml;
            ui.categoryLabel.classList.toggle('note-label-empty', !hasCustomTitle);
          }
          if (ui.categoryWrap) {
            const tooltip = hasCustomTitle
              ? `Título: ${displayTitle}`
              : `Haz clic para nombrar la nota (${categoryInfo.label})`;
            ui.categoryWrap.title = tooltip;
            ui.categoryWrap.setAttribute('aria-label', tooltip);
            ui.categoryWrap.dataset.editableTitle = ui.categoryLabel?.contentEditable === 'true' ? 'true' : 'false';
          }
        }
        if (ui.tagsContainer) {
          ui.tagsContainer.innerHTML = '';
          (noteData.tags || []).forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = `#${tag}`;
            ui.tagsContainer.appendChild(span);
          });
        }
        if (ui.optionsMenu) {
          syncNoteOptionsMenu(ui.optionsMenu, noteData);
        }

        applyNoteHeaderCompactState(note, !!noteData.compactHeader, { persist: false });
        applyNoteUltraCompactState(note, !!noteData.ultraCompact, { persist: false });
        updateFloatingNotePageUI(note, noteData);
        applyFloatingNoteTopicVisibility(note);
      }

      function formatDateTime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
      }

      function createFlashcardFromNote(noteData) {
        if (!noteData) return;
        console.info('Solicitud de creación de flashcard para la nota:', noteData);
      }

      function getCurrentTopicId() {
        return currentPageRef?.dataset.topicId || '';
      }

      function getCurrentSectionId() {
        return currentSectionId || '';
      }

      function findPageByTopicId(topicId) {
        if (!topicId) return null;
        return pages.find(page => page.dataset.topicId === topicId) || null;
      }

      function restoreFloatingNotes(notes = [], hidden = false) {
        clearFloatingNotes();
        if (Array.isArray(notes)) {
          notes.forEach(noteData => {
            if (!noteData || typeof noteData !== 'object') return;
            createFloatingNote({
              id: noteData.id,
              style: noteData.style,
              html: typeof noteData.html === 'string' ? noteData.html : '',
              left: noteData.left,
              top: noteData.top,
              width: noteData.width,
              height: noteData.height,
              focus: false,
              meta: noteData.meta || noteData,
              title: noteData.title,
              titleHtml: noteData.titleHtml,
              category: noteData.category,
              priority: noteData.priority,
              tags: noteData.tags,
              reviewed: noteData.reviewed,
              reviewCount: noteData.reviewCount,
              lastReviewed: noteData.lastReviewed,
              topicId: noteData.topicId,
              sectionId: noteData.sectionId,
              type: noteData.type,
              anchorId: noteData.anchorId,
              linkedTo: noteData.linkedTo,
              pages: Array.isArray(noteData.pages) ? noteData.pages : undefined,
              currentPageIndex: Number.isInteger(noteData.currentPageIndex) ? noteData.currentPageIndex : undefined,
              pageOffsetLeft: noteData.pageOffsetLeft,
              pageOffsetTop: noteData.pageOffsetTop,
              relativeLeft: noteData.relativeLeft,
              relativeTop: noteData.relativeTop,
              behindMainContent: noteData.behindMainContent,
              compactHeader: noteData.compactHeader,
              ultraCompact: noteData.ultraCompact,
              hoverAnimation: noteData.hoverAnimation,
              styleNeutralText: noteData.styleNeutralText,
              customIcon: noteData.customIcon,
              superNote: noteData.superNote,
              superTabs: noteData.superTabs,
              activeSuperTabId: noteData.activeSuperTabId
            });
          });
        }
        setFloatingNotesVisibility(hidden);
        scheduleFloatingNotesViewportRefresh();
        scheduleTopicNoteIndicatorRefresh();
      }

      class NotesViewController {
        constructor() {
          this.panel = document.getElementById('notesViewPanel');
          this.container = document.getElementById('notesListContainer');
          this.categoryFilter = document.getElementById('noteCategoryFilter');
          this.priorityFilter = document.getElementById('notePriorityFilter');
          this.sortSelect = document.getElementById('notesSortBy');
          this.searchInput = document.getElementById('notesSearchInput');
          this.viewModeButtons = Array.from((this.panel?.querySelectorAll('.view-mode-btn')) || []);
          this.scopeButtons = Array.from((this.panel?.querySelectorAll('.scope-btn')) || []);
          this.deleteToggle = document.getElementById('notesDeleteToggle');
          this.stats = {
            total: this.panel?.querySelector('[data-stat="total"]') || null,
            unreviewed: this.panel?.querySelector('[data-stat="unreviewed"]') || null,
            highPriority: this.panel?.querySelector('[data-stat="high-priority"]') || null
          };
          this.countBadge = this.panel?.querySelector('.badge') || null;
          this.currentScope = 'all';
          this.viewMode = 'list';
          this.deleteEnabled = false;
          this.filters = {
            category: '',
            priority: '',
            sortBy: 'recent',
            search: ''
          };
          this.searchDebounce = null;
          this.bindEvents();
          this.updateBadge();
          this.updateScopeCounts();
        }

        bindEvents() {
          this.scopeButtons.forEach(button => {
            button.addEventListener('click', () => {
              const scope = button.dataset.scope || 'all';
              this.open(scope);
            });
          });

          this.categoryFilter?.addEventListener('change', () => {
            this.filters.category = this.categoryFilter.value || '';
            this.render();
          });

          this.priorityFilter?.addEventListener('change', () => {
            this.filters.priority = this.priorityFilter.value || '';
            this.render();
          });

          this.sortSelect?.addEventListener('change', () => {
            this.filters.sortBy = this.sortSelect.value || 'recent';
            this.render();
          });

          this.searchInput?.addEventListener('input', () => {
            const value = this.searchInput.value || '';
            if (this.searchDebounce) {
              clearTimeout(this.searchDebounce);
            }
            this.searchDebounce = setTimeout(() => {
              this.filters.search = value.trim().toLowerCase();
              this.render();
            }, 180);
          });

          this.viewModeButtons.forEach(button => {
            button.addEventListener('click', () => {
              this.viewModeButtons.forEach(btn => btn.classList.remove('active'));
              button.classList.add('active');
              this.viewMode = button.dataset.mode || 'list';
              this.render();
            });
          });

          this.deleteToggle?.addEventListener('click', () => {
            this.deleteEnabled = !this.deleteEnabled;
            this.render();
          });

          this.panel?.querySelector('[data-action="close-notes"]')?.addEventListener('click', () => {
            this.close();
          });

          document.getElementById('exportNotesBtn')?.addEventListener('click', () => {
            const notes = this.getFilteredNotes();
            const markdown = this.notesToMarkdown(notes);
            const title = (getDocumentTitle() || 'mis-notas').toLowerCase().replace(/\s+/g, '-');
            const timestamp = new Date().toISOString().split('T')[0];
            downloadTextFile(markdown, `${title}-notas-${timestamp}.md`, 'text/markdown;charset=utf-8');
          });

          document.getElementById('printNotesBtn')?.addEventListener('click', () => {
            this.printNotes();
          });

          document.getElementById('clearReviewedBtn')?.addEventListener('click', () => {
            this.clearReviewed();
          });
        }

        isOpen() {
          return this.panel?.classList.contains('open');
        }

        open(scope = 'all') {
          this.currentScope = scope;
          this.updateScopeButtons();
          this.updateScopeCounts();
          this.render();
          this.panel?.classList.add('open');
        }

        close() {
          if (this.deleteEnabled) {
            this.deleteEnabled = false;
            this.render();
          }
          this.panel?.classList.remove('open');
        }

        notifyNotesUpdated() {
          this.updateBadge();
          this.updateScopeCounts();
          if (this.isOpen()) {
            this.render();
          }
        }

        updateBadge() {
          if (!this.countBadge) return;
          const total = notesRegistry.size;
          this.countBadge.textContent = String(total);
        }

        updateScopeButtons() {
          this.scopeButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.scope === this.currentScope);
          });
        }

        updateScopeCounts() {
          const total = notesRegistry.size;
          const currentSection = getCurrentSectionId();
          const currentTopic = getCurrentTopicId();
          const sectionNotes = Array.from(notesRegistry.values()).filter(note => note.sectionId === currentSection);
          const topicNotes = Array.from(notesRegistry.values()).filter(note => note.topicId === currentTopic);
          this.scopeButtons.forEach(button => {
            if (!button.dataset.scope) return;
            if (button.dataset.scope === 'all') {
              button.textContent = `Todas (${total})`;
            } else if (button.dataset.scope === 'section') {
              button.textContent = `Sección actual (${sectionNotes.length})`;
            } else if (button.dataset.scope === 'topic') {
              button.textContent = `Tema actual (${topicNotes.length})`;
            }
          });
        }

        getAllNotes() {
          return Array.from(notesRegistry.values()).filter(note => isFloatingFamilyNote(note));
        }

        getFilteredNotes() {
          let notes = this.getAllNotes();
          if (this.currentScope === 'section') {
            const currentSection = getCurrentSectionId();
            notes = notes.filter(note => note.sectionId === currentSection);
          } else if (this.currentScope === 'topic') {
            const currentTopic = getCurrentTopicId();
            notes = notes.filter(note => note.topicId === currentTopic);
          }

          if (this.filters.category) {
            notes = notes.filter(note => (note.category || '').toUpperCase() === this.filters.category.toUpperCase());
          }

          if (this.filters.priority) {
            notes = notes.filter(note => (note.priority || DEFAULT_NOTE_PRIORITY) === this.filters.priority);
          }

          if (this.filters.search) {
            const search = this.filters.search;
            notes = notes.filter(note => {
              const content = (note.content || '').toLowerCase();
              const title = (note.title || '').toLowerCase();
              const tags = (note.tags || []).some(tag => tag.toLowerCase().includes(search));
              return content.includes(search) || title.includes(search) || tags;
            });
          }

          switch (this.filters.sortBy) {
            case 'oldest':
              notes.sort((a, b) => new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0));
              break;
            case 'priority':
              notes.sort((a, b) => NOTE_PRIORITY_SEQUENCE.indexOf(a.priority || DEFAULT_NOTE_PRIORITY) - NOTE_PRIORITY_SEQUENCE.indexOf(b.priority || DEFAULT_NOTE_PRIORITY));
              break;
            case 'category':
              notes.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
              break;
            case 'topic':
              notes.sort((a, b) => (this.getTopicTitle(a.topicId) || '').localeCompare(this.getTopicTitle(b.topicId) || ''));
              break;
            case 'unreviewed':
              notes.sort((a, b) => Number(a.reviewed || false) - Number(b.reviewed || false));
              break;
            case 'recent':
            default:
              notes.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
              break;
          }

          return notes;
        }

        render() {
          if (!this.container) return;
          if (this.panel) {
            this.panel.classList.toggle('delete-mode', this.deleteEnabled);
          }
          if (this.deleteToggle) {
            this.deleteToggle.classList.toggle('active', this.deleteEnabled);
            this.deleteToggle.setAttribute('aria-pressed', this.deleteEnabled ? 'true' : 'false');
            const baseTitle = this.deleteToggle.dataset.baseTitle || this.deleteToggle.title || 'Eliminar notas individualmente';
            if (!this.deleteToggle.dataset.baseTitle) {
              this.deleteToggle.dataset.baseTitle = baseTitle;
            }
            this.deleteToggle.title = this.deleteEnabled ? 'Desactivar eliminación individual' : baseTitle;
          }
          const notes = this.getFilteredNotes();
          this.container.innerHTML = '';

          const stats = {
            total: notesRegistry.size,
            unreviewed: Array.from(notesRegistry.values()).filter(note => !note.reviewed).length,
            highPriority: Array.from(notesRegistry.values()).filter(note => note.priority === 'high').length
          };
          this.updateStats(stats);

          if (notes.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'note-list-empty';
            empty.textContent = 'No hay notas para mostrar.';
            this.container.appendChild(empty);
            return;
          }

          if (this.currentScope === 'all') {
            const grouped = this.groupNotesBySection(notes);
            grouped.forEach(group => {
              const sectionWrapper = document.createElement('div');
              sectionWrapper.className = 'note-section-group';
              const title = document.createElement('h4');
              title.className = 'notes-section-title';
              title.innerHTML = `${group.title || 'Sin sección'} <span class="notes-count">(${group.notes.length})</span>`;
              sectionWrapper.appendChild(title);
              group.notes.forEach(note => {
                sectionWrapper.appendChild(this.createNoteItem(note));
              });
              this.container.appendChild(sectionWrapper);
            });
          } else {
            notes.forEach(note => {
              this.container.appendChild(this.createNoteItem(note));
            });
          }
        }

        updateStats(stats) {
          if (this.stats.total) this.stats.total.textContent = String(stats.total || 0);
          if (this.stats.unreviewed) this.stats.unreviewed.textContent = String(stats.unreviewed || 0);
          if (this.stats.highPriority) this.stats.highPriority.textContent = String(stats.highPriority || 0);
        }

        groupNotesBySection(notes) {
          const map = new Map();
          notes.forEach(note => {
            const key = note.sectionId || 'sin-seccion';
            if (!map.has(key)) {
              map.set(key, { title: this.getSectionTitle(note.sectionId), notes: [] });
            }
            map.get(key).notes.push(note);
          });
          return Array.from(map.values());
        }

        createNoteItem(note) {
          const item = document.createElement('div');
          item.className = 'note-list-item';
          item.dataset.noteId = note.id;

          const header = document.createElement('div');
          header.className = 'note-item-header';
          const categoryInfo = getNoteCategoryInfo(note.category);
          const displayTitle = getNoteDisplayTitle(note.title, '');
          const categoryBadge = document.createElement('span');
          categoryBadge.className = 'note-category-badge';
          categoryBadge.textContent = displayTitle
            ? `${categoryInfo.icon} ${displayTitle}`
            : categoryInfo.icon;
          const badgeLabel = displayTitle
            ? `${categoryInfo.label}: ${displayTitle}`
            : categoryInfo.label;
          categoryBadge.title = badgeLabel;
          categoryBadge.setAttribute('aria-label', badgeLabel);
          header.appendChild(categoryBadge);

          if (note.priority === 'high') {
            const priorityBadge = document.createElement('span');
            priorityBadge.className = 'note-priority-badge high';
            priorityBadge.textContent = '⭐';
            header.appendChild(priorityBadge);
          }

          if (note.reviewed) {
            const reviewedBadge = document.createElement('span');
            reviewedBadge.className = 'note-reviewed-badge';
            reviewedBadge.textContent = '✓';
            header.appendChild(reviewedBadge);
          }

          item.appendChild(header);

          const content = document.createElement('div');
          content.className = 'note-item-content';
          const summary = getNotePlainTextFromHtml(note.html || note.content || '');
          content.innerHTML = this.highlightSearch(escapeHtml(summary));
          item.appendChild(content);

          const context = document.createElement('div');
          context.className = 'note-item-context';
          const topicSpan = document.createElement('span');
          topicSpan.className = 'note-topic';
          topicSpan.dataset.topicId = note.topicId || '';
          topicSpan.textContent = `📄 ${this.getTopicTitle(note.topicId) || 'Sin tema'}`;
          context.appendChild(topicSpan);

          if (note.tags && note.tags.length) {
            const tagsContainer = document.createElement('span');
            tagsContainer.className = 'note-tags';
            note.tags.forEach(tag => {
              const tagSpan = document.createElement('span');
              tagSpan.className = 'tag';
              tagSpan.textContent = `#${tag}`;
              tagsContainer.appendChild(tagSpan);
            });
            context.appendChild(tagsContainer);
          }
          item.appendChild(context);

          const footer = document.createElement('div');
          footer.className = 'note-item-footer';
          const dateSpan = document.createElement('span');
          dateSpan.className = 'note-date';
          dateSpan.textContent = note.updatedAt ? formatDateTime(note.updatedAt) : '';
          footer.appendChild(dateSpan);

          const actions = document.createElement('div');
          actions.className = 'note-item-actions';

          const gotoBtn = document.createElement('button');
          gotoBtn.className = 'note-goto';
          gotoBtn.title = 'Ir al tema';
          gotoBtn.textContent = '🔗';
          gotoBtn.addEventListener('click', () => this.goToNote(note));
          actions.appendChild(gotoBtn);

          const flashcardBtn = document.createElement('button');
          flashcardBtn.className = 'note-flashcard-create';
          flashcardBtn.title = 'Crear flashcard';
          flashcardBtn.textContent = '🎴';
          flashcardBtn.addEventListener('click', () => createFlashcardFromNote(note));
          actions.appendChild(flashcardBtn);

          const reviewBtn = document.createElement('button');
          reviewBtn.className = 'note-mark-reviewed';
          reviewBtn.title = note.reviewed ? 'Reiniciar revisión' : 'Marcar como revisada';
          reviewBtn.textContent = note.reviewed ? '↺' : '✓';
          reviewBtn.addEventListener('click', () => this.toggleReviewed(note));
          actions.appendChild(reviewBtn);

          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'note-delete';
          deleteBtn.title = this.deleteEnabled ? 'Eliminar nota' : 'Activa el modo de eliminación para borrar';
          deleteBtn.textContent = '🗑️';
          deleteBtn.disabled = !this.deleteEnabled;
          deleteBtn.tabIndex = this.deleteEnabled ? 0 : -1;
          deleteBtn.setAttribute('aria-hidden', this.deleteEnabled ? 'false' : 'true');
          deleteBtn.addEventListener('click', () => {
            if (!this.deleteEnabled) return;
            this.deleteNote(note);
          });
          actions.appendChild(deleteBtn);

          footer.appendChild(actions);
          item.appendChild(footer);

          return item;
        }

        highlightSearch(content) {
          if (!this.filters.search) {
            return content;
          }
          const search = this.filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(${search})`, 'gi');
          return (content || '').replace(regex, '<mark>$1</mark>');
        }

        goToNote(note) {
          this.close();
          const element = note.element;
          if (element) {
            bringNoteToFront(element);
            element.classList.add('pulse-highlight');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => element.classList.remove('pulse-highlight'), 1600);
          } else if (note.topicId) {
            const page = findPageByTopicId(note.topicId);
            if (page) {
              scrollPageIntoViewWithOffset(page);
            }
          }
        }

        toggleReviewed(note) {
          const element = note.element;
          if (element) {
            toggleNoteReviewed(element);
          } else {
            const updated = updateNoteData(note.id, {
              reviewed: !note.reviewed,
              reviewCount: !note.reviewed ? (Number(note.reviewCount) || 0) + 1 : note.reviewCount,
              lastReviewed: !note.reviewed ? new Date().toISOString() : null
            });
            notesRegistry.set(note.id, updated, { silent: true });
          }
          this.render();
        }

        deleteNote(note) {
          if (!note || !this.deleteEnabled) return;
          if (!confirm('¿Eliminar esta nota?')) {
            return;
          }
          const element = note.element;
          if (element) {
            deleteFloatingNote(element);
          } else {
            removeNoteAnchor(note.id);
            removeNoteData(note.id);
            scheduleNotesViewRefresh();
          }
          this.render();
        }

        clearReviewed() {
          notesRegistry.forEach((note, noteId) => {
            if (note.reviewed) {
              const element = note.element;
              if (element) {
                toggleNoteReviewed(element, false);
              } else {
                const updated = updateNoteData(noteId, { reviewed: false }, { silent: true });
                notesRegistry.set(noteId, updated, { silent: true });
              }
            }
          });
          scheduleNotesViewRefresh();
          this.render();
        }

        notesToMarkdown(notes) {
          let md = `# Mis Notas\n\n`;
          md += `Exportado: ${new Date().toLocaleString()}\n\n`;
          md += `Total de notas: ${notes.length}\n\n---\n\n`;
          const grouped = this.groupNotesBySection(notes);
          grouped.forEach(group => {
            md += `## ${group.title || 'Sin sección'}\n\n`;
            group.notes.forEach(note => {
              const category = getNoteCategoryInfo(note.category);
              const displayTitle = getNoteDisplayTitle(note.title, '');
              const titleLine = displayTitle ? `${category.icon} ${displayTitle}` : category.icon;
              md += `### ${titleLine}\n\n`;
              md += `**Tema:** ${this.getTopicTitle(note.topicId) || 'Sin tema'}\n\n`;
              md += `${getNotePlainTextFromHtml(note.html || note.content || '')}\n\n`;
              if (note.tags && note.tags.length) {
                md += `*Tags:* ${note.tags.map(tag => `#${tag}`).join(', ')}\n\n`;
              }
              md += `---\n\n`;
            });
          });
          return md;
        }

        printNotes() {
          const notes = this.getFilteredNotes();
          const printWindow = window.open('', '_blank');
          if (!printWindow) return;
          const styles = document.querySelector('link[rel="stylesheet"]');
          const styleHref = styles ? styles.href : '';
          const content = notes.map(note => {
            const category = getNoteCategoryInfo(note.category);
            const displayTitle = getNoteDisplayTitle(note.title, '');
            const heading = displayTitle ? `${category.icon} ${displayTitle}` : category.icon;
            const tags = (note.tags || []).map(tag => `#${tag}`).join(', ');
            return `<article><h3>${heading}</h3><p><strong>${this.getTopicTitle(note.topicId) || 'Sin tema'}</strong></p><p>${note.html || note.content || ''}</p><p>${tags}</p></article>`;
          }).join('');
          printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Notas</title>${styleHref ? `<link rel="stylesheet" href="${styleHref}">` : ''}</head><body>${content}</body></html>`);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }

        getTopicTitle(topicId) {
          if (!topicId) return '';
          const page = findPageByTopicId(topicId);
          return getTopicTitle(page) || '';
        }

        getSectionTitle(sectionId) {
          if (!sectionId) return 'Sin sección';
          const section = sections.find(sec => sec.id === sectionId);
          return section?.nombre || 'Sin sección';
        }
      }

      notesViewController = new NotesViewController();

      function requestFloatingNotesViewportSync() {
        floatingNotesViewportRelaxedMatching = true;
        if (pendingFloatingNotesViewportSync) {
          return;
        }
        pendingFloatingNotesViewportSync = true;
        requestAnimationFrame(() => {
          pendingFloatingNotesViewportSync = false;
          clampAllFloatingNotes();
          scheduleFloatingNotesViewportRefresh();
        });
      }

      notesViewBtn?.addEventListener('click', () => {
        if (!notesViewController) return;
        closeTopicNotesPopover();
        if (notesViewController.isOpen()) {
          notesViewController.close();
        } else {
          notesViewController.open('all');
        }
      });

      window.addEventListener('pointermove', handleFloatingNotePointerMove);
      window.addEventListener('pointerup', (event) => {
        endFloatingNoteDrag(event);
        if (!floatingNoteResizeObserver && floatingNotesLayer) {
          floatingNotesLayer.querySelectorAll('.floating-note').forEach(updateFloatingNoteSizeDataset);
        }
      });
      window.addEventListener('pointercancel', endFloatingNoteDrag);
      window.addEventListener('resize', requestFloatingNotesViewportSync);
      if (window.visualViewport) {
        const handleVisualViewportChange = () => {
          requestFloatingNotesViewportSync();
        };
        window.visualViewport.addEventListener('resize', handleVisualViewportChange);
        window.visualViewport.addEventListener('scroll', handleVisualViewportChange);
      }
      window.addEventListener('scroll', () => {
        scheduleFloatingNotesViewportRefresh();
        if (isTopicNotesPopoverOpen()) {
          positionTopicNotesPopover(topicNotesAnchor);
        }
      }, { passive: true });

      refreshToggleNotesButton();

      addFloatingNoteBtn?.addEventListener('click', () => {
        if (!floatingNotesLayer) return;
        if (floatingNotesHidden) {
          setFloatingNotesVisibility(false);
        }
        const note = createFloatingNote({ focus: true });
        if (note && isEditMode) {
          enableHtmlPaste();
        }
      });

      toggleNotesBtn?.addEventListener('click', () => {
        setFloatingNotesVisibility(!floatingNotesHidden);
      });

      imageWidthIncreaseBtn?.addEventListener('click', () => {
        changeSelectedImageWidth(1 + IMAGE_RESIZE_STEP);
      });

      imageWidthDecreaseBtn?.addEventListener('click', () => {
        changeSelectedImageWidth(1 - IMAGE_RESIZE_STEP);
      });

      templateBgColorInput?.addEventListener('input', (e) => {
        applyTemplateBackground(e.target.value || '#ffffff');
      });

      templateClearBgBtn?.addEventListener('click', () => {
        applyTemplateBackground('transparent');
      });

      templateTextColorInput?.addEventListener('input', (e) => {
        applyTemplateTextColor(e.target.value || '#212529');
      });

      templateResetTextColorBtn?.addEventListener('click', () => {
        applyTemplateTextColor('');
      });

      templateBorderColorInput?.addEventListener('input', (e) => {
        applyTemplateBorderColor(e.target.value || '#ced4da');
      });

      templateAccentColorInput?.addEventListener('input', (e) => {
        applyTemplateAccentColor(e.target.value || '#0d6efd');
      });

      templateBorderWidthSlider?.addEventListener('input', (e) => {
        if (!selectedTemplateBlock) return;
        const target = getTemplateTarget(selectedTemplateBlock);
        if (!target || !target.classList.contains('box')) return;
        const width = parseInt(e.target.value, 10) || 0;
        const accentExtra = parseInt(selectedTemplateBlock.dataset.borderAccentExtra || '0', 10) || 0;
        if (width <= 0) {
          target.style.borderWidth = '0';
          target.style.borderStyle = 'none';
          if (accentExtra > 0) {
            target.style.borderLeftStyle = 'solid';
            target.style.borderLeftWidth = accentExtra + 'px';
          } else {
            target.style.borderLeftWidth = '0';
          }
        } else {
          target.style.borderStyle = 'solid';
          target.style.borderWidth = width + 'px';
          target.style.borderLeftWidth = (width + Math.max(0, accentExtra)) + 'px';
        }
        if (templateBorderWidthDisplay) {
          templateBorderWidthDisplay.textContent = width + 'px';
        }
        updateBorderWidthDataset(selectedTemplateBlock, width, Math.max(0, accentExtra));
        markNoteStyleAsCustom(selectedTemplateBlock, target);
        if (templateNoteStyleSelect) {
          templateNoteStyleSelect.value = 'custom';
        }
      });

      templateFontSizeSlider?.addEventListener('input', (e) => {
        if (!selectedTemplateBlock) return;
        const size = parseInt(e.target.value, 10) || 100;
        selectedTemplateBlock.dataset.fontScale = String(size);
        selectedTemplateBlock.style.fontSize = size === 100 ? '' : size + '%';
        if (templateFontSizeDisplay) {
          templateFontSizeDisplay.textContent = size + '%';
        }
        repositionTemplateToolbar();
      });

      templateMarginTopSlider?.addEventListener('input', (e) => {
        if (!selectedTemplateBlock) return;
        const margin = parseInt(e.target.value, 10) || 0;
        selectedTemplateBlock.dataset.marginTop = String(margin);
        selectedTemplateBlock.style.marginTop = margin + 'px';
        if (templateMarginTopDisplay) {
          templateMarginTopDisplay.textContent = margin + 'px';
        }
        repositionTemplateToolbar();
      });

      templateMarginBottomSlider?.addEventListener('input', (e) => {
        if (!selectedTemplateBlock) return;
        const margin = parseInt(e.target.value, 10) || 0;
        selectedTemplateBlock.dataset.marginBottom = String(margin);
        selectedTemplateBlock.style.marginBottom = margin + 'px';
        if (templateMarginBottomDisplay) {
          templateMarginBottomDisplay.textContent = margin + 'px';
        }
        repositionTemplateToolbar();
      });

      templateNoteStyleSelect?.addEventListener('change', (event) => {
        if (!selectedTemplateBlock) return;
        const styleId = event.target.value;
        if (styleId === 'custom') {
          const target = getTemplateTarget(selectedTemplateBlock);
          if (target && target.classList.contains('box')) {
            markNoteStyleAsCustom(selectedTemplateBlock, target);
            updateTemplateToolbarState(selectedTemplateBlock);
          }
          return;
        }
        applyNoteStyle(selectedTemplateBlock, styleId);
      });

      templateAddSpaceTopBtn?.addEventListener('click', () => insertNoteSpacer('before'));
      templateAddSpaceBottomBtn?.addEventListener('click', () => insertNoteSpacer('after'));

      templateDeleteBtn?.addEventListener('click', () => {
        if (!selectedTemplateBlock) return;
        const block = selectedTemplateBlock;
        const range = document.createRange();
        range.setStartAfter(block);
        range.collapse(true);
        block.remove();
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        savedSelection = null;
        hideTemplateToolbar();
      });

      function applyFloatClass(targetClass) {
        if (!selectedImage) return;

        const container = getImageContainer(selectedImage);

        floatClasses.forEach(cls => {
          container.classList.remove(cls);
          if (container !== selectedImage) {
            selectedImage.classList.remove(cls);
          }
        });

        if (targetClass) {
          container.classList.add(targetClass);
        }

        setActiveAlignButton(targetClass || '');
        repositionImageToolbar();
      }

      alignButtons.left?.addEventListener('click', () => {
        applyFloatClass('float-left');
      });

      alignButtons.center?.addEventListener('click', () => {
        applyFloatClass('center-block');
      });

      alignButtons.right?.addEventListener('click', () => {
        applyFloatClass('float-right');
      });

      alignButtons.inline?.addEventListener('click', () => {
        applyFloatClass('inline-image');
      });

      applyAltBtn?.addEventListener('click', () => {
        if (!selectedImage || !imageAltInput) return;
        selectedImage.alt = imageAltInput.value.trim();
        selectedImage.setAttribute('alt', selectedImage.alt);
        imageAltInput.blur();
      });

      imageAltInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyAltBtn?.click();
        }
      });

      imageFrameToggle?.addEventListener('change', (e) => {
        if (!selectedImage) return;
        if (e.target.checked) {
          selectedImage.classList.add('image-frame');
        } else {
          selectedImage.classList.remove('image-frame');
        }
        repositionImageToolbar();
      });

      function wrapImageWithFigure() {
        if (!selectedImage || selectedImage.parentElement?.classList.contains('image-figure')) return;

        const container = getImageContainer(selectedImage);
        const existingFloat = floatClasses.find(cls => container.classList.contains(cls));

        const figure = document.createElement('figure');
        figure.classList.add('image-figure');

        if (existingFloat) {
          container.classList.remove(existingFloat);
          figure.classList.add(existingFloat);
        }

        const caption = document.createElement('figcaption');
        caption.contentEditable = 'true';
        caption.spellcheck = true;
        caption.textContent = 'Escribe una descripción';

        const parent = selectedImage.parentElement;
        parent?.insertBefore(figure, selectedImage);
        figure.appendChild(selectedImage);
        figure.appendChild(caption);

        caption.focus();

        if (wrapFigureBtn) wrapFigureBtn.disabled = true;
        if (unwrapFigureBtn) unwrapFigureBtn.disabled = false;

        updateToolbarState(selectedImage);
        updateToolbarPosition(selectedImage);
      }

      function unwrapImageFigure() {
        if (!selectedImage) return;
        const figure = selectedImage.parentElement;
        if (!figure || !figure.classList.contains('image-figure')) return;

        const existingFloat = floatClasses.find(cls => figure.classList.contains(cls));
        const parent = figure.parentElement;
        if (!parent) return;

        parent.insertBefore(selectedImage, figure);
        figure.remove();

        if (existingFloat) {
          selectedImage.classList.add(existingFloat);
        }

        if (wrapFigureBtn) wrapFigureBtn.disabled = false;
        if (unwrapFigureBtn) unwrapFigureBtn.disabled = true;

        updateToolbarState(selectedImage);
        updateToolbarPosition(selectedImage);
      }

      wrapFigureBtn?.addEventListener('click', wrapImageWithFigure);
      unwrapFigureBtn?.addEventListener('click', unwrapImageFigure);

      document.getElementById('deleteImageBtn')?.addEventListener('click', () => {
        if (selectedImage && confirm('¿Eliminar esta imagen?')) {
          selectedImage.remove();
          hideImageToolbar();
        }
      });

      /* === PALETAS DE COLOR MEJORADAS === */
      function updateHighlightPaletteActiveColor(palette, activeColor) {
        if (!palette) {
          return;
        }
        const normalized = normalizeColorValue(activeColor);
        palette.dataset.activeColor = normalized || '';
        const swatches = palette.querySelectorAll('.color-swatch[data-color]');
        swatches.forEach(btn => {
          const btnColor = normalizeColorValue(btn.dataset.color);
          btn.classList.toggle('active', !!normalized && btnColor === normalized);
        });
      }

      function isClearHighlightColor(color) {
        if (!color) {
          return true;
        }
        if (isTransparentColor(color)) {
          return true;
        }
        const normalized = normalizeColorValue(color);
        return normalized === '#ffffff';
      }

      function unwrapElementPreservingContent(element) {
        if (!element || !element.parentNode) {
          return;
        }
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }

      function sanitizeHighlightFragment(fragment) {
        if (!fragment) {
          return;
        }
        const toUnwrap = [];
        const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_ELEMENT, null);
        while (walker.nextNode()) {
          const el = walker.currentNode;
          if (!(el instanceof HTMLElement)) {
            continue;
          }
          if (el.style) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            if (el.style.length === 0) {
              el.removeAttribute('style');
            }
          }
          if (el.classList.contains('text-highlighted')) {
            el.classList.remove('text-highlighted');
          }
          if (el.tagName === 'SPAN' && el.attributes.length === 0) {
            toUnwrap.push(el);
          }
        }
        toUnwrap.forEach(node => unwrapElementPreservingContent(node));
      }

      function isHighlightElement(element) {
        if (!(element instanceof HTMLElement)) {
          return false;
        }
        if (element.classList && element.classList.contains('text-highlighted')) {
          return true;
        }
        if (element.tagName === 'MARK') {
          return true;
        }
        if (!element.style) {
          return false;
        }
        const bgColor = element.style.backgroundColor || '';
        const background = element.style.background || '';
        if (bgColor && !isTransparentColor(bgColor)) {
          return true;
        }
        if (background && !isTransparentColor(background)) {
          return true;
        }
        return false;
      }

      function stripHighlightFromElement(element) {
        if (!(element instanceof HTMLElement) || !element.isConnected) {
          return;
        }

        if (element.style) {
          if (element.style.backgroundColor) {
            element.style.removeProperty('background-color');
          }
          if (element.style.background) {
            element.style.removeProperty('background');
          }
          if (element.style.length === 0) {
            element.removeAttribute('style');
          }
        }

        if (element.classList && element.classList.contains('text-highlighted')) {
          element.classList.remove('text-highlighted');
        }

        if (element.tagName === 'MARK') {
          unwrapElementPreservingContent(element);
          return;
        }

        const tagName = element.tagName;
        if ((tagName === 'SPAN' || tagName === 'FONT') && element.attributes.length === 0) {
          unwrapElementPreservingContent(element);
        }
      }

      function rangeFullyContainsNode(range, node) {
        if (!range || !node) {
          return false;
        }
        const nodeRange = document.createRange();
        try {
          nodeRange.selectNodeContents(node);
        } catch (err) {
          return false;
        }
        return range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0
          && range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0;
      }

      function collectHighlightWrappersForRange(range) {
        if (!range) {
          return [];
        }

        const wrappers = new Set();
        const addAncestors = (node) => {
          let current = node;
          if (current && current.nodeType !== Node.ELEMENT_NODE) {
            current = current ? current.parentElement : null;
          }
          while (current && current !== document.body) {
            if (isHighlightElement(current) && rangeFullyContainsNode(range, current)) {
              wrappers.add(current);
            }
            current = current.parentElement;
          }
        };

        addAncestors(range.startContainer);
        addAncestors(range.endContainer);

        return Array.from(wrappers);
      }

      function clearHighlightFromRange(range) {
        if (!range || range.collapsed) {
          return false;
        }

        const workingRange = range.cloneRange();
        const wrappersToStrip = collectHighlightWrappersForRange(workingRange);

        const fragment = workingRange.extractContents();
        if (!fragment || fragment.childNodes.length === 0) {
          return false;
        }

        sanitizeHighlightFragment(fragment);
        const nodes = Array.from(fragment.childNodes);

        workingRange.insertNode(fragment);

        if (nodes.length > 0) {
          range.setStartBefore(nodes[0]);
          range.setEndAfter(nodes[nodes.length - 1]);
        }

        wrappersToStrip.forEach(stripHighlightFromElement);

        return true;
      }

      function activatePersistentHighlight(color) {
        if (!color) {
          return;
        }
        persistentHighlight.active = true;
        persistentHighlight.color = color;
        if (highlightBtn) {
          highlightBtn.classList.add('active');
        }
      }

      function deactivatePersistentHighlight() {
        persistentHighlight.active = false;
        persistentHighlight.color = '';
        if (highlightBtn) {
          highlightBtn.classList.remove('active');
        }
      }

      function isTransparentColor(value) {
        if (!value) {
          return true;
        }
        const normalized = value.trim().toLowerCase();
        return normalized === 'transparent'
          || normalized === 'rgba(0, 0, 0, 0)'
          || normalized === 'rgba(0,0,0,0)'
          || normalized === 'inherit';
      }

      function isRangeWithinEditable(range) {
        if (!range) {
          return false;
        }
        const startEditable = resolveEditableAncestor(range.startContainer);
        const endEditable = resolveEditableAncestor(range.endContainer);
        return !!startEditable && !!endEditable;
      }

      function applyPersistentHighlightIfNeeded() {
        if (!persistentHighlight.active || !persistentHighlight.color || suppressPersistentHighlight || !isEditMode) {
          return;
        }
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          return;
        }
        const range = selection.getRangeAt(0);
        if (!isRangeWithinEditable(range)) {
          return;
        }
        suppressPersistentHighlight = true;
        saveCurrentSelection();
        applyColor(persistentHighlight.color, true, { skipRestore: true, skipAlerts: true });
        suppressPersistentHighlight = false;
      }

      function schedulePersistentHighlight() {
        if (!persistentHighlight.active || suppressPersistentHighlight) {
          return;
        }
        if (persistentHighlightTimer) {
          clearTimeout(persistentHighlightTimer);
        }
        persistentHighlightTimer = setTimeout(() => {
          persistentHighlightTimer = null;
          applyPersistentHighlightIfNeeded();
        }, 35);
      }

      function createColorPalette(paletteId, colors, isHighlight) {
        const palette = document.getElementById(paletteId);
        if (!palette) return;

        palette.innerHTML = '';
        palette.dataset.mode = palette.dataset.mode || 'selection';

        const handleColorSelection = (color) => {
          const mode = palette.dataset.mode || 'selection';
          const isClear = isHighlight && isClearHighlightColor(color);
          if (isHighlight && (mode === 'persistent' || mode === 'persistent-change')) {
            if (isClear) {
              deactivatePersistentHighlight();
              updateHighlightPaletteActiveColor(palette, '');
            } else {
              activatePersistentHighlight(color);
              updateHighlightPaletteActiveColor(palette, color);
            }
          } else {
            applyColor(color, isHighlight, { skipAlerts: mode === 'persistent' });
            if (isHighlight) {
              updateHighlightPaletteActiveColor(palette, isClear ? '' : color);
            }
          }
          palette.classList.remove('show');
        };

        if (isHighlight) {
          const stopBtn = document.createElement('button');
          stopBtn.type = 'button';
          stopBtn.className = 'color-swatch color-swatch-stop';
          stopBtn.title = 'Detener resaltado continuo';
          stopBtn.textContent = '✖';
          stopBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            deactivatePersistentHighlight();
            updateHighlightPaletteActiveColor(palette, '');
            palette.classList.remove('show');
          });
          palette.appendChild(stopBtn);
        }

        colors.forEach(color => {
          const swatch = document.createElement('button');
          swatch.type = 'button';
          swatch.className = 'color-swatch';
          swatch.style.backgroundColor = color;
          swatch.dataset.color = color;
          const isClear = isHighlight && isClearHighlightColor(color);
          if (isClear) {
            swatch.classList.add('color-swatch-clear');
            swatch.title = 'Sin destacado';
          } else {
            swatch.title = color;
          }
          swatch.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
          });
          swatch.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleColorSelection(color);
          });
          palette.appendChild(swatch);
        });

        const customSwatch = document.createElement('input');
        customSwatch.type = 'color';
        customSwatch.className = 'color-swatch';
        customSwatch.title = 'Color personalizado';
        customSwatch.style.border = '2px dashed #495057';
        customSwatch.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
        });
        customSwatch.addEventListener('change', (e) => {
          e.stopPropagation();
          handleColorSelection(e.target.value);
        });
        palette.appendChild(customSwatch);
      }

      function supportsCommand(command) {
        if (typeof document.queryCommandSupported !== 'function') return true;
        try {
          return document.queryCommandSupported(command);
        } catch (e) {
          return false;
        }
      }

      function applyColor(color, isHighlight, options = {}) {
        const {
          skipRestore = false,
          skipAlerts = false,
          preserveSelection = false,
          selection: providedSelection = null
        } = options;

        let selection = providedSelection || window.getSelection();
        if (!skipRestore) {
          if (!restoreSelection()) {
            if (!skipAlerts) {
              alert('Por favor, selecciona el texto primero');
            }
            return false;
          }
          selection = window.getSelection();
        }

        if (!selection || selection.rangeCount === 0) {
          if (!skipAlerts) {
            alert('Por favor, selecciona el texto primero');
          }
          if (!skipRestore) {
            clearSavedSelection();
          }
          return false;
        }

        if (selection.isCollapsed) {
          if (!skipAlerts) {
            alert('Por favor, selecciona el texto primero');
          }
          if (!skipRestore) {
            clearSavedSelection();
          }
          return false;
        }

        const range = selection.getRangeAt(0);
        const applied = applyColorToRange(range, color, isHighlight);

        if (!preserveSelection) {
          selection.removeAllRanges();
        }

        clearSavedSelection();
        return applied;
      }

      function applyColorToRange(range, color, isHighlight) {
        if (!range || range.collapsed) {
          return false;
        }

        if (isHighlight && isClearHighlightColor(color)) {
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
          }
          const cleared = clearHighlightFromRange(range);
          if (selection && cleared) {
            const restoredRange = range.cloneRange();
            selection.addRange(restoredRange);
          }
          return cleared;
        }

        const selection = window.getSelection();
        const storedRanges = [];
        for (let i = 0; i < (selection ? selection.rangeCount : 0); i++) {
          storedRanges.push(selection.getRangeAt(i).cloneRange());
        }

        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const styleWithCss = supportsCommand('styleWithCSS');
        if (styleWithCss) {
          document.execCommand('styleWithCSS', false, true);
        }

        let command = 'foreColor';
        if (isHighlight) {
          if (supportsCommand('hiliteColor')) {
            command = 'hiliteColor';
          } else if (supportsCommand('backColor')) {
            command = 'backColor';
          } else {
            command = null;
          }
        }

        let applied = false;
        if (command) {
          try {
            applied = document.execCommand(command, false, color);
          } catch (err) {
            applied = false;
          }
        }

        if (styleWithCss) {
          document.execCommand('styleWithCSS', false, false);
        }

        if (selection) {
          selection.removeAllRanges();
          storedRanges.forEach(stored => selection.addRange(stored));
        }

        if (applied) {
          return true;
        }

        const wrapper = document.createElement('span');
        if (isHighlight) {
          wrapper.style.backgroundColor = color;
          wrapper.classList.add('text-highlighted');
        } else {
          wrapper.style.color = color;
        }

        try {
          range.surroundContents(wrapper);
        } catch (e) {
          const fragment = range.extractContents();
          wrapper.appendChild(fragment);
          range.insertNode(wrapper);
        }

        return true;
      }

      createColorPalette('highlightPalette', highlightColors, true);
      createColorPalette('textColorPalette', textColors, false);

      const handleColorButtonPointerDown = (event) => {
        if (event.pointerType !== 'mouse' || event.button === 0) {
          event.preventDefault();
          saveCurrentSelection();
        }
      };

      highlightBtn?.addEventListener('pointerdown', handleColorButtonPointerDown);
      textColorBtn?.addEventListener('pointerdown', handleColorButtonPointerDown);
      fontSizeIncreaseBtn?.addEventListener('pointerdown', handleColorButtonPointerDown);
      fontSizeDecreaseBtn?.addEventListener('pointerdown', handleColorButtonPointerDown);

      highlightBtn?.addEventListener('click', (e) => {
        e.stopPropagation();

        const selectionSaved = saveCurrentSelection();
        const selection = window.getSelection();
        const hasSelection = selectionSaved && selection && selection.rangeCount > 0 && !selection.isCollapsed;

        const btn = e.currentTarget;
        const btnRect = btn.getBoundingClientRect();

        textColorPalette.classList.remove('show');

        if (hasSelection) {
          highlightPalette.dataset.mode = 'selection';
          highlightPalette.style.left = btnRect.left + 'px';
          highlightPalette.style.top = (btnRect.bottom + 5) + 'px';
          updateHighlightPaletteActiveColor(highlightPalette, '');
          highlightPalette.classList.add('show');
          return;
        }

        if (persistentHighlight.active) {
          highlightPalette.dataset.mode = 'persistent-change';
          updateHighlightPaletteActiveColor(highlightPalette, persistentHighlight.color);
        } else {
          highlightPalette.dataset.mode = 'persistent';
          updateHighlightPaletteActiveColor(highlightPalette, '');
        }

        highlightPalette.style.left = btnRect.left + 'px';
        highlightPalette.style.top = (btnRect.bottom + 5) + 'px';
        highlightPalette.classList.add('show');
      });

      fontSizeIncreaseBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        adjustFontSizeProportionally('increase');
      });

      fontSizeDecreaseBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        adjustFontSizeProportionally('decrease');
      });

      document.addEventListener('mouseup', (event) => {
        if (!isEditMode) {
          return;
        }
        if (event.button !== 0) {
          return;
        }
        schedulePersistentHighlight();
      });

      document.addEventListener('keyup', (event) => {
        if (!isEditMode || !persistentHighlight.active) {
          return;
        }
        const key = typeof event.key === 'string' ? event.key : '';
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'End', 'Home', 'PageUp', 'PageDown'];
        const isSelectAll = key.toLowerCase() === 'a' && (event.ctrlKey || event.metaKey);
        if (keys.includes(key) || isSelectAll) {
          schedulePersistentHighlight();
        }
      });

      document.addEventListener('dblclick', (event) => {
        if (!isEditMode || !highlightPalette) {
          return;
        }
        const target = event.target;
        let highlightElement = null;
        if (target instanceof HTMLElement) {
          highlightElement = target;
        } else if (target instanceof Node) {
          highlightElement = target.parentElement;
        }
        if (!highlightElement) {
          return;
        }

        let highlightColor = '';
        while (highlightElement && highlightElement !== document.body) {
          if (!(highlightElement instanceof HTMLElement)) {
            highlightElement = highlightElement.parentElement;
            continue;
          }
          const inlineBg = highlightElement.style ? highlightElement.style.backgroundColor : '';
          const hasInline = inlineBg && !isTransparentColor(inlineBg);
          const hasClass = highlightElement.classList && highlightElement.classList.contains('text-highlighted');
          const computedBg = window.getComputedStyle(highlightElement).backgroundColor;
          if ((hasInline || hasClass) && !isTransparentColor(computedBg)) {
            highlightColor = hasInline ? inlineBg : computedBg;
            break;
          }
          highlightElement = highlightElement.parentElement;
        }

        if (!highlightElement || highlightElement === document.body) {
          return;
        }

        if (!resolveEditableAncestor(highlightElement)) {
          return;
        }

        if (persistentHighlightTimer) {
          clearTimeout(persistentHighlightTimer);
          persistentHighlightTimer = null;
        }
        if (persistentHighlightResumeTimer) {
          clearTimeout(persistentHighlightResumeTimer);
          persistentHighlightResumeTimer = null;
        }
        suppressPersistentHighlight = true;
        persistentHighlightResumeTimer = setTimeout(() => {
          suppressPersistentHighlight = false;
          persistentHighlightResumeTimer = null;
        }, 200);

        const selection = window.getSelection();
        if (!selection) {
          return;
        }
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(highlightElement);
        selection.addRange(range);
        saveCurrentSelection();

        const rect = highlightElement.getBoundingClientRect();
        textColorPalette.classList.remove('show');
        highlightPalette.dataset.mode = 'selection';
        highlightPalette.style.left = rect.left + 'px';
        highlightPalette.style.top = (rect.bottom + 5) + 'px';
        updateHighlightPaletteActiveColor(highlightPalette, highlightColor);
        highlightPalette.classList.add('show');
      });

      textColorBtn?.addEventListener('click', (e) => {
        e.stopPropagation();

        if (!saveCurrentSelection()) {
          alert('Por favor, selecciona el texto al que deseas cambiar el color');
          return;
        }
        
        const btn = e.currentTarget;
        const btnRect = btn.getBoundingClientRect();
        
        textColorPalette.style.left = btnRect.left + 'px';
        textColorPalette.style.top = (btnRect.bottom + 5) + 'px';

        highlightPalette.classList.remove('show');
        textColorPalette.classList.add('show');
      });

      function copySelectedFormat() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return false;
        }

        const range = selection.getRangeAt(0);
        if (!range || range.collapsed) {
          return false;
        }

        let element = range.startContainer.nodeType === Node.TEXT_NODE
          ? range.startContainer.parentElement
          : range.startContainer;

        if (element && element.nodeType === Node.ELEMENT_NODE && !element.isContentEditable) {
          element = element.closest('[contenteditable="true"]');
        }

        if (!element) {
          return false;
        }

        const computed = window.getComputedStyle(element);
        copiedFormat = {
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          fontStyle: computed.fontStyle,
          textDecoration: computed.textDecoration,
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };

        const btn = document.getElementById('copyFormatBtn');
        if (btn) {
          btn.style.background = '#90ee90';
          setTimeout(() => {
            btn.style.background = '';
          }, 1000);
        }

        return true;
      }

      function applyCopiedFormat() {
        if (!copiedFormat) {
          alert('Primero copia un formato');
          return false;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return false;
        }

        const range = selection.getRangeAt(0);
        if (!range || range.collapsed) {
          return false;
        }

        const span = document.createElement('span');
        span.style.fontFamily = copiedFormat.fontFamily;
        span.style.fontSize = copiedFormat.fontSize;
        span.style.fontWeight = copiedFormat.fontWeight;
        span.style.fontStyle = copiedFormat.fontStyle;
        span.style.textDecoration = copiedFormat.textDecoration;
        span.style.color = copiedFormat.color;
        span.style.backgroundColor = copiedFormat.backgroundColor;

        try {
          range.surroundContents(span);
        } catch (error) {
          const fragment = range.extractContents();
          span.appendChild(fragment);
          range.insertNode(span);
        }

        const selectionRange = document.createRange();
        selectionRange.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(selectionRange);
        return true;
      }

      document.getElementById('copyFormatBtn')?.addEventListener('click', () => {
        copySelectedFormat();
      });

      document.getElementById('pasteFormatBtn')?.addEventListener('click', () => {
        applyCopiedFormat();
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#highlightBtn') && !e.target.closest('#highlightPalette')) {
          const wasOpen = highlightPalette.classList.contains('show');
          highlightPalette.classList.remove('show');
          if (wasOpen) {
            clearSavedSelection();
            highlightPalette.dataset.mode = persistentHighlight.active ? 'persistent-change' : 'selection';
            if (!persistentHighlight.active) {
              updateHighlightPaletteActiveColor(highlightPalette, '');
            }
          }
        }
        if (!e.target.closest('#textColorBtn') && !e.target.closest('#textColorPalette')) {
          const wasOpen = textColorPalette.classList.contains('show');
          textColorPalette.classList.remove('show');
          if (wasOpen) {
            clearSavedSelection();
          }
        }
      });

      /* === PLANTILLAS === */
      insertTemplateBtn?.addEventListener('pointerdown', (event) => {
        preventPointerFocusShift(event);
        saveCurrentSelection({ keepWhenEmpty: true });
        captureToolbarInsertionSnapshot();
      });

      insertTemplateBtn?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          saveCurrentSelection({ keepWhenEmpty: true });
          captureToolbarInsertionSnapshot();
        }
      });

      insertHtmlBtn?.addEventListener('pointerdown', (event) => {
        preventPointerFocusShift(event);
        saveCurrentSelection({ keepWhenEmpty: true });
        captureToolbarInsertionSnapshot();
      });

      insertHtmlBtn?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          saveCurrentSelection({ keepWhenEmpty: true });
          captureToolbarInsertionSnapshot();
        }
      });

      insertTableBtn?.addEventListener('pointerdown', (event) => {
        preventPointerFocusShift(event);
        saveCurrentSelection({ keepWhenEmpty: true });
        captureToolbarInsertionSnapshot();
      });

      insertTableBtn?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          saveCurrentSelection({ keepWhenEmpty: true });
          captureToolbarInsertionSnapshot();
        }
      });

      insertCollapseCardBtn?.addEventListener('pointerdown', (event) => {
        preventPointerFocusShift(event);
        saveCurrentSelection({ keepWhenEmpty: true });
        captureToolbarInsertionSnapshot();
      });

      insertCollapseCardBtn?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          saveCurrentSelection({ keepWhenEmpty: true });
          captureToolbarInsertionSnapshot();
        }
      });

      document.getElementById('insertTemplateBtn')?.addEventListener('click', () => {
        if (!savedSelection) {
          const activeEditable = document.activeElement && document.activeElement.isContentEditable ? document.activeElement : null;
          const target = activeEditable || getCurrentPage() || getCurrentMagicPage();
          if (target) {
            const range = document.createRange();
            range.selectNodeContents(target);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            saveCurrentSelection();
          }
        }

        showModal(`
          <div class="modal-header">
            <h3>Insertar Plantilla</h3>
            <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('show')">&times;</button>
          </div>
          <div class="modal-body">
            <p>Selecciona una plantilla para insertar en el documento:</p>
            <div class="template-grid" id="templateGrid"></div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn" onclick="document.getElementById('modalOverlay').classList.remove('show')">Cerrar</button>
          </div>
        `);

        const templates = [
          {
            name: 'Nota Importante',
            html: '<div class="box note-style-rose"><strong>Nota importante:</strong> Escribe tu contenido aquí.</div>',
            noteStyle: 'rose'
          },
          {
            name: 'Perla Clínica',
            html: '<div class="box note-style-pearl">Escribe tu perla clínica aquí.</div>',
            noteStyle: 'pearl'
          },
          {
            name: 'Cuadro Informativo',
            html: '<div class="box note-style-classic"><strong>Título:</strong><p>Contenido del cuadro informativo.</p></div>',
            noteStyle: 'classic'
          },
          {
            name: 'Separador Simple',
            html: '<hr style="border: none; border-top: 1px solid #dee2e6; margin: 10px 0;">'
          },
          {
            name: 'Separador Doble',
            html: '<hr style="border: none; border-top: 3px double #dee2e6; margin: 10px 0;">'
          },
          {
            name: 'Separador Punteado',
            html: '<hr style="border: none; border-top: 2px dashed #dee2e6; margin: 10px 0;">'
          },
          {
            name: 'Nota de Advertencia',
            html: '<div class="box note-style-sunrise"><strong>⚠️ Advertencia:</strong> Contenido importante de advertencia.</div>',
            noteStyle: 'sunrise'
          },
          {
            name: 'Nota de Éxito',
            html: '<div class="box note-style-forest"><strong>✓ Éxito:</strong> Información positiva o exitosa.</div>',
            noteStyle: 'forest'
          },
          {
            name: 'Lista de Verificación',
            html: '<ul><li>☐ Ítem 1</li><li>☐ Ítem 2</li><li>☐ Ítem 3</li></ul>'
          },
          {
            name: 'Dos Columnas',
            html: '<div class="columns"><div><h3>Columna 1</h3><p>Contenido de la primera columna.</p></div><div><h3>Columna 2</h3><p>Contenido de la segunda columna.</p></div></div>'
          },
          {
            name: 'Cita Destacada',
            html: '<blockquote style="border-left: 4px solid var(--theme-primary); padding-left: 15px; font-style: italic; color: #6c757d; margin: 10px 0;">"Tu cita aquí"</blockquote>'
          },
          {
            name: 'Definición',
            html: '<div class="box note-style-sky"><strong>Definición:</strong> Término a definir - explicación del término.</div>',
            noteStyle: 'sky'
          }
        ];

        const grid = document.getElementById('templateGrid');
        if (grid) {
          grid.innerHTML = '';
        }
        templates.forEach(template => {
          const card = document.createElement('div');
          card.className = 'template-card';
          card.innerHTML = `
            <h4>${template.name}</h4>
            <div class="template-preview">${template.html}</div>
          `;
          card.addEventListener('click', () => {
            const block = createTemplateBlock(template);
            if (!block) return;
            if (!primeToolbarInsertionSelection()) {
              alert('Selecciona un área editable antes de insertar una plantilla.');
              return;
            }
            const insertedBlock = insertNodeAtSelection(block);
            if (!insertedBlock) {
              alert('Selecciona un área editable antes de insertar una plantilla.');
              return;
            }

            showTemplateToolbar(insertedBlock);
            insertedBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            hideModal();
            clearToolbarInsertionSnapshot();
          });
          grid?.appendChild(card);
        });
      });

      insertCollapseCardBtn?.addEventListener('click', () => {
        if (!primeToolbarInsertionSelection()) {
          alert('Selecciona un área editable antes de insertar la tarjeta.');
          return;
        }
        const card = createCollapseCardElement();
        initializeCollapseCards(card);
        const insertedCard = insertNodeAtSelection(card);
        if (!insertedCard) {
          alert('Selecciona un área editable antes de insertar la tarjeta.');
          return;
        }
        const title = insertedCard.querySelector('.collapse-card-title');
        if (title) {
          const range = document.createRange();
          range.selectNodeContents(title);
          range.collapse(true);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
        insertedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        clearToolbarInsertionSnapshot();
      });

      /* === PANEL LATERAL === */
      function openPanel() {
        closeTopicNotesPopover();
        closeTopbarDropdowns();
        buildSectionsPanel();
        panel.classList.add('open');
        panelBackdrop.classList.add('show');
        if (panelSearchInput) {
          requestAnimationFrame(() => {
            panelSearchInput.focus();
            panelSearchInput.select();
          });
        }
      }

      function closePanel() {
        closeTopicNotesPopover();
        panel.classList.remove('open');
        panelBackdrop.classList.remove('show');
        closeTopbarDropdowns();
        hideTopicMenu();
      }

      const escapeAttr = (value) => {
        if (typeof value !== 'string') return '';
        if (window.CSS && typeof window.CSS.escape === 'function') {
          return window.CSS.escape(value);
        }
        return value.replace(/[^a-zA-Z0-9_\-]/g, (char) => `\\${char}`);
      };

      const normalizeForSearch = (value = '') =>
        value
          .toString()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

      function setPanelFilter(value) {
        panelFilterTerm = value ?? '';
        panelFilterNormalized = normalizeForSearch(panelFilterTerm);
        if (panelSearchClear) {
          panelSearchClear.hidden = !panelFilterNormalized;
        }
        if (panelSearchInput) {
          panelSearchInput.classList.toggle('has-value', Boolean(panelFilterNormalized));
        }
        buildSectionsPanel();
      }

      function magicAnchorFor(page) {
        if (!page) return '';

        const storedAnchor = page.dataset.magicAnchorId?.trim();
        if (storedAnchor) {
          const storedEl = document.getElementById(storedAnchor);
          if (storedEl) {
            if (storedEl.classList.contains('magic-topic')) {
              const tid = (page.dataset.topicId || '').trim();
              if (tid) {
                storedEl.dataset.sourceTopicId = tid;
              }
            }
            return storedAnchor;
          }
          delete page.dataset.magicAnchorId;
        }

        const tid = (page.dataset.topicId || '').trim();
        if (!tid) {
          return '';
        }

        const candidates = [`magic-topic-${tid}`, `magic-${tid}`, tid];
        for (const candidate of candidates) {
          if (!candidate) continue;
          const el = document.getElementById(candidate);
          if (el) {
            if (el.classList.contains('magic-topic')) {
              el.dataset.sourceTopicId = tid;
            }
            page.dataset.magicAnchorId = candidate;
            return candidate;
          }
        }

        const container = document.querySelector('.magic-content-container');
        if (container) {
          const selector = `.magic-topic[data-source-topic-id="${escapeAttr(tid)}"]`;
          const el = container.querySelector(selector);
          if (el && el.id) {
            page.dataset.magicAnchorId = el.id;
            return el.id;
          }
        }

        return '';
      }

      function ensureMagicTopicSource(anchorId, pageRef) {
        let resolvedId = typeof anchorId === 'string' ? anchorId.trim() : '';
        let src = resolvedId ? document.getElementById(resolvedId) : null;

        if (src && !src.classList.contains('magic-topic')) {
          src = null;
        }

        if (!src && pageRef) {
          const container = document.querySelector('.magic-content-container');
          if (container) {
            const topicId = (pageRef.dataset.topicId || '').trim();
            let baseId = resolvedId || (topicId ? `magic-topic-${topicId}` : '');
            if (!baseId) {
              baseId = generateUniqueId('magic-topic');
            }
            let candidateId = baseId;
            while (candidateId && document.getElementById(candidateId)) {
              candidateId = `${baseId}-${Math.random().toString(36).slice(2, 6)}`;
            }
            src = document.createElement('div');
            src.id = candidateId;
            src.className = 'magic-topic';
            if (topicId) {
              src.dataset.sourceTopicId = topicId;
            }
            container.appendChild(src);
            pageRef.dataset.magicAnchorId = candidateId;
            resolvedId = candidateId;
          }
        }

        if (src && !src.id) {
          let baseId = resolvedId || generateUniqueId('magic-topic');
          let uniqueId = baseId;
          while (uniqueId && document.getElementById(uniqueId)) {
            uniqueId = `${baseId}-${Math.random().toString(36).slice(2, 6)}`;
          }
          src.id = uniqueId;
          resolvedId = uniqueId;
          if (pageRef) {
            pageRef.dataset.magicAnchorId = uniqueId;
          }
        }

        return { source: src, anchorId: resolvedId };
      }

      function persistMagicEdits() {
        if (!activeMagicWrapper && !activeMagicSource) {
          return;
        }

        if (activeMagicWrapper && !document.contains(activeMagicWrapper)) {
          activeMagicWrapper = null;
        }

        if (!activeMagicSource && activeMagicWrapper && activeMagicPage) {
          const { source } = ensureMagicTopicSource('', activeMagicPage);
          activeMagicSource = source || null;
        }

        if (activeMagicSource && !document.contains(activeMagicSource)) {
          activeMagicSource = null;
        }

        if (!activeMagicSource || !activeMagicWrapper) {
          return;
        }

        activeMagicSource.innerHTML = activeMagicWrapper.innerHTML;
        afterContentSanitize(activeMagicSource);
      }

      function setMagicFloatingBackVisibility(visible, disabled = false) {
        if (!magicBackFloating) return;
        if (visible) {
          magicBackFloating.classList.add('visible');
          magicBackFloating.removeAttribute('aria-hidden');
          magicBackFloating.disabled = !!disabled;
        } else {
          magicBackFloating.classList.remove('visible');
          magicBackFloating.setAttribute('aria-hidden', 'true');
          magicBackFloating.disabled = false;
        }
      }

      function returnFromMagicView() {
        const targetPage = activeMagicPage;
        closeMagicView();
        if (targetPage && document.contains(targetPage)) {
          scrollPageIntoViewWithOffset(targetPage);
          targetPage.classList.add('pulse-highlight');
          setTimeout(() => targetPage.classList.remove('pulse-highlight'), 1600);
        }
      }

      function closeMagicView() {
        persistMagicEdits();
        if (isMagicViewActive) {
          const restoreZoom = zoomBeforeMagic ?? lastRegularZoom ?? 1;
          isMagicViewActive = false;
          zoomBeforeMagic = null;
          applyZoom(restoreZoom);
        }
        document.body.classList.remove('magic-open');
        if (!magic) return;
        magic.classList.remove('open');
        magic.style.removeProperty('--magic-zoom');
        zoomBeforeMagic = null;
        activeMagicSource = null;
        activeMagicWrapper = null;
        activeMagicPage = null;
        setMagicFloatingBackVisibility(false);
      }

      function activateMagicTopic(anchorId, title, pageRef = null) {
        if (!magic) return;
        persistMagicEdits();
        if (!isMagicViewActive) {
          zoomBeforeMagic = currentZoom;
        }
        isMagicViewActive = true;
        applyZoom(1, { skipRemember: true });
        magic.innerHTML = '';
        const magicPage = document.createElement('div');
        magicPage.className = 'magic-page';

        const h = document.createElement('h1');
        h.className = 'magic-title';
        h.textContent = title || 'Tema';
        magicPage.appendChild(h);

        const { source: src } = ensureMagicTopicSource(anchorId, pageRef);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = src ? src.innerHTML : '<p>No hay contenido adicional.</p>';
        afterContentSanitize(wrapper);

        magicPage.appendChild(wrapper);
        magic.appendChild(magicPage);
        activeMagicSource = src;
        activeMagicWrapper = wrapper;
        activeMagicPage = pageRef || null;
        setMagicFloatingBackVisibility(true);

        if (isEditMode) {
          magicPage.contentEditable = 'true';
          enableHtmlPaste();
        }

        syncMagicZoom();
        magic.classList.add('open');
        magic.scrollTop = 0;
        document.body.classList.add('magic-open');
      }

      function buildSectionsPanel() {
        if (!sectionsContainer) return;
        sectionsContainer.innerHTML = '';
        globalTopicCounter = 1;
        let totalTopics = 0;
        let renderedTopics = 0;
        let matchedTopics = 0;
        let renderedSections = 0;
        const hasFilter = Boolean(panelFilterNormalized);
        const topicNoteCounts = collectTopicNoteCounts();

        sections.forEach((section) => {
          totalTopics += section.temas.length;

          const sectionMatch = hasFilter && normalizeForSearch(section.nombre || '').includes(panelFilterNormalized);
          const topicMatches = hasFilter
            ? section.temas.filter((tema) => normalizeForSearch(tema.titulo || '').includes(panelFilterNormalized))
            : section.temas;

          if (hasFilter && !sectionMatch && topicMatches.length === 0) {
            return;
          }

          renderedSections++;

          const sectionDiv = document.createElement('div');
          sectionDiv.className = 'section-item';
          sectionDiv.dataset.sectionId = section.id || '';
          if (section.collapsed) sectionDiv.classList.add('collapsed');
          if (sectionMatch) sectionDiv.classList.add('matches-filter');

          const sectionHeader = document.createElement('div');
          sectionHeader.className = 'section-header';

          const toggle = document.createElement('span');
          toggle.className = 'section-toggle';
          toggle.textContent = '▼';
          toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            section.collapsed = !section.collapsed;
            sectionDiv.classList.toggle('collapsed');
          });

          const nameSpan = document.createElement('span');
          nameSpan.className = 'section-name';
          nameSpan.textContent = section.nombre;

          const focusSection = () => {
            if (section.collapsed) {
              section.collapsed = false;
              sectionDiv.classList.remove('collapsed');
            }
            const firstTopic = section.temas.find((tema) => tema?.page && tema.page.isConnected);
            closeMagicView();
            closePanel();
            if (firstTopic?.page) {
              setActivePage(firstTopic.page);
              scrollPageIntoViewWithOffset(firstTopic.page, 'auto');
            } else {
              setVisibleSection(section.id, { force: true });
            }
          };

          nameSpan.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            focusSection();
          });

          const countSpan = document.createElement('span');
          countSpan.className = 'section-count';
          countSpan.textContent = `(${section.temas.length})`;

          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'section-actions';

          const addTopicBtn = document.createElement('button');
          addTopicBtn.className = 'section-action-btn';
          addTopicBtn.textContent = '➕';
          addTopicBtn.title = 'Nuevo tema';
          addTopicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            promptCreateTopicInSection(section);
          });

          const printBtn = document.createElement('button');
          printBtn.className = 'section-action-btn';
          printBtn.textContent = '🖨️';
          printBtn.title = 'Imprimir sección';
          printBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            printSection(section);
          });

          actionsDiv.appendChild(addTopicBtn);
          if (isPanelEditMode) {
            const renameBtn = document.createElement('button');
            renameBtn.className = 'section-action-btn';
            renameBtn.textContent = '✏️';
            renameBtn.title = 'Renombrar';
            renameBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              renameSection(section);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'section-action-btn';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Eliminar sección';
            deleteBtn.style.color = '#dc3545';
            deleteBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              deleteSection(section);
            });

            actionsDiv.appendChild(renameBtn);
            actionsDiv.appendChild(deleteBtn);
          }

          actionsDiv.appendChild(printBtn);

          sectionHeader.appendChild(toggle);
          sectionHeader.appendChild(nameSpan);
          sectionHeader.appendChild(countSpan);
          sectionHeader.appendChild(actionsDiv);

          const topicList = document.createElement('ol');
          topicList.className = 'topic-list';
          const topicsToRender = hasFilter && !sectionMatch ? topicMatches : section.temas;
          renderedTopics += topicsToRender.length;
          if (hasFilter) {
            matchedTopics += topicMatches.length;
          }

          topicsToRender.forEach((tema) => {
            const li = document.createElement('li');
            const topicIdValue = (tema.id || '').trim();
            li.dataset.topicId = topicIdValue;

            const numSpan = document.createElement('span');
            numSpan.className = 'topic-number';
            numSpan.textContent = `${globalTopicCounter}.`;
            globalTopicCounter++;

            const btnMain = document.createElement('button');
            btnMain.className = 'topic-action';
            btnMain.title = 'Ir al tema';
            btnMain.textContent = '📄';
            const openTopic = () => {
              if (!tema.page || !tema.page.isConnected) return;
              closeMagicView();
              closePanel();
              setActivePage(tema.page);
              scrollPageIntoViewWithOffset(tema.page, 'auto');
            };

            btnMain.addEventListener('click', openTopic);

            const titleSpan = document.createElement('span');
            titleSpan.className = 'topic-title';
            titleSpan.textContent = tema.titulo;
            titleSpan.title = 'Doble clic para opciones del tema';
            titleSpan.addEventListener('dblclick', (event) => {
              event.preventDefault();
              event.stopPropagation();
              showTopicMenu(event, tema);
            });
            titleSpan.addEventListener('click', (event) => {
              event.preventDefault();
              event.stopPropagation();
              openTopic();
            });

            const noteIndicator = document.createElement('span');
            noteIndicator.className = 'topic-note-indicator';
            noteIndicator.textContent = '📝';
            const topicNoteCount = topicNoteCounts.get(topicIdValue) || 0;
            noteIndicator.hidden = topicNoteCount === 0;
            noteIndicator.dataset.count = String(topicNoteCount);
            noteIndicator.setAttribute('aria-hidden', topicNoteCount > 0 ? 'false' : 'true');
            noteIndicator.title = topicNoteCount === 0
              ? 'Sin notas en este tema'
              : `${topicNoteCount === 1 ? '1 nota' : `${topicNoteCount} notas`} en este tema`;
            li.classList.toggle('has-notes', topicNoteCount > 0);

            const trailing = document.createElement('div');
            trailing.className = 'topic-trailing';
            trailing.appendChild(noteIndicator);

            if (isPanelEditMode) {
              const editActions = document.createElement('div');
              editActions.className = 'topic-edit-actions';

              const createTopicBtn = document.createElement('button');
              createTopicBtn.type = 'button';
              createTopicBtn.className = 'topic-edit-btn';
              createTopicBtn.textContent = '➕';
              createTopicBtn.title = 'Nuevo tema en esta sección';
              createTopicBtn.setAttribute('aria-label', 'Nuevo tema en esta sección');
              createTopicBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                promptCreateTopicInSection(section);
              });

              const deleteTopicBtn = document.createElement('button');
              deleteTopicBtn.type = 'button';
              deleteTopicBtn.className = 'topic-edit-btn topic-edit-btn-danger';
              deleteTopicBtn.textContent = '🗑️';
              deleteTopicBtn.title = 'Eliminar tema';
              deleteTopicBtn.setAttribute('aria-label', 'Eliminar tema');
              deleteTopicBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteTopicPage(tema.page || null);
              });

              editActions.appendChild(createTopicBtn);
              editActions.appendChild(deleteTopicBtn);
              trailing.appendChild(editActions);
            }

            if (hasFilter) {
              const topicMatchesFilter = normalizeForSearch(tema.titulo || '').includes(panelFilterNormalized);
              li.classList.toggle('matches-filter', topicMatchesFilter);
            }

            li.appendChild(numSpan);
            li.appendChild(btnMain);
            li.appendChild(titleSpan);
            li.appendChild(trailing);
            topicList.appendChild(li);
          });

          sectionDiv.appendChild(sectionHeader);
          sectionDiv.appendChild(topicList);
          sectionsContainer.appendChild(sectionDiv);
        });

        document.body.classList.toggle('panel-filter-active', hasFilter);

        if (renderedSections === 0) {
          const emptyState = document.createElement('div');
          emptyState.className = 'panel-empty';
          const term = escapeHtml(panelFilterTerm.trim());
          emptyState.innerHTML = term
            ? `<p>No encontramos coincidencias para <strong>“${term}”</strong>.</p>`
            : '<p>Aún no hay secciones creadas.</p>';
          if (hasFilter) {
            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'panel-empty-reset';
            clearBtn.textContent = 'Limpiar búsqueda';
            clearBtn.addEventListener('click', () => {
              if (panelSearchInput) {
                panelSearchInput.value = '';
              }
              setPanelFilter('');
              panelSearchInput?.focus();
            });
            emptyState.appendChild(clearBtn);
          }
          sectionsContainer.appendChild(emptyState);
        }

        if (panelTopicCount) {
          if (!hasFilter) {
            const label = totalTopics === 1 ? '1 tema' : `${totalTopics} temas`;
            panelTopicCount.textContent = label;
            panelTopicCount.title = '';
          } else {
            const visibleLabel = renderedTopics === 1 ? '1 tema' : `${renderedTopics} temas`;
            const totalLabel = totalTopics === 1 ? '1 tema total' : `${totalTopics} temas totales`;
            const matchesLabel = matchedTopics === 1 ? '1 coincidencia' : `${matchedTopics} coincidencias`;
            panelTopicCount.textContent = `${visibleLabel} · ${matchesLabel}`;
            panelTopicCount.title = `${visibleLabel} visibles de ${totalLabel}`;
          }
        }
        updateSectionsPanelActiveState();
        refreshTopicNoteIndicators();
        const activeTopicId = (currentPageRef && currentPageRef.dataset)
          ? currentPageRef.dataset.topicId || ''
          : '';
        setActiveTopicListHighlight(activeTopicId);
      }

      function togglePanelEditMode() {
        isPanelEditMode = !isPanelEditMode;
        document.body.classList.toggle('panel-edit-mode', isPanelEditMode);
        editPanelBtn.classList.toggle('active', isPanelEditMode);
        buildSectionsPanel();
      }

      function toggleAllSections() {
        allSectionsExpanded = !allSectionsExpanded;
        sections.forEach(s => s.collapsed = !allSectionsExpanded);
        buildSectionsPanel();
        const btn = document.getElementById('toggleAllBtn');
        btn.textContent = allSectionsExpanded ? '⊟' : '⊞';
      }

      function renameSection(section) {
        const newName = prompt('Nuevo nombre para la sección:', section.nombre);
        if (newName && newName.trim()) {
          section.nombre = newName.trim();
          section.temas.forEach(tema => {
            tema.page.dataset.sectionName = section.nombre;
          });
          if (currentSectionId === section.id) {
            updateSectionIndicator(currentPageRef);
          }
          buildSectionsPanel();
        }
      }

      function deleteSection(section) {
        if (!confirm(`¿Eliminar toda la sección "${section.nombre}" con ${section.temas.length} tema(s)?`)) return;

        section.temas.forEach(tema => {
          tema.page.remove();
        });

        pages = pages.filter(p => p.dataset.sectionId !== section.id);
        sections = sections.filter(s => s.id !== section.id);
        sectionThemes.delete(section.id);
        buildSectionsPanel();
        if (currentPageRef && !document.body.contains(currentPageRef)) {
          setActivePage(getCurrentPage());
        }
      }

      function clearAllContent() {
        if (!confirm('¿Eliminar todas las secciones, temas y contenido adicional? Esta acción no se puede deshacer.')) {
          return;
        }

        closeMagicView();
        hideTopicMenu();
        closePanel();
        io.disconnect();
        pages.forEach(page => page.remove());
        pages = [];
        sections = [];
        sectionThemes = new Map();
        allSectionsExpanded = true;
        globalTopicCounter = 1;
        currentPageRef = null;
        currentSectionId = '';
        savedSelection = null;
        const magicContainer = document.querySelector('.magic-content-container');
        if (magicContainer) {
          magicContainer.innerHTML = '';
        }
        clearFloatingNotes();
        setFloatingNotesVisibility(false);
        setFloatingNotesEditable(isEditMode);
        buildSectionsPanel();
        setActivePage(null);
        syncBodyTheme(DEFAULT_THEME);
        updateSectionIndicator(null);
      }

      function addNewSection() {
        const nombre = prompt('Nombre de la nueva sección:');
        if (!nombre || !nombre.trim()) return;

        const newSection = {
          id: 'seccion-' + Date.now(),
          nombre: nombre.trim(),
          collapsed: false,
          temas: []
        };

        sectionThemes.set(newSection.id, DEFAULT_THEME);
        sections.push(newSection);
        buildSectionsPanel();
      }

      function promptCreateTopicInSection(section) {
        if (!section) return;
        const defaultTitle = `Tema ${section.temas.length + 1}`;
        const response = window.prompt('Título del nuevo tema', defaultTitle);
        if (response === null) {
          return;
        }
        const finalTitle = response.trim() || defaultTitle;
        const page = createTopicPageForSection(section, finalTitle);
        if (page) {
          scrollPageIntoViewWithOffset(page);
        }
      }

      function createTopicPageForSection(section, title) {
        if (!section) return null;
        const newPage = document.createElement('section');
        newPage.className = 'page';
        const sectionId = section.id || 'seccion-' + Date.now();
        newPage.dataset.sectionId = sectionId;
        newPage.dataset.sectionName = section.nombre || '';
        const topicId = generateUniqueId('topic');
        newPage.dataset.topicId = topicId;
        const sectionTheme = sectionThemes.get(sectionId) || DEFAULT_THEME;
        applyThemeToPage(newPage, sectionTheme);
        newPage.contentEditable = isEditMode ? 'true' : 'false';

        const h1 = document.createElement('h1');
        const titleSpan = document.createElement('span');
        titleSpan.className = 'topic-title-text';
        titleSpan.textContent = title;
        h1.appendChild(titleSpan);
        const magicIcon = document.createElement('span');
        magicIcon.className = 'magic-icon';
        magicIcon.title = 'Ver contenido mágico';
        magicIcon.textContent = '✨';
        h1.appendChild(magicIcon);
        newPage.appendChild(h1);

        const placeholder = document.createElement('p');
        placeholder.innerHTML = '&nbsp;';
        newPage.appendChild(placeholder);

        const magicContainer = document.querySelector('.magic-content-container');
        if (magicContainer) {
          const magicId = `magic-topic-${topicId}`;
          const magicTopic = document.createElement('div');
          magicTopic.id = magicId;
          magicTopic.className = 'magic-topic';
          magicTopic.dataset.sourceTopicId = topicId;
          magicTopic.innerHTML = '<p>Contenido mágico del tema.</p>';
          magicContainer.appendChild(magicTopic);
          newPage.dataset.magicAnchorId = magicId;
        }

        let insertBefore = null;
        if (section.temas.length > 0) {
          const lastTopic = section.temas[section.temas.length - 1];
          if (lastTopic?.page?.parentNode) {
            insertBefore = lastTopic.page.nextSibling;
            lastTopic.page.parentNode.insertBefore(newPage, insertBefore);
          }
        }

        if (!newPage.isConnected) {
          const sectionIndex = sections.findIndex(s => s.id === section.id);
          let siblingPage = null;
          for (let idx = sectionIndex + 1; idx < sections.length; idx += 1) {
            const nextSection = sections[idx];
            const candidate = nextSection?.temas?.[0]?.page;
            if (candidate?.parentNode) {
              siblingPage = candidate;
              break;
            }
          }
          if (siblingPage?.parentNode) {
            siblingPage.parentNode.insertBefore(newPage, siblingPage);
          } else {
            const anchorParent = pages[pages.length - 1]?.parentNode || document.body;
            anchorParent.appendChild(newPage);
          }
        }

        pages = [...document.querySelectorAll('.page')];
        setupMagicIcons();
        if (io) {
          io.observe(newPage);
        }
        initializeSections();
        buildSectionsPanel();
        setActivePage(newPage);
        return newPage;
      }

      function sortSectionsAlpha() {
        sections.sort((a, b) => a.nombre.localeCompare(b.nombre));
        buildSectionsPanel();
      }

      function sortSectionsNumeric() {
        sections.sort((a, b) => {
          const numA = parseInt(a.nombre.match(/\d+/)?.[0] || '999');
          const numB = parseInt(b.nombre.match(/\d+/)?.[0] || '999');
          return numA - numB;
        });
        buildSectionsPanel();
      }

      function printSection(section) {
        if (!section || !Array.isArray(section.temas)) {
          window.print();
          return;
        }

        const pagesToPrint = section.temas
          .map(topic => topic?.page)
          .filter(page => page && page.isConnected);

        if (!pagesToPrint.length) {
          alert('No hay temas disponibles en esta sección para imprimir.');
          return;
        }

        pages.forEach(page => {
          if (pagesToPrint.includes(page)) {
            page.dataset.printTarget = 'true';
          } else {
            page.dataset.prevDisplay = page.style.display || '';
            page.style.display = 'none';
          }
        });

        document.body.dataset.printingSection = 'true';

        let cleaned = false;
        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;
          delete document.body.dataset.printingSection;
          pages.forEach(page => {
            if (page.dataset.printTarget) {
              delete page.dataset.printTarget;
            }
            if (page.dataset.prevDisplay !== undefined) {
              page.style.display = page.dataset.prevDisplay;
              delete page.dataset.prevDisplay;
            }
          });
          window.removeEventListener('afterprint', cleanup);
        };

        window.addEventListener('afterprint', cleanup);
        window.print();
        setTimeout(cleanup, 1200);
      }

      function printCurrentTopic() {
        const temporarilyShown = [];
        pages.forEach((page) => {
          if (page.classList.contains('page-hidden-by-section')) {
            temporarilyShown.push(page);
            page.classList.remove('page-hidden-by-section');
            page.dataset.prevSectionHidden = 'true';
            page.setAttribute('aria-hidden', 'false');
          }
        });

        const restoreSectionVisibility = () => {
          temporarilyShown.forEach((page) => {
            if (page.dataset.prevSectionHidden === 'true') {
              page.classList.add('page-hidden-by-section');
              page.setAttribute('aria-hidden', 'true');
              delete page.dataset.prevSectionHidden;
            }
          });
          ensureVisibleSection({ force: true });
          window.removeEventListener('afterprint', restoreSectionVisibility);
        };

        window.addEventListener('afterprint', restoreSectionVisibility);
        window.print();
        setTimeout(restoreSectionVisibility, 1200);
      }

      editPanelBtn?.addEventListener('click', togglePanelEditMode);
      document.getElementById('addSectionBtn')?.addEventListener('click', addNewSection);
      document.getElementById('toggleAllBtn')?.addEventListener('click', toggleAllSections);
      document.getElementById('sortAlphaBtn')?.addEventListener('click', sortSectionsAlpha);
      document.getElementById('sortNumBtn')?.addEventListener('click', sortSectionsNumeric);
      document.getElementById('printCurrentBtn')?.addEventListener('click', printCurrentTopic);
      panelSearchInput?.addEventListener('input', (event) => {
        setPanelFilter(event.target.value);
      });
      panelSearchInput?.addEventListener('search', (event) => {
        setPanelFilter(event.target.value);
      });
      panelSearchInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          panelSearchInput.value = '';
          setPanelFilter('');
          panelSearchInput.blur();
        }
      });
      if (panelSearchClear) {
        panelSearchClear.hidden = true;
        panelSearchClear.addEventListener('click', () => {
          if (panelSearchInput) {
            panelSearchInput.value = '';
            panelSearchInput.focus();
          }
          setPanelFilter('');
        });
      }
      clearAllBtn?.addEventListener('click', clearAllContent);

      const TOPIC_OBSERVER_THRESHOLDS = [0, 0.1, 0.25, 0.5, 0.75, 1];
      let pendingActiveTopicResolution = false;

      function scheduleActiveTopicResolution() {
        if (pendingActiveTopicResolution) {
          return;
        }
        pendingActiveTopicResolution = true;
        requestAnimationFrame(() => {
          pendingActiveTopicResolution = false;
          resolveActiveTopicFromViewport();
        });
      }

      function resolveActiveTopicFromViewport() {
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        if (viewportHeight <= 0) {
          return;
        }

        const viewportCenter = viewportHeight * 0.45;
        let centerCandidate = null;
        let centerDistance = Infinity;
        let fallbackCandidate = null;
        let fallbackRatio = 0;
        let fallbackDistance = Infinity;

        const current = currentPageRef && currentPageRef.isConnected ? currentPageRef : null;
        let currentRatio = 0;
        let currentDistance = Infinity;

        pages.forEach((page) => {
          if (!page || !page.isConnected) {
            return;
          }
          const rect = page.getBoundingClientRect();
          const height = rect.height || page.offsetHeight || 0;
          if (height <= 0) {
            return;
          }

          const visibleTop = Math.max(rect.top, 0);
          const visibleBottom = Math.min(rect.bottom, viewportHeight);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          if (visibleHeight <= 0) {
            return;
          }

          const ratio = Math.max(0, Math.min(1, visibleHeight / height));
          const pageCenter = rect.top + (height * 0.5);
          const distance = Math.abs(pageCenter - viewportCenter);
          const containsCenter = rect.top <= viewportCenter && rect.bottom >= viewportCenter;

          if (page === current) {
            currentRatio = ratio;
            currentDistance = distance;
          }

          if (containsCenter) {
            if (!centerCandidate || distance < centerDistance) {
              centerCandidate = page;
              centerDistance = distance;
            }
            return;
          }

          if (
            ratio > fallbackRatio + 0.02
            || (Math.abs(ratio - fallbackRatio) <= 0.02 && distance < fallbackDistance)
          ) {
            fallbackCandidate = page;
            fallbackRatio = ratio;
            fallbackDistance = distance;
          }
        });

        let candidate = centerCandidate || fallbackCandidate || current;
        if (!candidate) {
          setActiveTopicListHighlight('');
          return;
        }

        if (
          candidate !== current
          && current
          && currentRatio > 0
          && !centerCandidate
        ) {
          const ratioAdvantage = fallbackRatio - currentRatio;
          if (
            ratioAdvantage < 0.08
            || (Math.abs(ratioAdvantage) <= 0.08 && currentDistance <= fallbackDistance + 48)
          ) {
            candidate = current;
          }
        }

        const topicId = candidate.dataset.topicId || '';
        if (candidate !== currentPageRef) {
          setActivePage(candidate);
        } else {
          setActiveTopicListHighlight(topicId);
        }
      }

      const io = new IntersectionObserver((entries) => {
        if (!entries || entries.length === 0) {
          return;
        }
        scheduleActiveTopicResolution();
      }, {
        root: null,
        threshold: TOPIC_OBSERVER_THRESHOLDS,
        rootMargin: '-40px 0px -30% 0px'
      });

      pages.forEach(p => io.observe(p));
      scheduleActiveTopicResolution();
      window.addEventListener('resize', scheduleActiveTopicResolution);

      plusBtn?.addEventListener('click', () => {
        if (panel.classList.contains('open')) {
          closePanel();
        } else {
          openPanel();
        }
      });
      panelClose.forEach(btn => btn.addEventListener('click', () => {
        closePanel();
      }));
      panelBackdrop?.addEventListener('click', () => {
        closePanel();
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          closePanel();
          closeTopbarDropdowns();
          notesViewController?.close();
          closeTopicNotesPopover();
          hideModal();
          hideImageToolbar();
          hideTemplateToolbar();
          closeMagicView();
          closeImageCropModal();
          highlightPalette.classList.remove('show');
          textColorPalette.classList.remove('show');
          hideIconPicker();
          closeSpacingTool();
          setBoldInfiniteMode(false);
          deactivateTableAutoResize();
          savedSelection = null;
        }
      });

      document.addEventListener('pointerdown', (event) => {
        if (!isTopicNotesPopoverOpen()) return;
        if (topicNotesPopover.contains(event.target)) return;
        if (event.target.closest('.topic-note-icon')) return;
        closeTopicNotesPopover();
      });

      /* === TEMA DE COLORES === */
      themeSelect?.addEventListener('change', () => {
        const targetSection = currentSectionId || (getCurrentPage()?.dataset.sectionId) || 'seccion-default';
        setSectionTheme(targetSection, themeSelect.value);
      });

      /* === EDICIÓN === */
      function toggleEditMode() {
        if (isEditMode) {
          persistMagicEdits();
        }
        isEditMode = !isEditMode;
        hideTopicMenu();
        hideIconPicker();

        if (isEditMode) {
          pages.forEach(page => page.contentEditable = 'true');
          const magicPage = getCurrentMagicPage();
          if (magicPage) magicPage.contentEditable = 'true';
          setFloatingNotesEditable(true);
          editToolbar.classList.add('show');
          cachedToolbarHeight = editToolbar.getBoundingClientRect().height || editToolbar.offsetHeight || cachedToolbarHeight || 56;
          editBtn.classList.add('active');
          editBtn.textContent = '✏️';
          if (saveHtmlBtn) {
            saveHtmlBtn.style.display = 'inline-block';
          }
          enableHtmlPaste();
          tableMenuAPI?.refresh();
        } else {
          pages.forEach(page => page.contentEditable = 'false');
          const magicPages = document.querySelectorAll('.magic-page');
          magicPages.forEach(mp => mp.contentEditable = 'false');
          setFloatingNotesEditable(false);
          editToolbar.classList.remove('show');
          editBtn.classList.remove('active');
          editBtn.textContent = '✏️';
          if (saveHtmlBtn) {
            saveHtmlBtn.style.display = 'none';
          }
          hideTemplateToolbar();
          hideImageToolbar();
          tableMenuAPI?.cancelResize();
          tableMenuAPI?.hide();
          closeSpacingTool();
          setBoldInfiniteMode(false);
          deactivateTableAutoResize();
        }
      }
      
      function execCmd(command, value = null) {
        document.execCommand(command, false, value);
      }

      function captureIndentTargets() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return new Map();
        }

        const range = selection.getRangeAt(0);
        if (!range) {
          return new Map();
        }

        const seen = new Set();
        const targets = new Map();
        const intersects = typeof range.intersectsNode === 'function'
          ? (node) => range.intersectsNode(node)
          : (node) => {
              const nodeRange = document.createRange();
              nodeRange.selectNodeContents(node);
              const before = range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0;
              const after = range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0;
              return !(before || after);
            };

        const walker = document.createTreeWalker(
          range.commonAncestorContainer,
          NodeFilter.SHOW_ELEMENT,
          {
            acceptNode(node) {
              if (!(node instanceof HTMLElement)) {
                return NodeFilter.FILTER_SKIP;
              }
              if (!node.isContentEditable) {
                return NodeFilter.FILTER_SKIP;
              }
              if (!intersects(node)) {
                return NodeFilter.FILTER_SKIP;
              }
              if (node.closest('li, ul, ol')) {
                return NodeFilter.FILTER_SKIP;
              }
              const display = window.getComputedStyle(node).display;
              if (display === 'block' || display === 'flex' || display === 'grid' || display === 'table') {
                return NodeFilter.FILTER_ACCEPT;
              }
              return NodeFilter.FILTER_SKIP;
            }
          }
        );

        while (walker.nextNode()) {
          seen.add(walker.currentNode);
        }

        [range.startContainer, range.endContainer].forEach((node) => {
          let element = node instanceof HTMLElement ? node : node.parentElement;
          while (element && element instanceof HTMLElement && element.isContentEditable) {
            const display = window.getComputedStyle(element).display;
            if (display !== 'inline') {
              break;
            }
            element = element.parentElement;
          }
          if (element instanceof HTMLElement) {
            seen.add(element);
          }
        });

        seen.forEach((element) => {
          if (!(element instanceof HTMLElement)) {
            return;
          }
          if (!element.isContentEditable) {
            return;
          }
          if (element.closest('li, ul, ol')) {
            return;
          }
          const computed = window.getComputedStyle(element);
          const margin = parseFloat(element.style.marginLeft || computed.marginLeft || '0') || 0;
          targets.set(element, margin);
        });

        return targets;
      }

      function applyIndentSnapshot(targets, delta) {
        targets.forEach((previousMargin, element) => {
          if (!(element instanceof HTMLElement) || !element.isConnected) {
            return;
          }
          let newMargin = previousMargin + delta;
          if (newMargin <= 0) {
            element.style.marginLeft = '';
          } else {
            element.style.marginLeft = `${Math.round(newMargin)}px`;
          }
        });
      }

      function handleIndentCommand(command) {
        const targets = captureIndentTargets();
        execCmd(command);
        if (targets.size === 0) {
          return;
        }
        const delta = command === 'indent' ? 5 : -5;
        applyIndentSnapshot(targets, delta);
      }

      function clampToInputRange(value, input, fallback = 0) {
        const numeric = Number(value);
        if (!input || !Number.isFinite(numeric)) {
          return fallback;
        }
        const min = Number.isFinite(Number(input.min)) ? Number(input.min) : numeric;
        const max = Number.isFinite(Number(input.max)) ? Number(input.max) : numeric;
        return Math.min(Math.max(numeric, min), max);
      }

      function parsePxValue(value) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }

      function getLineHeightRatio(element) {
        if (!(element instanceof HTMLElement)) {
          return Number(spacingLineHeight?.value || 1.4);
        }
        const styles = window.getComputedStyle(element);
        const lineHeight = parsePxValue(styles.lineHeight);
        const fontSize = parsePxValue(styles.fontSize) || 16;
        if (!lineHeight || !fontSize) {
          return Number(spacingLineHeight?.value || 1.4);
        }
        const rawRatio = lineHeight / fontSize;
        const min = Number(spacingLineHeight?.min || 0.8);
        const max = Number(spacingLineHeight?.max || 3);
        return Math.min(Math.max(rawRatio, min), max);
      }

      function isBlockCandidate(element) {
        if (!(element instanceof HTMLElement)) {
          return false;
        }
        const display = window.getComputedStyle(element).display;
        return display !== 'inline' && display !== 'contents';
      }

      function findBlockAncestor(node) {
        let element = node instanceof HTMLElement ? node : node?.parentElement || null;
        while (element) {
          if (!element.isContentEditable) {
            const editableAncestor = resolveEditableAncestor(element);
            if (!editableAncestor) {
              return null;
            }
            if (!editableAncestor.contains(element)) {
              return null;
            }
            element = editableAncestor;
          }
          if (isBlockCandidate(element)) {
            return element;
          }
          element = element.parentElement;
        }
        return null;
      }

      function collectSpacingTargets() {
        const targets = new Set();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && isSelectionWithinEditable(selection)) {
          const range = selection.getRangeAt(0);
          const intersects = typeof range.intersectsNode === 'function'
            ? (node) => range.intersectsNode(node)
            : (node) => {
                const nodeRange = document.createRange();
                nodeRange.selectNodeContents(node);
                const before = range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0;
                const after = range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0;
                return !(before || after);
              };

          const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_ELEMENT,
            {
              acceptNode(node) {
                if (!(node instanceof HTMLElement)) {
                  return NodeFilter.FILTER_SKIP;
                }
                if (!node.isContentEditable) {
                  return NodeFilter.FILTER_SKIP;
                }
                if (!intersects(node)) {
                  return NodeFilter.FILTER_SKIP;
                }
                if (!isBlockCandidate(node)) {
                  return NodeFilter.FILTER_SKIP;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );

          while (walker.nextNode()) {
            targets.add(walker.currentNode);
          }

          if (range.collapsed) {
            const anchorBlock = findBlockAncestor(range.startContainer);
            if (anchorBlock) {
              targets.add(anchorBlock);
            }
          }
        }

        if (!targets.size) {
          const activeElement = document.activeElement && document.activeElement.isContentEditable
            ? document.activeElement
            : resolveEditableAncestor(document.activeElement);
          if (activeElement) {
            const fallback = findBlockAncestor(activeElement) || activeElement;
            if (fallback instanceof HTMLElement) {
              targets.add(fallback);
            }
          }
        }

        return Array.from(targets).filter((element) => element instanceof HTMLElement);
      }

      function initializeSpacingTargets(targets) {
        spacingToolState.targets = targets;
        spacingToolState.originalStyles = new Map();
        targets.forEach((target) => {
          if (!(target instanceof HTMLElement)) {
            return;
          }
          spacingToolState.originalStyles.set(target, {
            marginTop: target.style.marginTop,
            marginBottom: target.style.marginBottom,
            lineHeight: target.style.lineHeight
          });
        });
        syncSpacingInputsFromTargets();
      }

      function syncSpacingInputsFromTargets() {
        if (!spacingMarginTop || !spacingMarginBottom || !spacingBlockGap || !spacingLineHeight) {
          return;
        }

        if (!spacingToolState.targets.length) {
          spacingMarginTop.value = '0';
          spacingMarginBottom.value = '0';
          spacingBlockGap.value = '0';
          spacingLineHeight.value = Number(spacingLineHeight?.value || 1.4).toFixed(2);
          updateSpacingValueDisplay();
          return;
        }

        const first = spacingToolState.targets[0];
        const last = spacingToolState.targets[spacingToolState.targets.length - 1] || first;
        const firstStyles = window.getComputedStyle(first);
        const lastStyles = window.getComputedStyle(last);

        const marginTopValue = clampToInputRange(parsePxValue(firstStyles.marginTop), spacingMarginTop, 0);
        const gapValue = clampToInputRange(parsePxValue(firstStyles.marginBottom), spacingBlockGap, 0);
        const marginBottomValue = clampToInputRange(parsePxValue(lastStyles.marginBottom), spacingMarginBottom, gapValue);
        const lineHeightValue = clampToInputRange(getLineHeightRatio(first), spacingLineHeight, Number(spacingLineHeight?.value || 1.4));

        spacingMarginTop.value = String(Math.round(marginTopValue));
        spacingBlockGap.value = String(Math.round(gapValue));
        spacingMarginBottom.value = String(Math.round(marginBottomValue));
        spacingLineHeight.value = lineHeightValue.toFixed(2);
        updateSpacingValueDisplay();
      }

      function updateSpacingValueDisplay() {
        if (spacingMarginTopValue && spacingMarginTop) {
          spacingMarginTopValue.textContent = `${Math.round(Number(spacingMarginTop.value || 0))} px`;
        }
        if (spacingMarginBottomValue && spacingMarginBottom) {
          spacingMarginBottomValue.textContent = `${Math.round(Number(spacingMarginBottom.value || 0))} px`;
        }
        if (spacingBlockGapValue && spacingBlockGap) {
          spacingBlockGapValue.textContent = `${Math.round(Number(spacingBlockGap.value || 0))} px`;
        }
        if (spacingLineHeightValue && spacingLineHeight) {
          const ratio = Number.parseFloat(spacingLineHeight.value || '0') || 0;
          spacingLineHeightValue.textContent = ratio.toFixed(2);
        }
      }

      function applySpacingValue(type, value) {
        if (!spacingToolState.targets.length) {
          return;
        }
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
          return;
        }
        const pxValue = `${Math.round(numeric)}px`;

        if (type === 'marginTop') {
          spacingToolState.targets.forEach((target) => {
            if (!(target instanceof HTMLElement)) return;
            target.style.marginTop = numeric <= 0 ? '' : pxValue;
          });
          return;
        }

        if (type === 'marginBottom') {
          const lastIndex = spacingToolState.targets.length - 1;
          spacingToolState.targets.forEach((target, index) => {
            if (!(target instanceof HTMLElement)) return;
            if (spacingToolState.targets.length === 1 || index === lastIndex) {
              target.style.marginBottom = numeric <= 0 ? '' : pxValue;
            }
          });
          return;
        }

        if (type === 'blockGap') {
          const lastIndex = spacingToolState.targets.length - 1;
          spacingToolState.targets.forEach((target, index) => {
            if (!(target instanceof HTMLElement)) return;
            if (index === lastIndex) {
              return;
            }
            target.style.marginBottom = numeric <= 0 ? '' : pxValue;
          });
          return;
        }

        if (type === 'lineHeight') {
          const min = Number(spacingLineHeight?.min || 0.8);
          const max = Number(spacingLineHeight?.max || 3);
          const ratio = Math.min(Math.max(numeric, min), max);
          spacingToolState.targets.forEach((target) => {
            if (!(target instanceof HTMLElement)) return;
            target.style.lineHeight = ratio ? ratio.toFixed(2) : '';
          });
        }
      }

      function resetSpacingTargets() {
        spacingToolState.originalStyles.forEach((styles, element) => {
          if (!(element instanceof HTMLElement)) {
            return;
          }
          element.style.marginTop = styles.marginTop || '';
          element.style.marginBottom = styles.marginBottom || '';
          element.style.lineHeight = styles.lineHeight || '';
        });
        syncSpacingInputsFromTargets();
        updateSpacingValueDisplay();
      }

      function positionSpacingTool(anchor) {
        if (!spacingTool) {
          return;
        }
        const padding = 16;
        const anchorRect = anchor ? anchor.getBoundingClientRect() : null;
        const toolRect = spacingTool.getBoundingClientRect();
        let left = anchorRect ? anchorRect.left : (window.innerWidth - toolRect.width) / 2;
        let top = anchorRect ? anchorRect.bottom + 8 : 120;

        if (left + toolRect.width > window.innerWidth - padding) {
          left = window.innerWidth - toolRect.width - padding;
        }
        if (left < padding) {
          left = padding;
        }
        if (top + toolRect.height > window.innerHeight - padding) {
          top = Math.max(padding, (anchorRect ? anchorRect.top : padding) - toolRect.height - 8);
        }
        if (top < padding) {
          top = padding;
        }

        spacingTool.style.left = `${Math.round(left)}px`;
        spacingTool.style.top = `${Math.round(top)}px`;
      }

      function openSpacingTool() {
        if (!spacingTool || !spacingToolBtn) {
          return;
        }
        if (!isEditMode) {
          alert('Activa el modo edición para ajustar el espaciado.');
          return;
        }
        const targets = collectSpacingTargets();
        if (!targets.length) {
          alert('Selecciona un bloque editable para ajustar el espaciado.');
          return;
        }
        initializeSpacingTargets(targets);
        spacingTool.classList.add('show');
        spacingTool.setAttribute('aria-hidden', 'false');
        spacingTool.style.visibility = 'hidden';
        spacingToolState.isOpen = true;
        spacingToolBtn.classList.add('active');
        spacingToolBtn.setAttribute('aria-pressed', 'true');
        positionSpacingTool(spacingToolBtn);
        spacingTool.style.visibility = '';
        updateSpacingValueDisplay();
      }

      function closeSpacingTool() {
        if (!spacingToolState.isOpen) {
          return;
        }
        if (spacingToolSelectionSync && typeof spacingToolSelectionSync.cancel === 'function') {
          spacingToolSelectionSync.cancel();
        }
        spacingToolSelectionSync = null;
        spacingToolState.isOpen = false;
        spacingToolState.targets = [];
        spacingToolState.originalStyles.clear();
        if (spacingTool) {
          spacingTool.classList.remove('show');
          spacingTool.setAttribute('aria-hidden', 'true');
          spacingTool.style.visibility = '';
        }
        if (spacingToolBtn) {
          spacingToolBtn.classList.remove('active');
          spacingToolBtn.setAttribute('aria-pressed', 'false');
        }
      }

      function toggleSpacingTool() {
        if (spacingToolState.isOpen) {
          closeSpacingTool();
        } else {
          openSpacingTool();
        }
      }

      function scheduleSpacingToolSelectionRefresh() {
        if (!spacingToolState.isOpen) {
          return;
        }
        if (spacingToolSelectionSync) {
          return;
        }
        if (typeof requestAnimationFrame === 'function') {
          const rafId = requestAnimationFrame(() => {
            spacingToolSelectionSync = null;
            const targets = collectSpacingTargets();
            if (!targets.length) {
              return;
            }
            initializeSpacingTargets(targets);
          });
          spacingToolSelectionSync = {
            cancel() {
              cancelAnimationFrame(rafId);
            }
          };
        } else {
          const timeoutId = setTimeout(() => {
            spacingToolSelectionSync = null;
            const targets = collectSpacingTargets();
            if (!targets.length) {
              return;
            }
            initializeSpacingTargets(targets);
          }, 16);
          spacingToolSelectionSync = {
            cancel() {
              clearTimeout(timeoutId);
            }
          };
        }
      }

      function setBoldInfiniteMode(enabled) {
        const nextState = !!enabled && isEditMode;
        boldInfiniteMode = nextState;
        if (boldBtn) {
          boldBtn.classList.toggle('active', nextState);
          boldBtn.setAttribute('aria-pressed', nextState ? 'true' : 'false');
          boldBtn.title = nextState ? 'Salir de modo negrita infinita' : boldBtnDefaultTitle;
        }
        if (!nextState) {
          boldInfiniteApplying = false;
        }
      }

      function handleBoldButtonClick(event) {
        event.preventDefault();
        if (!boldBtn) {
          return;
        }
        const selection = window.getSelection();
        const hasSelection = selection && selection.rangeCount > 0 && !selection.isCollapsed && selection.toString().length > 0;

        if (boldInfiniteMode) {
          if (hasSelection) {
            execCmd('bold');
          }
          setBoldInfiniteMode(false);
          return;
        }

        if (hasSelection) {
          execCmd('bold');
          return;
        }

        setBoldInfiniteMode(true);
      }

      function handleSelectionChange() {
        if (boldInfiniteMode) {
          if (!isEditMode) {
            setBoldInfiniteMode(false);
          } else if (!boldInfiniteApplying) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && !selection.isCollapsed && isSelectionWithinEditable(selection)) {
              const content = selection.toString();
              if (content.trim().length) {
                boldInfiniteApplying = true;
                execCmd('bold');
                const release = () => { boldInfiniteApplying = false; };
                if (typeof requestAnimationFrame === 'function') {
                  requestAnimationFrame(release);
                } else {
                  setTimeout(release, 16);
                }
              }
            }
          }
        }
        scheduleSpacingToolSelectionRefresh();
      }

      function activateTableAutoResize(table) {
        if (!table || !(table instanceof HTMLTableElement)) {
          return;
        }
        if (!isEditMode) {
          return;
        }
        const editableAncestor = resolveEditableAncestor(table);
        if (!editableAncestor) {
          return;
        }
        if (autoTableResizeTable && autoTableResizeTable !== table) {
          deactivateTableAutoResize();
        }
        const controller = makeTableResizable(table);
        if (!controller) {
          return;
        }
        autoTableResizeTable = table;
        autoTableResizeController = controller;
        controller.activate({
          onFinish() {
            if (autoTableResizeTable === table) {
              autoTableResizeController = null;
              autoTableResizeTable = null;
            }
          },
          onCancel() {
            if (autoTableResizeTable === table) {
              autoTableResizeController = null;
              autoTableResizeTable = null;
            }
          }
        });
      }

      function deactivateTableAutoResize() {
        if (autoTableResizeController) {
          try {
            autoTableResizeController.cancel();
          } catch (error) {
            console.warn('No se pudo cancelar el ajuste de tabla automáticamente:', error);
          }
        }
        autoTableResizeController = null;
        autoTableResizeTable = null;
      }

      function handleTablePointerDown(event) {
        if (!isEditMode) {
          deactivateTableAutoResize();
          return;
        }
        if (!(event.target instanceof HTMLElement)) {
          return;
        }
        const table = event.target.closest('table');
        if (table && table.closest('[contenteditable="true"]')) {
          activateTableAutoResize(table);
        } else if (!event.target.closest('.table-wrap') && !event.target.closest('#tableMenu')) {
          deactivateTableAutoResize();
        }
      }

      function setMainContentVisibility(hidden) {
        mainContentHidden = !!hidden;
        document.body.classList.toggle('pages-hidden', mainContentHidden);
        if (toggleMainContentBtn) {
          toggleMainContentBtn.classList.toggle('active', mainContentHidden);
          toggleMainContentBtn.setAttribute('aria-pressed', mainContentHidden ? 'true' : 'false');
          toggleMainContentBtn.title = mainContentHidden ? 'Mostrar contenido principal' : 'Ocultar contenido principal';
          toggleMainContentBtn.textContent = mainContentHidden ? '📄' : '🗂️';
        }
        updateFloatingNotesPrintControl();
      }

      editBtn?.addEventListener('click', toggleEditMode);

      document.getElementById('undoBtn')?.addEventListener('click', () => execCmd('undo'));
      document.getElementById('redoBtn')?.addEventListener('click', () => execCmd('redo'));
      
      document.getElementById('fontSizeSelect')?.addEventListener('change', function() {
        if (this.value) {
          execCmd('fontSize', this.value);
          this.value = '';
        }
      });
      
      boldBtn?.addEventListener('click', handleBoldButtonClick);
      document.getElementById('italicBtn')?.addEventListener('click', () => execCmd('italic'));
      document.getElementById('underlineBtn')?.addEventListener('click', () => execCmd('underline'));
      document.getElementById('removeFormatBtn')?.addEventListener('click', () => execCmd('removeFormat'));
      document.getElementById('insertUlBtn')?.addEventListener('click', () => execCmd('insertUnorderedList'));
      document.getElementById('insertOlBtn')?.addEventListener('click', () => execCmd('insertOrderedList'));
      document.getElementById('indentBtn')?.addEventListener('click', () => handleIndentCommand('indent'));
      document.getElementById('outdentBtn')?.addEventListener('click', () => handleIndentCommand('outdent'));

      spacingToolBtn?.addEventListener('pointerdown', preventPointerFocusShift);
      spacingToolBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        toggleSpacingTool();
      });
      spacingToolClose?.addEventListener('click', () => closeSpacingTool());
      spacingToolDone?.addEventListener('click', () => closeSpacingTool());
      spacingToolReset?.addEventListener('click', () => {
        if (!spacingToolState.isOpen) {
          return;
        }
        resetSpacingTargets();
      });
      spacingMarginTop?.addEventListener('input', () => {
        if (!spacingToolState.isOpen) {
          return;
        }
        applySpacingValue('marginTop', spacingMarginTop.value);
        updateSpacingValueDisplay();
      });
      spacingMarginBottom?.addEventListener('input', () => {
        if (!spacingToolState.isOpen) {
          return;
        }
        applySpacingValue('marginBottom', spacingMarginBottom.value);
        updateSpacingValueDisplay();
      });
      spacingBlockGap?.addEventListener('input', () => {
        if (!spacingToolState.isOpen) {
          return;
        }
        applySpacingValue('blockGap', spacingBlockGap.value);
        updateSpacingValueDisplay();
      });
      spacingLineHeight?.addEventListener('input', () => {
        if (!spacingToolState.isOpen) {
          return;
        }
        applySpacingValue('lineHeight', spacingLineHeight.value);
        updateSpacingValueDisplay();
      });

      toggleMainContentBtn?.addEventListener('click', () => {
        setMainContentVisibility(!mainContentHidden);
      });

      printFloatingNotesViewBtn?.addEventListener('click', () => {
        printVisibleFloatingNotes();
      });

      document.addEventListener('pointerdown', (event) => {
        if (!spacingToolState.isOpen) {
          return;
        }
        if (spacingTool?.contains(event.target)) {
          return;
        }
        if (spacingToolBtn?.contains(event.target)) {
          return;
        }
        closeSpacingTool();
      });

      window.addEventListener('resize', () => {
        if (spacingToolState.isOpen) {
          positionSpacingTool(spacingToolBtn);
        }
      });

      document.addEventListener('selectionchange', handleSelectionChange);
      document.addEventListener('mousedown', handleTablePointerDown, true);

      setMainContentVisibility(mainContentHidden);
      setBoldInfiniteMode(false);

      bindIconPickerTrigger();
      scheduleIconPickerRebind();

      /* === INSERTAR HTML PERSONALIZADO === */
      document.getElementById('insertHtmlBtn')?.addEventListener('click', () => {
        showModal(`
          <div class="modal-header">
            <h3>Insertar HTML Personalizado</h3>
            <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('show')">&times;</button>
          </div>
          <div class="modal-body">
            <p>Escribe el código HTML que deseas insertar en la posición del cursor:</p>
            <textarea id="customHtmlInput" class="modal-textarea" placeholder="<div>Tu código HTML aquí...</div>"></textarea>
          </div>
          <div class="modal-footer">
            <button class="modal-btn" onclick="document.getElementById('modalOverlay').classList.remove('show')">Cancelar</button>
            <button class="modal-btn primary" id="insertCustomHtmlBtn">Insertar</button>
          </div>
        `);

        setTimeout(() => {
          document.getElementById('insertCustomHtmlBtn')?.addEventListener('click', () => {
            const htmlCode = document.getElementById('customHtmlInput').value;
            if (htmlCode.trim()) {
              if (!primeToolbarInsertionSelection()) {
                alert('Selecciona un área editable antes de insertar HTML.');
                return;
              }
              const insertedNode = insertHtmlAtSelection(htmlCode);
              if (insertedNode) {
                hideModal();
                clearToolbarInsertionSnapshot();
              } else {
                alert('Selecciona un área editable antes de insertar HTML.');
              }
            } else {
              alert('Por favor ingresa código HTML válido');
            }
          });
        }, 100);
      });

      /* === COPIAR HTML DE SELECCIÓN === */
      document.getElementById('copyHtmlSelectionBtn')?.addEventListener('click', async () => {
        const selection = window.getSelection();
        if (!selection.rangeCount) {
          alert('Primero selecciona el texto del que quieres copiar el HTML');
          return;
        }

        const range = selection.getRangeAt(0);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        const html = container.innerHTML;

        if (!html) {
          alert('No hay contenido HTML en la selección');
          return;
        }

        try {
          await navigator.clipboard.writeText(html);
          showModal(`
            <div class="modal-header">
              <h3>HTML Copiado</h3>
              <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('show')">&times;</button>
            </div>
            <div class="modal-body">
              <p>El código HTML ha sido copiado al portapapeles.</p>
              <textarea class="modal-textarea" readonly>${html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
            </div>
            <div class="modal-footer">
              <button class="modal-btn primary" onclick="document.getElementById('modalOverlay').classList.remove('show')">Cerrar</button>
            </div>
          `);
        } catch (e) {
          alert('Error al copiar: ' + e.message);
        }
      });

      /* === INSERTAR TABLA === */
      document.getElementById('insertTableBtn')?.addEventListener('click', () => {
        showModal(`
          <div class="modal-header">
            <h3>Insertar Tabla</h3>
            <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('show')">&times;</button>
          </div>
          <div class="modal-body">
            <label>Filas: <input type="number" id="tableRows" class="modal-input" value="3" min="1" max="20">
</label>
            <label>Columnas: <input type="number" id="tableCols" class="modal-input" value="3" min="1" max="10"></label>
          </div>
          <div class="modal-footer">
            <button class="modal-btn" onclick="document.getElementById('modalOverlay').classList.remove('show')">Cancelar</button>
            <button class="modal-btn primary" id="insertTableConfirm">Insertar</button>
          </div>
        `);
        setTimeout(() => {
          document.getElementById('insertTableConfirm')?.addEventListener('click', () => {
            const rows = parseInt(document.getElementById('tableRows').value) || 3;
            const cols = parseInt(document.getElementById('tableCols').value) || 3;

            let tableHTML = '<div class="table-wrap"><table><thead><tr>';
            for (let i = 0; i < cols; i++) {
              tableHTML += `<th>Encabezado ${i + 1}</th>`;
            }
            tableHTML += '</tr></thead><tbody>';

            for (let i = 0; i < rows; i++) {
              tableHTML += '<tr>';
              for (let j = 0; j < cols; j++) {
                tableHTML += '<td>Celda</td>';
              }
              tableHTML += '</tr>';
            }
            tableHTML += '</tbody></table></div>';

            if (!primeToolbarInsertionSelection()) {
              alert('Selecciona un área editable antes de insertar una tabla.');
              return;
            }

            const insertedNode = insertHtmlAtSelection(tableHTML);
            if (insertedNode) {
              hideModal();
              clearToolbarInsertionSnapshot();
            } else {
              alert('Selecciona un área editable antes de insertar una tabla.');
            }
          });
        }, 100);
      });

      /* === BUSCAR Y REEMPLAZAR === */
      document.getElementById('findReplaceBtn')?.addEventListener('click', () => {
        showModal(`
          <div class="modal-header">
            <h3>Buscar y Reemplazar</h3>
            <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('show')">&times;</button>
          </div>
          <div class="modal-body">
            <label>Buscar: <input type="text" id="findText" class="modal-input" placeholder="Texto a buscar"></label>
            <label>Reemplazar con: <input type="text" id="replaceText" class="modal-input" placeholder="Texto de reemplazo"></label>
            <p id="findReplaceStatus" style="margin-top: 10px; color: #6c757d;"></p>
          </div>
          <div class="modal-footer">
            <button class="modal-btn" onclick="document.getElementById('modalOverlay').classList.remove('show')">Cerrar</button>
            <button class="modal-btn primary" id="replaceAllBtn">Reemplazar Todo</button>
          </div>
        `);

          setTimeout(() => {
            document.getElementById('replaceAllBtn')?.addEventListener('click', () => {
              const findText = document.getElementById('findText').value;
              const replaceText = document.getElementById('replaceText').value;
              const status = document.getElementById('findReplaceStatus');

              if (!findText) {
                status.textContent = 'Por favor ingresa el texto a buscar';
                return;
              }

              let count = 0;
              const currentPage = getCurrentPage() || getCurrentMagicPage();
              if (currentPage) {
                const html = currentPage.innerHTML;
                const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                const newHtml = html.replace(regex, () => {
                  count++;
                  return replaceText;
                });
                currentPage.innerHTML = newHtml;
              }

              status.textContent = `Se reemplazaron ${count} coincidencia(s)`;
            });
          }, 100);
        });

  /* === EXPORTAR TEMA === */
  async function exportSingleTopic(page) {
    const h1 = page.querySelector('h1');
    const titleSpan = h1?.querySelector('span:first-child');
    const title = (titleSpan?.textContent || h1?.textContent || 'tema').trim();
    const magicId = magicAnchorFor(page);
    const magicContent = document.getElementById(magicId);
    
    const tempPage = page.cloneNode(true);
    tempPage.contentEditable = 'false';

    const currentTheme = document.body.className.split(' ').find(c => c.startsWith('theme-')) || 'theme-blue';

    const stylesheetText = await getStylesheetTextForExport();
    const inlineStyles = stylesheetText || '/* No se pudieron cargar estilos */';

    const htmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
${inlineStyles}
  </style>
</head>
<body class="${currentTheme}">
  ${magicContent ? '<div class="magic-content-container" style="display:none">' + magicContent.outerHTML + '</div>' : ''}
  ${tempPage.outerHTML}
</body>
</html>`;
    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.getElementById('exportTopicBtn')?.addEventListener('click', async () => {
    const currentPage = getCurrentPage();
    if (currentPage) {
      await exportSingleTopic(currentPage);
    }
  });

  /* === ESTADÍSTICAS === */
  statsBtn?.addEventListener('click', () => {
    const totalPages = pages.length;
    const totalWords = pages.reduce((sum, p) => sum + countWords(p.innerHTML), 0);
    const avgWords = Math.round(totalWords / totalPages);
    const minWords = Math.min(...pages.map(p => countWords(p.innerHTML)));
    const maxWords = Math.max(...pages.map(p => countWords(p.innerHTML)));

    showModal(`
      <div class="modal-header">
        <h3>Estadísticas del Documento</h3>
        <button class="modal-close" onclick="document.getElementById('modalOverlay').classList.remove('show')">&times;</button>
      </div>
      <div class="modal-body">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total de Temas</div>
            <div class="stat-value">${totalPages}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total de Palabras</div>
            <div class="stat-value">${totalWords.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Promedio por Tema</div>
            <div class="stat-value">${avgWords}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Mínimo</div>
            <div class="stat-value">${minWords}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Máximo</div>
            <div class="stat-value">${maxWords}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Secciones</div>
            <div class="stat-value">${sections.length}</div>
          </div>
        </div>
        <h4 style="margin-top: 20px;">Detalle por Tema:</h4>
        <div style="max-height: 300px; overflow-y: auto;">
          ${pages.map((p, i) => {
            const h1 = p.querySelector('h1');
            const titleSpan = h1?.querySelector('span:first-child');
            const title = (titleSpan?.textContent || h1?.textContent || `Tema ${i+1}`).trim();
            const words = countWords(p.innerHTML);
            const percentage = Math.round((words / totalWords) * 100);
            return `
              <div style="margin: 10px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                <strong>${title}</strong>: ${words} palabras (${percentage}%)
                <div style="background: #dee2e6; height: 4px; border-radius: 2px; margin-top: 4px;">
                  <div style="background: var(--theme-primary); height: 100%; width: ${percentage}%; border-radius: 2px;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn primary" onclick="document.getElementById('modalOverlay').classList.remove('show')">Cerrar</button>
      </div>
    `);
  });
  
  document.addEventListener('keydown', (e) => {
    if (!isEditMode) return;

    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCmd('bold');
          break;
        case 'i':
          e.preventDefault();
          execCmd('italic');
          break;
        case 'u':
          e.preventDefault();
          execCmd('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            execCmd('redo');
          } else {
            e.preventDefault();
            execCmd('undo');
          }
          break;
        case 'y':
          e.preventDefault();
          execCmd('redo');
          break;
        case 'c':
          if (e.shiftKey) {
            e.preventDefault();
            copySelectedFormat();
          }
          break;
        case 'v':
          if (e.shiftKey) {
            e.preventDefault();
            applyCopiedFormat();
          }
          break;
      }
    }
  });

  /* === IMPORTAR / EXPORTAR SECCIONES === */
  function collectDocumentData() {
    persistMagicEdits();
    const magicContainer = document.querySelector('.magic-content-container');
    const sectionMap = new Map();
    const seenPages = new Set();
    const exportedSections = [];
    const exportedMagicTopics = [];
    const exportedNotes = [];

    if (magicContainer) {
      magicContainer.querySelectorAll('.magic-topic').forEach(topic => {
        let topicId = (topic.id || '').trim();
        if (!topicId) {
          topicId = generateUniqueId('magic-topic');
          topic.id = topicId;
        }
        const sourceTopicId = (topic.dataset.sourceTopicId || '').trim();
        if (sourceTopicId) {
          topic.dataset.sourceTopicId = sourceTopicId;
        }
        exportedMagicTopics.push({
          id: topicId,
          html: topic.innerHTML,
          sourceTopicId: sourceTopicId || null
        });
      });
    }

    sections.forEach(section => {
      const baseSectionId = section.id || section.temas.find(t => t.page)?.page?.dataset.sectionId || generateUniqueId('seccion');
      const baseSectionName = section.nombre || section.temas.find(t => t.page)?.page?.dataset.sectionName || 'Sección';
      const sectionTheme = sectionThemes.get(baseSectionId) || section.theme || DEFAULT_THEME;
      const exportSection = {
        id: baseSectionId,
        nombre: baseSectionName,
        collapsed: !!section.collapsed,
        theme: sectionTheme,
        temas: []
      };

      sectionMap.set(baseSectionId, exportSection);
      exportedSections.push(exportSection);

      section.temas.forEach(tema => {
        const page = tema.page || pages.find(p => p.dataset.topicId === tema.id);
        if (!page) return;

        seenPages.add(page);
        page.dataset.sectionId = baseSectionId;
        if (!page.dataset.sectionName) {
          page.dataset.sectionName = baseSectionName;
        }

        let topicId = page.dataset.topicId || tema.id;
        if (!topicId) {
          topicId = generateUniqueId('topic');
          page.dataset.topicId = topicId;
        }

        const titleText = (tema.titulo || getTopicTitle(page) || '').trim() || `Tema ${exportSection.temas.length + 1}`;
        const magicId = magicAnchorFor(page);
        const magicEl = magicId ? document.getElementById(magicId) : null;
        if (magicEl && topicId) {
          magicEl.dataset.sourceTopicId = topicId;
        }

        const templateBlocks = serializeTemplateBlocks(page);
        const topicExport = {
          id: topicId,
          titulo: titleText,
          html: page.innerHTML,
          sectionId: page.dataset.sectionId,
          sectionName: page.dataset.sectionName,
          magicId: magicId || null,
          magicHtml: magicEl ? magicEl.innerHTML : null,
          theme: getPageTheme(page)
        };
        if (templateBlocks.length) {
          topicExport.templateBlocks = templateBlocks;
        }

        exportSection.temas.push(topicExport);
      });
    });

    pages.forEach(page => {
      if (seenPages.has(page)) return;

      const sectionId = page.dataset.sectionId || generateUniqueId('seccion');
      const sectionName = page.dataset.sectionName || 'Sección';
      let exportSection = sectionMap.get(sectionId);
      if (!exportSection) {
        const fallbackTheme = sectionThemes.get(sectionId) || getPageTheme(page);
        exportSection = {
          id: sectionId,
          nombre: sectionName,
          collapsed: false,
          theme: fallbackTheme,
          temas: []
        };
        sectionMap.set(sectionId, exportSection);
        exportedSections.push(exportSection);
      }

      let topicId = page.dataset.topicId;
      if (!topicId) {
        topicId = generateUniqueId('topic');
        page.dataset.topicId = topicId;
      }

      const magicId = magicAnchorFor(page);
      const magicEl = magicId ? document.getElementById(magicId) : null;
      if (magicEl && topicId) {
        magicEl.dataset.sourceTopicId = topicId;
      }

      const templateBlocks = serializeTemplateBlocks(page);
      const topicExport = {
        id: topicId,
        titulo: getTopicTitle(page) || `Tema ${exportSection.temas.length + 1}`,
        html: page.innerHTML,
        sectionId: sectionId,
        sectionName: sectionName,
        magicId: magicId || null,
        magicHtml: magicEl ? magicEl.innerHTML : null,
        theme: getPageTheme(page)
      };
      if (templateBlocks.length) {
        topicExport.templateBlocks = templateBlocks;
      }

      exportSection.temas.push(topicExport);
    });

    if (floatingNotesLayer) {
      floatingNotesLayer.querySelectorAll('.floating-note').forEach(note => {
        if (!note) return;
        let noteId = (note.dataset.noteId || '').trim();
        if (!noteId) {
          noteId = generateUniqueId('floating-note');
          note.dataset.noteId = noteId;
        }
        const body = note.querySelector('.floating-note-body');
        const left = Number.parseFloat(note.dataset.left || note.style.left || '0');
        const top = Number.parseFloat(note.dataset.top || note.style.top || '0');
        const width = Number.parseFloat(note.dataset.width || note.style.width || (note.getBoundingClientRect().width || note.offsetWidth || '').toString());
        const height = Number.parseFloat(note.dataset.height || note.style.height || (note.getBoundingClientRect().height || note.offsetHeight || '').toString());
        const noteData = notesRegistry.get(noteId) || null;
        const noteExport = {
          id: noteId,
          html: body ? body.innerHTML : '',
          style: note.dataset.style || 'default',
          left: Number.isFinite(left) ? left : 0,
          top: Number.isFinite(top) ? top : 0
        };
        if (Number.isFinite(width) && width > 0) {
          noteExport.width = width;
        }
        if (Number.isFinite(height) && height > 0) {
          noteExport.height = height;
        }
        if (noteData) {
          noteExport.category = noteData.category;
          noteExport.priority = noteData.priority;
          noteExport.tags = Array.isArray(noteData.tags) ? [...noteData.tags] : [];
          noteExport.title = noteData.title || '';
          noteExport.titleHtml = noteData.titleHtml || '';
          noteExport.reviewed = !!noteData.reviewed;
          noteExport.reviewCount = Number(noteData.reviewCount) || 0;
          noteExport.lastReviewed = noteData.lastReviewed || null;
          noteExport.topicId = noteData.topicId || null;
          noteExport.sectionId = noteData.sectionId || null;
          noteExport.type = noteData.type || NOTE_TYPES.FLOATING;
          noteExport.anchorId = noteData.anchorId || null;
          noteExport.linkedTo = noteData.linkedTo || null;
          noteExport.createdAt = noteData.createdAt || null;
          noteExport.updatedAt = noteData.updatedAt || null;
          noteExport.compactHeader = !!noteData.compactHeader;
          noteExport.customIcon = noteData.customIcon || null;
          noteExport.hoverAnimation = noteData.hoverAnimation === true;
          noteExport.styleNeutralText = noteData.styleNeutralText === true;
          noteExport.ultraCompact = noteData.ultraCompact === true;
          noteExport.superNote = noteData.superNote === true;
          if (Array.isArray(noteData.superTabs)) {
            noteExport.superTabs = noteData.superTabs.map(tab => ({
              id: tab.id,
              title: tab.title || null,
              color: tab.color || null,
              pages: Array.isArray(tab.pages)
                ? tab.pages.map(page => ({
                    id: page.id,
                    title: page.title || null,
                    html: typeof page.html === 'string' ? page.html : '',
                    content: typeof page.content === 'string' ? page.content : '',
                    createdAt: page.createdAt || null,
                    updatedAt: page.updatedAt || null
                  }))
                : [],
              currentPageIndex: Number.isInteger(tab.currentPageIndex) ? tab.currentPageIndex : 0,
              html: typeof tab.html === 'string' ? tab.html : '',
              content: typeof tab.content === 'string' ? tab.content : '',
              createdAt: tab.createdAt || null,
              updatedAt: tab.updatedAt || null
            }));
          }
          noteExport.activeSuperTabId = noteData.activeSuperTabId || null;
          if (Array.isArray(noteData.pages)) {
            noteExport.pages = noteData.pages.map(page => ({
              id: page.id,
              title: page.title || null,
              html: typeof page.html === 'string' ? page.html : '',
              content: typeof page.content === 'string' ? page.content : '',
              createdAt: page.createdAt || null,
              updatedAt: page.updatedAt || null
            }));
          }
          noteExport.currentPageIndex = Number.isInteger(noteData.currentPageIndex)
            ? noteData.currentPageIndex
            : 0;
          if (Number.isFinite(noteData.pageOffsetLeft)) {
            noteExport.pageOffsetLeft = noteData.pageOffsetLeft;
          }
          if (Number.isFinite(noteData.pageOffsetTop)) {
            noteExport.pageOffsetTop = noteData.pageOffsetTop;
          }
          if (Number.isFinite(noteData.relativeLeft)) {
            noteExport.relativeLeft = noteData.relativeLeft;
          }
          if (Number.isFinite(noteData.relativeTop)) {
            noteExport.relativeTop = noteData.relativeTop;
          }
          noteExport.behindMainContent = !!noteData.behindMainContent;
          noteExport.meta = { ...noteData, element: undefined };
          delete noteExport.meta.element;
        }
        if (noteExport.behindMainContent === undefined) {
          noteExport.behindMainContent = note.classList.contains('floating-note-behind');
        }
        exportedNotes.push(noteExport);
      });
    }

    return {
      specialty: getDocumentTitle() || '',
      sections: exportedSections,
      magicContainerHtml: magicContainer ? magicContainer.innerHTML : '',
      magicTopics: exportedMagicTopics,
      floatingNotes: exportedNotes,
      notesHidden: floatingNotesHidden,
      documentShift: documentHorizontalShift
    };
  }

  function showCacheButtonFeedback(icon, label, duration = 2000) {
    if (!cacheSaveBtn) {
      return;
    }
    const oldHtml = cacheSaveBtn.innerHTML;
    cacheSaveBtn.innerHTML = `<span>${icon}</span> <span class="topbar-btn-label">${label}</span>`;
    setTimeout(() => {
      cacheSaveBtn.innerHTML = oldHtml;
    }, duration);
  }

  async function saveToLocalCache(showFeedback = true) {
    const snapshot = {
      version: 1,
      savedAt: new Date().toISOString(),
      zoom: isMagicViewActive ? lastRegularZoom : currentZoom,
      documentShift: documentHorizontalShift,
      data: collectDocumentData()
    };

    const snapshotJson = JSON.stringify(snapshot);

    try {
      if (!window.localStorage) {
        throw new Error('Almacenamiento local no disponible');
      }

      try {
        window.localStorage.removeItem(CACHE_STORAGE_KEY);
      } catch (cleanupError) {
        console.warn('No se pudo limpiar la caché previa antes de guardar:', cleanupError);
      }

      const shouldClearExtended = usingExtendedCache || !!extendedCacheDbPromise;
      window.localStorage.setItem(CACHE_STORAGE_KEY, snapshotJson);
      if (shouldClearExtended) {
        await clearExtendedCacheValue();
      }
      usingExtendedCache = false;

      if (showFeedback) {
        if (cacheSaveBtn) {
          showCacheButtonFeedback('✅', 'Guardado');
        } else {
          console.info('Cambios guardados en caché.');
        }
      }

      return true;
    } catch (error) {
      if (isQuotaExceededError(error) && ('indexedDB' in window)) {
        try {
          await writeExtendedCacheValue(snapshotJson);
          usingExtendedCache = true;
          if (showFeedback) {
            if (cacheSaveBtn) {
              showCacheButtonFeedback('📦', 'Guardado extendido');
            } else {
              alert('El contenido se guardó en almacenamiento extendido.');
            }
          }
          return true;
        } catch (extendedError) {
          console.error('Error al usar almacenamiento extendido:', extendedError);
          if (showFeedback) {
            alert('El documento es demasiado grande para guardarse automáticamente. Exporta una copia para no perder información.');
          }
          return false;
        }
      }

      console.error('Error al guardar en caché:', error);
      if (showFeedback) {
        alert('No se pudo guardar en caché: ' + (error && error.message ? error.message : error));
      }
      return false;
    }
  }

  async function restoreFromLocalCache() {
    let raw = null;
    let source = 'local';

    try {
      if (window.localStorage) {
        raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
      }
    } catch (error) {
      console.error('No se pudo acceder al almacenamiento local:', error);
      raw = null;
    }

    if (!raw && ('indexedDB' in window)) {
      try {
        raw = await readExtendedCacheValue();
        if (raw) {
          source = 'extended';
          usingExtendedCache = true;
        }
      } catch (error) {
        console.error('No se pudo leer la caché extendida:', error);
      }
    }

    if (!raw) {
      return false;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return false;
      }

      let restored = false;

      if (parsed.data) {
        importSectionsData(parsed.data);
        restored = true;
      }

      if (typeof parsed.zoom === 'number') {
        applyZoom(parsed.zoom);
      } else {
        applyZoom(currentZoom);
      }

      if (!Number.isFinite(parsed.data?.documentShift)) {
        if (Number.isFinite(parsed.documentShift)) {
          documentHorizontalShift = Math.min(
            DOCUMENT_SHIFT_MAX,
            Math.max(DOCUMENT_SHIFT_MIN, parsed.documentShift)
          );
          applyDocumentShift();
        } else if (!restored) {
          applyDocumentShift();
        }
      }

      if (source === 'local' && usingExtendedCache) {
        await clearExtendedCacheValue();
        usingExtendedCache = false;
      }

      return restored;
    } catch (error) {
      console.error('Error al restaurar desde caché:', error);
      return false;
    }
  }

  function downloadJsonFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadTextFile(content, filename, mimeType = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importSectionsData(data) {
    if (!data || !Array.isArray(data.sections)) {
      throw new Error('El archivo no contiene secciones válidas.');
    }

    closeTopicNotesPopover();

    const rawShift = Number.parseFloat(data.documentShift);
    if (Number.isFinite(rawShift)) {
      documentHorizontalShift = Math.min(
        DOCUMENT_SHIFT_MAX,
        Math.max(DOCUMENT_SHIFT_MIN, rawShift)
      );
    } else {
      documentHorizontalShift = 0;
    }
    applyDocumentShift();

    const mainContainer = document.body;
    const scriptTag = document.querySelector('script');
    if (!scriptTag) {
      throw new Error('No se encontró el contenedor principal.');
    }

    io.disconnect();
    pages.forEach(page => page.remove());

    if (specialtySpan && typeof data.specialty === 'string') {
      setDocumentTitle(data.specialty);
    }

    sectionThemes = new Map();

    const magicContainer = document.querySelector('.magic-content-container');
    const magicTopicMap = new Map();
    const magicTopicBySource = new Map();
    if (magicContainer) {
      magicContainer.innerHTML = '';
      if (Array.isArray(data.magicTopics) && data.magicTopics.length) {
        data.magicTopics.forEach(topicInfo => {
          let topicId = topicInfo?.id ? String(topicInfo.id).trim() : '';
          if (!topicId) {
            topicId = generateUniqueId('magic-topic');
          }
          const sourceTopicId = topicInfo?.sourceTopicId ? String(topicInfo.sourceTopicId).trim() : '';
          const magicTopic = document.createElement('div');
          magicTopic.id = topicId;
          magicTopic.className = 'magic-topic';
          magicTopic.innerHTML = typeof topicInfo?.html === 'string' ? topicInfo.html : '';
          magicContainer.appendChild(magicTopic);
          afterContentSanitize(magicTopic);
          magicTopicMap.set(topicId, magicTopic);
          if (sourceTopicId) {
            magicTopic.dataset.sourceTopicId = sourceTopicId;
            magicTopicBySource.set(sourceTopicId, magicTopic);
          }
        });
      } else if (typeof data.magicContainerHtml === 'string') {
        magicContainer.innerHTML = data.magicContainerHtml;
        magicContainer.querySelectorAll('.magic-topic').forEach(topic => {
          afterContentSanitize(topic);
          if (topic.id) {
            const trimmedId = topic.id.trim();
            if (trimmedId && trimmedId !== topic.id) {
              topic.id = trimmedId;
            }
            if (trimmedId) {
              magicTopicMap.set(trimmedId, topic);
            }
          }
          const sourceTopicId = (topic.dataset.sourceTopicId || '').trim();
          if (sourceTopicId) {
            topic.dataset.sourceTopicId = sourceTopicId;
            magicTopicBySource.set(sourceTopicId, topic);
          }
        });
      }
    }

    const newPages = [];
    const newSections = [];

    data.sections.forEach(sectionData => {
      const sectionId = sectionData?.id ? String(sectionData.id) : generateUniqueId('seccion');
      const sectionName = sectionData?.nombre ? String(sectionData.nombre) : 'Sección';
      const sectionCollapsed = !!sectionData?.collapsed;
      const sectionTheme = AVAILABLE_THEMES.includes(sectionData?.theme) ? sectionData.theme : DEFAULT_THEME;
      sectionThemes.set(sectionId, sectionTheme);
      const sectionInfo = { id: sectionId, nombre: sectionName, collapsed: sectionCollapsed, temas: [], theme: sectionTheme };
      const topics = Array.isArray(sectionData?.temas) ? sectionData.temas : [];

      topics.forEach(topicData => {
        let topicId = topicData?.id ? String(topicData.id) : generateUniqueId('topic');
        topicId = topicId.trim();
        const topicSectionName = topicData?.sectionName ? String(topicData.sectionName) : sectionName;
        const page = document.createElement('section');
        page.className = 'page';
        page.dataset.sectionId = sectionId;
        page.dataset.sectionName = topicSectionName;
        page.dataset.topicId = topicId;
        page.innerHTML = typeof topicData?.html === 'string' ? topicData.html : '';
        mainContainer.insertBefore(page, scriptTag);
        afterContentSanitize(page);
        if (Array.isArray(topicData?.templateBlocks)) {
          restoreTemplateBlocks(page, topicData.templateBlocks);
        }
        page.contentEditable = isEditMode ? 'true' : 'false';
        const pageTheme = AVAILABLE_THEMES.includes(topicData?.theme) ? topicData.theme : sectionTheme;
        applyThemeToPage(page, pageTheme);

        const title = (topicData?.titulo && String(topicData.titulo).trim()) || getTopicTitle(page) || `Tema ${sectionInfo.temas.length + 1}`;
        sectionInfo.temas.push({ id: topicId, titulo: title, page });
        newPages.push(page);

        let resolvedMagicId = '';
        if (magicContainer) {
          const desiredMagicId = topicData?.magicId ? String(topicData.magicId).trim() : '';
          let magicTopic = desiredMagicId ? magicTopicMap.get(desiredMagicId) : null;

          if (!magicTopic && desiredMagicId) {
            const existing = document.getElementById(desiredMagicId);
            if (existing && existing.classList.contains('magic-topic')) {
              magicTopic = existing;
              magicTopicMap.set(desiredMagicId, magicTopic);
            }
          }

          if (!magicTopic) {
            magicTopic = magicTopicBySource.get(topicId);
          }

          if (!magicTopic && typeof topicData?.magicHtml === 'string') {
            let baseId = desiredMagicId || `magic-topic-${topicId}`;
            baseId = baseId.trim();
            if (!baseId) {
              baseId = generateUniqueId('magic-topic');
            }
            let uniqueId = baseId;
            while (uniqueId && (magicTopicMap.has(uniqueId) || document.getElementById(uniqueId))) {
              uniqueId = `${baseId}-${Math.random().toString(36).slice(2, 6)}`;
            }
            magicTopic = document.createElement('div');
            magicTopic.id = uniqueId;
            magicTopic.className = 'magic-topic';
            magicContainer.appendChild(magicTopic);
            magicTopicMap.set(uniqueId, magicTopic);
          }

          if (magicTopic) {
            if (!magicTopic.id) {
              let fallbackId = desiredMagicId || `magic-topic-${topicId || generateUniqueId('magic-topic')}`;
              fallbackId = (fallbackId || '').trim();
              if (!fallbackId) {
                fallbackId = generateUniqueId('magic-topic');
              }
              let finalId = fallbackId;
              while (finalId && (magicTopicMap.has(finalId) || document.getElementById(finalId))) {
                finalId = `${fallbackId}-${Math.random().toString(36).slice(2, 6)}`;
              }
              magicTopic.id = finalId;
            }
            if (typeof topicData.magicHtml === 'string') {
              magicTopic.innerHTML = topicData.magicHtml;
              afterContentSanitize(magicTopic);
            }
            if (topicId) {
              magicTopic.dataset.sourceTopicId = topicId;
              magicTopicBySource.set(topicId, magicTopic);
            }
            if (!magicTopicMap.has(magicTopic.id)) {
              magicTopicMap.set(magicTopic.id, magicTopic);
            }
            resolvedMagicId = magicTopic.id;
          }
        }

        if (resolvedMagicId) {
          page.dataset.magicAnchorId = resolvedMagicId;
        } else if (topicData?.magicId) {
          const fallbackMagicId = String(topicData.magicId).trim();
          if (fallbackMagicId) {
            page.dataset.magicAnchorId = fallbackMagicId;
          } else {
            delete page.dataset.magicAnchorId;
          }
        } else {
          delete page.dataset.magicAnchorId;
        }
      });

      newSections.push(sectionInfo);
    });

    pages = newPages;
    sections = newSections;
    allSectionsExpanded = sections.every(section => !section.collapsed);
    globalTopicCounter = 1;

    restoreFloatingNotes(Array.isArray(data.floatingNotes) ? data.floatingNotes : [], !!data.notesHidden);
    setFloatingNotesEditable(isEditMode);

    pages.forEach(page => io.observe(page));
    setupMagicIcons();
    initializeSections();
    buildSectionsPanel();
    if (isEditMode) {
      enableHtmlPaste();
    }
    hideImageToolbar();
    hideTemplateToolbar();
    savedSelection = null;
    const firstPage = pages[0] || null;
    setActivePage(firstPage || null);
    scheduleIconPickerRebind(150);
    window.scrollTo({ top: 0 });
  }

  exportDataBtn?.addEventListener('click', () => {
    try {
      const data = collectDocumentData();
      const specialtySlug = (data.specialty || 'documento').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
      const filename = `${specialtySlug || 'documento'}-secciones-${timestamp}.json`;
      downloadJsonFile(data, filename);
      const btn = exportDataBtn;
      if (btn) {
        const oldHtml = btn.innerHTML;
        btn.innerHTML = '<span>✅</span> <span class="topbar-btn-label">Exportado</span>';
        setTimeout(() => {
          btn.innerHTML = oldHtml;
        }, 2000);
      }
    } catch (error) {
      console.error('Error al exportar datos:', error);
      alert('No se pudo exportar el contenido: ' + error.message);
    }
  });

  importDataBtn?.addEventListener('click', () => {
    importDataInput?.click();
  });

  importDataInput?.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importSectionsData(data);
      if (importDataBtn) {
        const oldHtml = importDataBtn.innerHTML;
        importDataBtn.innerHTML = '<span>✅</span> <span class="topbar-btn-label">Importado</span>';
        setTimeout(() => {
          importDataBtn.innerHTML = oldHtml;
        }, 2000);
      }
    } catch (error) {
      console.error('Error al importar datos:', error);
      alert('Error al importar datos: ' + error.message);
    } finally {
      event.target.value = '';
    }
  });

  /* === GUARDAR HTML === */
  saveHtmlBtn?.addEventListener('click', async () => {
    persistMagicEdits();
    const wasEditing = isEditMode;
    if (wasEditing) {
      pages.forEach(page => page.contentEditable = 'false');
    }

    const toolbarWasVisible = editToolbar.classList.contains('show');
    if (toolbarWasVisible) {
      editToolbar.classList.remove('show');
    }

    const buildData = {
      especialidad: getDocumentTitle() || 'documento',
      secciones: sections.map(sec => ({
        id: sec.id,
        nombre: sec.nombre,
        theme: sectionThemes.get(sec.id) || sec.theme || DEFAULT_THEME,
        temas: sec.temas.map(t => ({
          id: t.id,
          titulo: t.titulo
        }))
      }))
    };

    const inlineStyleElement = document.createElement('style');
    inlineStyleElement.setAttribute('data-export-inline', 'true');

    try {
      const stylesheetText = await getStylesheetTextForExport();
      const inlineStyles = stylesheetText || '/* No se pudieron cargar estilos */';
      inlineStyleElement.textContent = inlineStyles;
      document.head.appendChild(inlineStyleElement);

      const doctype = '<!DOCTYPE html>\n';
      let html = document.documentElement.outerHTML;

      const buildComment = `<!-- build:topics ${JSON.stringify(buildData)} -->`;
      html = html.replace(/<!-- build:topics.*?-->/s, buildComment);

      const fullHtml = doctype + html;

      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const specialty = getDocumentTitle() || 'documento';
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `${specialty.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.html`;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const btn = saveHtmlBtn;
      const oldText = btn.textContent;
      btn.textContent = '✅ Guardado';
      setTimeout(() => btn.textContent = oldText, 2000);
    } catch (error) {
      console.error('Error al guardar HTML:', error);
      alert('No se pudo guardar el HTML: ' + (error.message || error));
    } finally {
      if (inlineStyleElement.parentNode) {
        inlineStyleElement.parentNode.removeChild(inlineStyleElement);
      }

      if (toolbarWasVisible) {
        editToolbar.classList.add('show');
      }

      if (wasEditing) {
        pages.forEach(page => page.contentEditable = 'true');
      }
    }
  });

  function importHtmlFile(file, existingTopicIds) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const htmlText = event.target.result;
          const parser = new DOMParser();
          const loadedDoc = parser.parseFromString(htmlText, 'text/html');

          let hasNewStructure = false;
          let importedSectionId = null;
          let importedSectionName = 'Importado';

          try {
            const buildMatch = htmlText.match(/build:topics\s({.*?})/s);
            if (buildMatch) {
              const buildData = JSON.parse(buildMatch[1]);
              if (buildData.secciones && buildData.secciones.length > 0) {
                hasNewStructure = true;
                importedSectionId = buildData.secciones[0].id;
                importedSectionName = buildData.secciones[0].nombre;
              }
            }
          } catch (error) {
            console.log('Archivo sin estructura de secciones');
          }

          const loadedSpecialty = loadedDoc.getElementById('specialtyTitle');
          if (loadedSpecialty && specialtySpan && loadedSpecialty.textContent.trim()) {
            setDocumentTitle(loadedSpecialty.textContent.trim());
          }

          const mainContainer = document.querySelector('body');
          const scriptTag = mainContainer.querySelector('script');
          const loadedPages = loadedDoc.querySelectorAll('.page');

          if (loadedPages.length === 0) {
            throw new Error(`No se encontraron secciones de contenido en ${file.name}`);
          }

          if (!hasNewStructure) {
            importedSectionId = 'seccion-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
            importedSectionName = file.name.replace(/\.html$/i, '');
          }

          loadedPages.forEach(page => {
            const clonedPage = page.cloneNode(true);
            afterContentSanitize(clonedPage);

            if (!clonedPage.dataset.sectionId) {
              clonedPage.dataset.sectionId = importedSectionId;
            }
            if (!clonedPage.dataset.sectionName) {
              clonedPage.dataset.sectionName = importedSectionName;
            }

            let topicId = clonedPage.dataset.topicId;
            if (!topicId) {
              topicId = 'topic-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
              clonedPage.dataset.topicId = topicId;
            } else if (existingTopicIds.has(topicId)) {
              const newId = topicId + '-' + Math.random().toString(36).substr(2, 4);
              clonedPage.dataset.topicId = newId;
              topicId = newId;
            }
            existingTopicIds.add(topicId);

            clonedPage.contentEditable = isEditMode ? 'true' : 'false';
            mainContainer.insertBefore(clonedPage, scriptTag);
          });

          const magicContainer = document.querySelector('.magic-content-container');
          if (magicContainer) {
            const loadedMagicContainer = loadedDoc.querySelector('.magic-content-container');
            if (loadedMagicContainer) {
              loadedMagicContainer.querySelectorAll('.magic-topic').forEach(topic => {
                const clonedTopic = topic.cloneNode(true);
                afterContentSanitize(clonedTopic);
                const sourceTopicId = (clonedTopic.dataset.sourceTopicId || '').trim();
                if (sourceTopicId) {
                  clonedTopic.dataset.sourceTopicId = sourceTopicId;
                } else {
                  delete clonedTopic.dataset.sourceTopicId;
                }
                magicContainer.appendChild(clonedTopic);
              });
            }
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo'));
      reader.readAsText(file);
    });
  }

  /* === CARGAR HTML === */
  loadHtmlBtn?.addEventListener('click', () => {
    loadHtmlInput.click();
  });

  loadHtmlInput?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const htmlFiles = files.filter(file => file.name.toLowerCase().endsWith('.html'));
    const ignoredFiles = files.filter(file => !file.name.toLowerCase().endsWith('.html'));

    if (!htmlFiles.length) {
      alert('Por favor selecciona archivos HTML válidos');
      e.target.value = '';
      return;
    }

    if (ignoredFiles.length) {
      alert(`Se ignoraron archivos no compatibles: ${ignoredFiles.map(f => f.name).join(', ')}`);
    }

    const existingTopicIds = new Set(pages.map(p => p.dataset.topicId).filter(Boolean));

    try {
      for (const file of htmlFiles) {
        await importHtmlFile(file, existingTopicIds);
      }

      pages = [...document.querySelectorAll('.page')];
      pages.forEach(p => {
        afterContentSanitize(p);
        if (!p.dataset.topicId) {
          p.dataset.topicId = 'topic-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
        io.observe(p);
      });

      setupMagicIcons();
      initializeSections();
      buildSectionsPanel();

      if (isEditMode) {
        pages.forEach(page => page.contentEditable = 'true');
        enableHtmlPaste();
      }

      const btn = loadHtmlBtn;
      if (btn) {
        const oldText = btn.innerHTML;
        btn.innerHTML = '<span>✅</span> <span class="topbar-btn-label">Cargado</span>';
        setTimeout(() => btn.innerHTML = oldText, 2000);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error al cargar el archivo:', error);
      alert('Error al cargar archivos: ' + error.message);
    } finally {
      e.target.value = '';
    }
  });

  /* === COPIAR HTML === */
  document.getElementById('copyHtmlBtn')?.addEventListener('click', async () => {
    const inlineStyleElement = document.createElement('style');
    inlineStyleElement.setAttribute('data-export-inline', 'true');

    try {
      const stylesheetText = await getStylesheetTextForExport();
      const inlineStyles = stylesheetText || '/* No se pudieron cargar estilos */';
      inlineStyleElement.textContent = inlineStyles;
      document.head.appendChild(inlineStyleElement);

      const doctype = '<!DOCTYPE html>\n';
      const html = doctype + document.documentElement.outerHTML;
      await navigator.clipboard.writeText(html);
      const btn = document.getElementById('copyHtmlBtn');
      const old = btn.innerHTML;
      btn.innerHTML = '<span>✅</span> <span class="topbar-btn-label">Copiado</span>';
      setTimeout(() => btn.innerHTML = old, 1500);
    } catch (e) {
      console.error('No se pudo copiar el HTML', e);
      alert('No se pudo copiar el HTML');
    } finally {
      if (inlineStyleElement.parentNode) {
        inlineStyleElement.parentNode.removeChild(inlineStyleElement);
      }
    }
  });

  cacheSaveBtn?.addEventListener('click', () => {
    void saveToLocalCache(true);
  });

  window.addEventListener('beforeunload', () => {
    void saveToLocalCache(false);
  });

  const restoredFromCache = await restoreFromLocalCache();
  if (!restoredFromCache) {
    buildSectionsPanel();
    applyZoom(currentZoom);
  }

}
