import { generateUniqueId } from './utils/id.js';
import {
  NoteRegistry,
  NOTE_TYPES,
  NOTE_CATEGORIES,
  NOTE_PRIORITY_SEQUENCE,
  DEFAULT_NOTE_PRIORITY,
  DEFAULT_NOTE_CATEGORY,
  DEFAULT_NOTE_TYPE
} from './modules/notes/NoteRegistry.js';
import {
  sanitizeTags,
  escapeHtml,
  getNotePlainTextFromHtml,
  getNoteCategoryInfo,
  getNoteDisplayTitle
} from './modules/notes/noteUtils.js';

export function initializeEditor() {
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
      let tableMenuAPI = null;
      let cachedToolbarHeight = 0;
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
        { id: 'default', name: 'Clásica', shortName: 'Clásica', className: 'floating-note-style-default' },
        { id: 'blank', name: 'Blanca', shortName: 'Blanca', className: 'floating-note-style-blank' },
        { id: 'sky', name: 'Cielo', shortName: 'Cielo', className: 'floating-note-style-sky' },
        { id: 'mint', name: 'Menta', shortName: 'Menta', className: 'floating-note-style-mint' },
        { id: 'rose', name: 'Pétalo', shortName: 'Pétalo', className: 'floating-note-style-rose' },
        { id: 'lilac', name: 'Lavanda', shortName: 'Lavanda', className: 'floating-note-style-lilac' },
        { id: 'slate', name: 'Pizarra', shortName: 'Pizarra', className: 'floating-note-style-slate' },
        { id: 'citrus', name: 'Cítrica', shortName: 'Cítrica', className: 'floating-note-style-citrus' },
        { id: 'midnight', name: 'Nocturna', shortName: 'Nocturna', className: 'floating-note-style-midnight' },
        { id: 'dawn', name: 'Aurora', shortName: 'Aurora', className: 'floating-note-style-dawn' },
        { id: 'forest', name: 'Bosque', shortName: 'Bosque', className: 'floating-note-style-forest' }
      ];

      const NOTE_ICON_SYMBOLS = [
        '▪︎', '▪️', '▫️', '□', '●', '○', '◉', '◆', '◇', '◈', '🔹', '🔸', '📌', '📍', '📂', '📄',
        '📝', '📋', '📎', '🔑', '📚', '📑', '📊', '🔎', '💡', '⚠️', '✅', '☑️', '✔️', '❌', '✖️',
        '❔', '⭐', '🩺', '💉', '💊', '🩸', '🧪', '🔬', '🩻', '🦠', '➕', '➖', 'o', '±', '~', '≈',
        '•', '‣', '↑', '↓', '→', '←', '↔', '⇧', '⇩', '⇨', '⇦', '↗', '↘', '↙', '↖', '➡️', '⬅️',
        '➔', '↳', '➤', '⇒', '⮕', '▸', '▹'
      ];

      const NOTE_BORDER_COLORS = [
        '#f97316', '#f43f5e', '#facc15', '#22c55e', '#2dd4bf', '#38bdf8', '#a855f7', '#ef4444', '#0ea5e9', '#6b7280', '#1f2937', '#000000'
      ];

      let floatingNotesHidden = false;
      let floatingNoteZIndex = 10;
      let floatingNoteCreationOffset = 0;
      const floatingNoteDragState = { note: null, pointerId: null, offsetX: 0, offsetY: 0 };
      const FLOATING_NOTE_DEFAULT_WIDTH = 240;
      const FLOATING_NOTE_MIN_WIDTH = 160;
      const FLOATING_NOTE_MIN_HEIGHT = 140;
      let activeFloatingNoteStyleMenu = null;
      let floatingNoteResizeObserver = null;
      let pendingFloatingNoteViewportRefresh = false;
      let pendingTopicNoteIndicatorUpdate = false;
      let cachedActiveTopicViewportState = null;
      let documentHorizontalShift = 0;
      const DOCUMENT_SHIFT_STEP = 80;
      const DOCUMENT_SHIFT_MIN = -1500;
      const DOCUMENT_SHIFT_MAX = 1500;

      const CACHE_STORAGE_KEY = 'emi2025-editor-cache-v1';
      let cachedStylesheetForExport = null;

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
          return;
        }
        const nextTopicId = page.dataset.topicId || '';
        if (isTopicNotesPopoverOpen() && topicNotesPopoverTopicId && topicNotesPopoverTopicId !== nextTopicId) {
          closeTopicNotesPopover();
        }
        currentPageRef = page;
        const sectionId = page.dataset.sectionId || 'seccion-default';
        currentSectionId = sectionId;
        const themeClass = getPageTheme(page);
        sectionThemes.set(sectionId, themeClass);
        updateSectionIndicator(page);
        updateThemeSelectControl(themeClass);
        syncBodyTheme(themeClass);
        invalidateActiveTopicViewportState();
        refreshFloatingNotesTopicVisibility();
        scheduleFloatingNotesViewportRefresh();
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
        if (!specialtySpan) return;
        const trimmed = (value || '').trim();
        specialtySpan.dataset.documentTitle = trimmed;
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
      const insertTemplateBtn = document.getElementById('insertTemplateBtn');
      const insertIconBtn = document.getElementById('insertIconBtn');
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
      const toggleVerticalBorders = document.getElementById('toggleVerticalBorders');
      const toggleHorizontalBorders = document.getElementById('toggleHorizontalBorders');
      const tableBorderResetBtn = document.querySelector('[data-border-reset]');
      const tableResizeOverlay = document.getElementById('tableResizeOverlay');

      const highlightColors = [
        '#f59aa5', '#f6a475', '#f5ba62', '#f6cf59', '#d6e36f', '#9fd48d', '#6fcdc9', '#7fb6eb',
        '#a59bf4', '#e19ad2', '#f0a9a4', '#d3a978', '#b2c1cf', '#8fa6f1', '#c19fe6', '#b58b74',
        '#e2a3c3', '#f0b88f', '#f4d48a', '#c3df92', '#7fc4ab', '#66a9c9', '#7c90d4', '#dea1c8',
        '#ed957f', '#f3c07a', '#f7dfa1', '#acd78b', '#6bbfa3', '#5aa8c5', '#8793d9', '#eaaccf'
      ];

      const textAccentColors = [
        '#1f2937', '#0f172a', '#334155', '#0b7285', '#9d174d', '#a16207', '#0f766e', '#000000'
      ];

      const textColors = [
        ...highlightColors,
        ...textAccentColors
      ];

      let copiedFormat = null;

      const tableResizers = new WeakMap();

      const iconPicker = document.createElement('div');
      iconPicker.id = 'iconPicker';
      iconPicker.className = 'icon-picker';
      iconPicker.setAttribute('role', 'menu');
      iconPicker.setAttribute('aria-label', 'Insertar icono');
      NOTE_ICON_SYMBOLS.forEach(symbol => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'icon-picker-btn';
        btn.textContent = symbol;
        btn.title = `Insertar ${symbol}`;
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          const inserted = insertTextAtSelection(`${symbol} `);
          if (!inserted) {
            alert('Selecciona un área editable antes de insertar iconos.');
          }
          hideIconPicker();
        });
        iconPicker.appendChild(btn);
      });
      document.body.appendChild(iconPicker);

      let iconPickerAnchor = null;

      function hideIconPicker() {
        if (!iconPicker.classList.contains('show')) {
          return;
        }
        iconPicker.classList.remove('show');
        iconPickerAnchor = null;
      }

      function showIconPicker(anchor) {
        if (!anchor) {
          return;
        }
        iconPickerAnchor = anchor;
        const rect = anchor.getBoundingClientRect();
        const offsetTop = rect.bottom + window.scrollY + 6;
        const offsetLeft = rect.left + window.scrollX;
        iconPicker.style.top = `${offsetTop}px`;
        iconPicker.style.left = `${offsetLeft}px`;
        iconPicker.classList.add('show');
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
        <button data-action="duplicate">Duplicar tema</button>
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
          if (!note || note.type !== NOTE_TYPES.FLOATING) return;
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
          if (!note || note.type !== NOTE_TYPES.FLOATING) return;
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

      function duplicateTopicPage(page) {
        if (!page) return null;
        const clone = page.cloneNode(true);
        const titleSpan = clone.querySelector('h1 span:first-child');
        if (titleSpan) {
          const currentTitle = titleSpan.textContent.trim();
          titleSpan.textContent = currentTitle ? `${currentTitle} (Copia)` : 'Tema (Copia)';
        }
        const newId = 'topic-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
        clone.dataset.topicId = newId;
        clone.contentEditable = isEditMode ? 'true' : 'false';
        applyThemeToPage(clone, getPageTheme(page));
        page.parentNode.insertBefore(clone, page.nextSibling);
        pages = [...document.querySelectorAll('.page')];
        setupMagicIcons();
        io.observe(clone);
        initializeSections();
        buildSectionsPanel();
        scrollPageIntoViewWithOffset(clone);
        return clone;
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
          case 'duplicate':
            duplicateTopicPage(page);
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
        if (!Number.isFinite(scaleFactor) || Math.abs(scaleFactor - 1) < 0.0001) {
          scheduleFloatingNotesViewportRefresh();
          return;
        }

        const applyScaledPosition = (value) => {
          if (!Number.isFinite(value)) return value;
          const scaled = value * scaleFactor;
          return Number.isFinite(scaled) ? scaled : value;
        };

        floatingNotesLayer.querySelectorAll('.floating-note').forEach(note => {
          if (!(note instanceof HTMLElement)) {
            return;
          }

          const currentLeft = Number.parseFloat(note.dataset.left || note.style.left || '0');
          const currentTop = Number.parseFloat(note.dataset.top || note.style.top || '0');
          const nextLeft = applyScaledPosition(currentLeft);
          const nextTop = applyScaledPosition(currentTop);

          if (Number.isFinite(nextLeft) || Number.isFinite(nextTop)) {
            positionFloatingNote(
              note,
              Number.isFinite(nextLeft) ? nextLeft : currentLeft,
              Number.isFinite(nextTop) ? nextTop : currentTop
            );
          }

          const noteId = note.dataset.noteId;
          if (!noteId) {
            return;
          }

          const registryData = notesRegistry.get(noteId);
          if (!registryData) {
            return;
          }

          const updates = {};

          if (Number.isFinite(registryData.pageOffsetTop)) {
            const scaledTop = applyScaledPosition(registryData.pageOffsetTop);
            if (Number.isFinite(scaledTop)) {
              updates.pageOffsetTop = scaledTop;
              note.dataset.pageOffsetTop = String(scaledTop);
            }
          }

          if (Number.isFinite(registryData.pageOffsetLeft)) {
            const scaledLeft = applyScaledPosition(registryData.pageOffsetLeft);
            if (Number.isFinite(scaledLeft)) {
              updates.pageOffsetLeft = scaledLeft;
              note.dataset.pageOffsetLeft = String(scaledLeft);
            }
          }

          if (Object.keys(updates).length > 0) {
            updateNoteData(noteId, updates, { silent: true });
          }
        });

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

      function updateZoom(delta) {
        applyZoom(currentZoom + delta);
      }

      applyDocumentShift();

      zoomInBtn?.addEventListener('click', () => updateZoom(0.1));
      zoomOutBtn?.addEventListener('click', () => updateZoom(-0.1));
      shiftLeftBtn?.addEventListener('click', () => adjustDocumentShift(-DOCUMENT_SHIFT_STEP));
      shiftRightBtn?.addEventListener('click', () => adjustDocumentShift(DOCUMENT_SHIFT_STEP));

      /* === UTILIDADES === */
      function saveCurrentSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          savedSelection = selection.getRangeAt(0).cloneRange();
          return true;
        }
        return false;
      }

      function restoreSelection() {
        if (savedSelection) {
          if (!document.contains(savedSelection.startContainer) || !document.contains(savedSelection.endContainer)) {
            savedSelection = null;
            return false;
          }
          const selection = window.getSelection();
          selection.removeAllRanges();
          try {
            selection.addRange(savedSelection);
            return true;
          } catch (err) {
            savedSelection = null;
          }
        }
        return false;
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

      function insertNodeAtSelection(node) {
        const selection = ensureEditableSelection();
        if (!selection || !selection.rangeCount) return null;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(node);
        range.setStartAfter(node);
        range.setEndAfter(node);
        selection.removeAllRanges();
        selection.addRange(range);
        savedSelection = null;
        return node;
      }

      function insertHtmlAtSelection(html) {
        const selection = ensureEditableSelection();
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
        savedSelection = null;
        return nodes[0] || null;
      }

      function insertTextAtSelection(text) {
        if (typeof text !== 'string' || !text) {
          return null;
        }
        const selection = ensureEditableSelection();
        if (!selection || !selection.rangeCount) return null;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
        savedSelection = null;
        return textNode;
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

        const actionButtons = Array.from(tableMenu.querySelectorAll('[data-action]'));

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
          if (selectedTable && selectedTable !== table) {
            selectedTable.classList.remove('table-menu-selected');
            clearColumnHighlight();
          }
          selectedTable = table;
          if (cell) {
            selectedCell = cell;
          } else if (!selectedCell || !selectedTable.contains(selectedCell)) {
            selectedCell = selectedTable.querySelector('td,th');
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
          updateSpacingControls();
          updatePresetButtons();
        }

        function applyBorderStyles() {
          if (!selectedTable) return;
          const color = selectedTable.dataset.borderColor || '#dee2e6';
          const width = parseFloat(selectedTable.dataset.borderWidth || '1');
          const hideVertical = selectedTable.dataset.hideVerticalBorders === 'true';
          const hideHorizontal = selectedTable.dataset.hideHorizontalBorders === 'true';
          const cells = selectedTable.querySelectorAll('th,td');

          selectedTable.style.borderColor = color;
          selectedTable.style.borderWidth = width + 'px';
          selectedTable.style.borderStyle = 'solid';

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

          tableBorderColorButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.borderColor === color);
          });
          if (tableBorderColorCustom) {
            tableBorderColorCustom.value = color;
          }
          tableBorderWidthInput.value = width;
          tableBorderWidthValue.textContent = `${width}px`;
          toggleVerticalBorders.checked = hideVertical;
          toggleHorizontalBorders.checked = hideHorizontal;
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
        });

        tablePaddingYInput?.addEventListener('input', () => {
          if (!selectedTable) return;
          selectedTable.dataset.paddingY = tablePaddingYInput.value;
          tablePaddingYValue.textContent = `${tablePaddingYInput.value}px`;
          applySpacing();
        });

        tableMarginInput?.addEventListener('input', () => {
          if (!selectedTable) return;
          selectedTable.dataset.tableMargin = tableMarginInput.value;
          tableMarginValue.textContent = `${tableMarginInput.value}px`;
          applySpacing();
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
          const cell = event.target.closest('td,th') || table.querySelector('td,th');
          if (!cell) return;
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
          const cell = element.closest('td,th') || table.querySelector('td,th');
          if (!cell) return;
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
          const topicId = page.dataset.topicId || 'topic-' + Date.now();
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
          e.preventDefault();
          showImageToolbar(e.target);
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

      /* === NOTAS FLOTANTES === */
      function getFloatingNoteStyle(styleId) {
        return NOTE_STYLE_PRESETS.find(preset => preset.id === styleId) || NOTE_STYLE_PRESETS[0];
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
          const updated = updateNoteData(noteId, { style: note.dataset.style }, { silent: true });
          applyFloatingNoteBorderColor(note, updated?.borderColor || null, { persist: false });
        } else {
          applyFloatingNoteBorderColor(note, note.dataset.borderColor || null, { persist: false });
        }
        const menu = note.querySelector('.floating-note-style-menu');
        if (menu) {
          syncFloatingNoteStyleMenu(menu, note.dataset.style);
          const noteData = noteId ? notesRegistry.get(noteId) : null;
          if (noteData) {
            syncNoteOptionsMenu(menu, noteData);
          }
        }
      }

      function applyFloatingNoteBorderColor(note, color, { persist = true } = {}) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        const normalized = typeof color === 'string' ? color.trim() : '';
        if (normalized) {
          note.style.borderColor = normalized;
          note.dataset.borderColor = normalized;
        } else {
          note.style.borderColor = '';
          delete note.dataset.borderColor;
        }
        if (persist && noteId) {
          updateNoteData(noteId, { borderColor: normalized || null }, { silent: true });
        }
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

      function applyFloatingNoteTopicVisibility(note) {
        if (!note) return;
        const currentTopic = getCurrentTopicId();
        const noteTopicId = resolveNoteTopicId(note);
        let shouldShow = currentTopic && noteTopicId ? noteTopicId === currentTopic : false;

        if (shouldShow) {
          const viewportState = getActiveTopicViewportState();
          if (!viewportState) {
            shouldShow = false;
          } else {
            const storedOffset = Number.parseFloat(note.dataset.pageOffsetTop || '');
            const storedRelative = Number.parseFloat(note.dataset.relativeTop || '');
            let positionMatches = true;

            if (Number.isFinite(storedOffset)) {
              const delta = Math.abs(viewportState.viewportTopOffset - storedOffset);
              const tolerance = Math.max(180, viewportState.viewportHeight * 0.45);
              positionMatches = delta <= tolerance;
            } else if (Number.isFinite(storedRelative)) {
              const deltaRatio = Math.abs(viewportState.relativeCenter - storedRelative);
              const ratioTolerance = Math.max(
                0.18,
                (viewportState.viewportHeight / viewportState.pageHeight) * 1.25
              );
              positionMatches = deltaRatio <= ratioTolerance;
            }

            shouldShow = positionMatches;
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

      function refreshFloatingNotesTopicVisibility() {
        if (!floatingNotesLayer) return;
        floatingNotesLayer.querySelectorAll('.floating-note').forEach(applyFloatingNoteTopicVisibility);
      }

      function scheduleFloatingNotesViewportRefresh() {
        if (pendingFloatingNoteViewportRefresh) return;
        pendingFloatingNoteViewportRefresh = true;
        requestAnimationFrame(() => {
          pendingFloatingNoteViewportRefresh = false;
          invalidateActiveTopicViewportState();
          refreshFloatingNotesTopicVisibility();
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
        if (Number.isFinite(width) && width > 0) {
          note.style.width = `${Math.max(width, FLOATING_NOTE_MIN_WIDTH)}px`;
        } else {
          note.style.width = `${FLOATING_NOTE_DEFAULT_WIDTH}px`;
        }
        if (Number.isFinite(height) && height > 0) {
          note.style.height = `${Math.max(height, FLOATING_NOTE_MIN_HEIGHT)}px`;
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
        const maxTop = Math.max(0, layerHeight - noteHeight);
        const clampedLeft = Math.min(Math.max(Number.isFinite(left) ? left : 0, 0), maxLeft);
        const clampedTop = Math.min(Math.max(Number.isFinite(top) ? top : 0, 0), maxTop);
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
              delete label.dataset.initialTitleText;
            }
          }
          const category = note.querySelector('.note-category');
          if (category) {
            category.dataset.editableTitle = editable ? 'true' : 'false';
          }
        });
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

      function handleFloatingNotePointerMove(event) {
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
          return 'default';
        })();

        applyFloatingNoteStyle(note, resolvedStyleId);

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
        const incomingBorderColor = typeof data.borderColor === 'string' ? data.borderColor.trim() : '';
        const metaBorderColor = typeof metaSource.borderColor === 'string' ? metaSource.borderColor.trim() : '';
        const borderColor = incomingBorderColor || metaBorderColor || null;
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
          borderColor,
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
          currentPageIndex: incomingPageIndex
        });
        notesRegistry.set(noteId, noteData);
        applyFloatingNoteBorderColor(note, noteData.borderColor || null, { persist: false });

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

        const priorityBtn = document.createElement('button');
        priorityBtn.type = 'button';
        priorityBtn.className = 'note-priority';
        priorityBtn.title = 'Prioridad';

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

        actions.append(priorityBtn, menuBtn);
        header.append(categoryWrap, navigation, actions);

        const body = document.createElement('div');
        body.className = 'floating-note-body note-body';
        body.spellcheck = true;
        body.contentEditable = isEditMode ? 'true' : 'false';
        body.innerHTML = noteData.html || '';

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

        const footer = document.createElement('div');
        footer.className = 'note-footer';

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'note-tags';

        footer.append(tagsContainer);

        note.append(header, body, footer);
        floatingNotesLayer.appendChild(note);

        note._ui = {
          categoryIcon,
          categoryLabel,
          categoryWrap,
          priorityBtn,
          tagsContainer,
          optionsMenu,
          pageIndicator,
          prevPageBtn,
          nextPageBtn,
          addPageBtn,
          removePageBtn
        };

        priorityBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          cycleNotePriority(note);
        });

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
          const initialNormalized = (categoryLabel.dataset.initialTitleText || '').replace(/[\s\u00A0]+/g, ' ').trim();
          delete categoryLabel.dataset.initialTitleText;
          if (restoreOriginal) {
            syncNoteElementMeta(note, currentData);
            return;
          }
          const raw = categoryLabel.textContent || '';
          const normalized = raw.replace(/[\s\u00A0]+/g, ' ').trim();
          if (normalized !== raw) {
            categoryLabel.textContent = normalized;
          }
          if (normalized === initialNormalized) {
            syncNoteElementMeta(note, currentData);
            return;
          }
          const titleValue = normalized.length ? normalized : null;
          const updated = updateNoteData(noteId, { title: titleValue }, { silent: true });
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
          categoryLabel.dataset.initialTitleText = categoryLabel.textContent || '';
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
          const text = event.clipboardData?.getData('text/plain') || '';
          document.execCommand('insertText', false, text);
        });

        header.addEventListener('pointerdown', (event) => {
          if (event.button !== 0) return;
          if (event.detail > 1) return;
          if (event.target.closest('button') || event.target.closest('.floating-note-style-menu') || event.target.closest('.note-category')) return;
          closeFloatingNoteStyleMenu(optionsMenu);
          startFloatingNoteDrag(note, event);
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

          const label = document.createElement('span');
          label.className = 'note-style-label';
          label.textContent = preset.shortName || preset.name;

          optionBtn.append(preview, label);
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
        menu.appendChild(quickWrapper);

        menu.appendChild(Object.assign(document.createElement('div'), { className: 'note-menu-divider' }));

        const borderSection = document.createElement('div');
        borderSection.className = 'note-menu-section note-border-section';
        const borderTitle = document.createElement('div');
        borderTitle.className = 'note-menu-title';
        borderTitle.textContent = '⬒';
        borderSection.appendChild(borderTitle);

        const borderSwatches = document.createElement('div');
        borderSwatches.className = 'note-border-swatches';
        NOTE_BORDER_COLORS.forEach(color => {
          const swatchBtn = document.createElement('button');
          swatchBtn.type = 'button';
          swatchBtn.dataset.borderColor = color;
          swatchBtn.className = 'note-border-swatch';
          swatchBtn.title = `Borde ${color}`;
          swatchBtn.setAttribute('aria-label', `Aplicar borde ${color}`);
          swatchBtn.style.setProperty('--swatch-color', color);
          swatchBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            applyFloatingNoteBorderColor(note, color);
            syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
            closeFloatingNoteStyleMenu(menu);
          });
          borderSwatches.appendChild(swatchBtn);
        });
        borderSection.appendChild(borderSwatches);

        const borderResetBtn = document.createElement('button');
        borderResetBtn.type = 'button';
        borderResetBtn.dataset.action = 'reset-border';
        borderResetBtn.className = 'note-border-reset';
        borderResetBtn.textContent = 'Sin borde';
        borderResetBtn.setAttribute('aria-label', 'Quitar borde personalizado');
        borderResetBtn.addEventListener('click', (event) => {
          event.stopPropagation();
          applyFloatingNoteBorderColor(note, null);
          syncNoteOptionsMenu(menu, notesRegistry.get(note.dataset.noteId));
          closeFloatingNoteStyleMenu(menu);
        });
        borderSection.appendChild(borderResetBtn);
        menu.appendChild(borderSection);

        menu.appendChild(Object.assign(document.createElement('div'), { className: 'note-menu-divider' }));

        const actionsSection = document.createElement('div');
        actionsSection.className = 'note-menu-section note-menu-actions';
        const actionsTitle = document.createElement('div');
        actionsTitle.className = 'note-menu-title';
        actionsTitle.textContent = '⚙️';
        actionsSection.appendChild(actionsTitle);

        const inlineActions = document.createElement('div');
        inlineActions.className = 'note-menu-inline-actions';

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

        inlineActions.append(tagsBtn, reviewBtn);
        actionsSection.appendChild(inlineActions);

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
        syncFloatingNoteStyleMenu(menu, noteData.style || 'default');
        menu.querySelectorAll('button[data-category-id]').forEach(button => {
          const isActive = button.dataset.categoryId === noteData.category;
          button.classList.toggle('active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        menu.querySelectorAll('button[data-border-color]').forEach(button => {
          const isActive = (noteData.borderColor || null) === (button.dataset.borderColor || null);
          button.classList.toggle('active', isActive);
          button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        const borderResetBtn = menu.querySelector('button[data-action="reset-border"]');
        if (borderResetBtn) {
          borderResetBtn.disabled = !noteData.borderColor;
        }
        const reviewBtn = menu.querySelector('button[data-action="toggle-reviewed"]');
        if (reviewBtn) {
          reviewBtn.textContent = noteData.reviewed ? '↺ Reiniciar revisión' : '✓ Marcar revisada';
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

      function cycleNotePriority(note) {
        if (!note) return;
        const noteId = note.dataset.noteId;
        if (!noteId) return;
        const current = notesRegistry.get(noteId) || ensureNoteData(noteId);
        const currentIndex = NOTE_PRIORITY_SEQUENCE.indexOf(current.priority || DEFAULT_NOTE_PRIORITY);
        const nextPriority = NOTE_PRIORITY_SEQUENCE[(currentIndex + 1) % NOTE_PRIORITY_SEQUENCE.length];
        const updated = updateNoteData(noteId, { priority: nextPriority });
        syncNoteElementMeta(note, updated);
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
        applyFloatingNoteBorderColor(note, noteData.borderColor || null, { persist: false });
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

        const ui = note._ui || {};
        const categoryInfo = getNoteCategoryInfo(noteData.category);
        if (ui.categoryIcon) {
          ui.categoryIcon.textContent = categoryInfo.icon;
        }
        if (ui.categoryLabel) {
          const displayTitle = getNoteDisplayTitle(noteData.title, '');
          const hasCustomTitle = displayTitle.length > 0;
          if (ui.categoryLabel.dataset.editing !== 'true') {
            ui.categoryLabel.textContent = displayTitle;
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
        if (ui.priorityBtn) {
          const btn = ui.priorityBtn;
          btn.classList.remove('high', 'low');
          let symbol = '⬤';
          let title = 'Prioridad normal';
          if (noteData.priority === 'high') {
            symbol = '⭐';
            title = 'Prioridad alta';
            btn.classList.add('high');
          } else if (noteData.priority === 'low') {
            symbol = '⚪';
            title = 'Prioridad baja';
            btn.classList.add('low');
          }
          btn.textContent = symbol;
          btn.title = title;
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
              borderColor: noteData.borderColor,
              pages: Array.isArray(noteData.pages) ? noteData.pages : undefined,
              currentPageIndex: Number.isInteger(noteData.currentPageIndex) ? noteData.currentPageIndex : undefined,
              pageOffsetLeft: noteData.pageOffsetLeft,
              pageOffsetTop: noteData.pageOffsetTop,
              relativeLeft: noteData.relativeLeft,
              relativeTop: noteData.relativeTop
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
          return Array.from(notesRegistry.values()).filter(note => note && note.type === NOTE_TYPES.FLOATING);
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
      window.addEventListener('resize', () => {
        clampAllFloatingNotes();
        scheduleFloatingNotesViewportRefresh();
      });
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
      function createColorPalette(paletteId, colors, isHighlight) {
        const palette = document.getElementById(paletteId);
        if (!palette) return;

        palette.innerHTML = '';

        colors.forEach(color => {
          const swatch = document.createElement('div');
          swatch.className = 'color-swatch';
          swatch.style.backgroundColor = color;
          swatch.title = color;
          swatch.addEventListener('click', (e) => {
            e.stopPropagation();
            applyColor(color, isHighlight);
            palette.classList.remove('show');
          });
          palette.appendChild(swatch);
        });
        
        const customSwatch = document.createElement('input');
        customSwatch.type = 'color';
        customSwatch.className = 'color-swatch';
        customSwatch.title = 'Color personalizado';
        customSwatch.style.border = '2px dashed #495057';
        customSwatch.addEventListener('change', (e) => {
          e.stopPropagation();
          applyColor(e.target.value, isHighlight);
          palette.classList.remove('show');
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

      function applyColor(color, isHighlight) {
        if (!restoreSelection()) {
          alert('Por favor, selecciona el texto primero');
          return;
        }

        const selection = window.getSelection();
        if (!selection.rangeCount || selection.isCollapsed) {
          alert('Por favor, selecciona el texto primero');
          savedSelection = null;
          return;
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
          applied = document.execCommand(command, false, color);
        }

        if (styleWithCss) {
          document.execCommand('styleWithCSS', false, false);
        }

        if (!applied) {
          const range = selection.getRangeAt(0);
          const wrapper = document.createElement('span');
          if (isHighlight) {
            wrapper.style.backgroundColor = color;
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
        }

        selection.removeAllRanges();
        savedSelection = null;
      }

      createColorPalette('highlightPalette', highlightColors, true);
      createColorPalette('textColorPalette', textColors, false);

      document.getElementById('highlightBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (!saveCurrentSelection()) {
          alert('Por favor, selecciona el texto que deseas destacar');
          return;
        }
        
        const btn = e.currentTarget;
        const btnRect = btn.getBoundingClientRect();
        
        highlightPalette.style.left = btnRect.left + 'px';
        highlightPalette.style.top = (btnRect.bottom + 5) + 'px';
        
        textColorPalette.classList.remove('show');
        highlightPalette.classList.add('show');
      });

      document.getElementById('textColorBtn')?.addEventListener('click', (e) => {
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
            savedSelection = null;
          }
        }
        if (!e.target.closest('#textColorBtn') && !e.target.closest('#textColorPalette')) {
          const wasOpen = textColorPalette.classList.contains('show');
          textColorPalette.classList.remove('show');
          if (wasOpen) {
            savedSelection = null;
          }
        }
      });

      /* === PLANTILLAS === */
      insertTemplateBtn?.addEventListener('pointerdown', () => {
        saveCurrentSelection();
      });

      insertTemplateBtn?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          saveCurrentSelection();
        }
      });

      insertHtmlBtn?.addEventListener('pointerdown', () => {
        saveCurrentSelection();
      });

      insertHtmlBtn?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          saveCurrentSelection();
        }
      });

      insertTableBtn?.addEventListener('pointerdown', () => {
        saveCurrentSelection();
      });

      insertTableBtn?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          saveCurrentSelection();
        }
      });

      insertCollapseCardBtn?.addEventListener('pointerdown', () => {
        saveCurrentSelection();
      });

      insertCollapseCardBtn?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          saveCurrentSelection();
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
            const insertedBlock = insertNodeAtSelection(block);
            if (!insertedBlock) {
              alert('Selecciona un área editable antes de insertar una plantilla.');
              return;
            }

            showTemplateToolbar(insertedBlock);
            insertedBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            hideModal();
          });
          grid?.appendChild(card);
        });
      });

      insertCollapseCardBtn?.addEventListener('click', () => {
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
          if (section.collapsed) sectionDiv.classList.add('collapsed');
          if (sectionMatch) sectionDiv.classList.add('matches-filter');

          const sectionHeader = document.createElement('div');
          sectionHeader.className = 'section-header';

          const toggle = document.createElement('span');
          toggle.className = 'section-toggle';
          toggle.textContent = '▼';
          toggle.addEventListener('click', () => {
            section.collapsed = !section.collapsed;
            sectionDiv.classList.toggle('collapsed');
          });

          const nameSpan = document.createElement('span');
          nameSpan.className = 'section-name';
          nameSpan.textContent = section.nombre;
          nameSpan.addEventListener('click', () => {
            section.collapsed = !section.collapsed;
            sectionDiv.classList.toggle('collapsed');
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

            if (hasFilter) {
              const topicMatchesFilter = normalizeForSearch(tema.titulo || '').includes(panelFilterNormalized);
              li.classList.toggle('matches-filter', topicMatchesFilter);
            }

            li.appendChild(numSpan);
            li.appendChild(btnMain);
            li.appendChild(titleSpan);
            li.appendChild(noteIndicator);
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
        refreshTopicNoteIndicators();
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
        window.print();
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

      const io = new IntersectionObserver((entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const tid = visible.target.dataset.topicId || '';
        sectionsContainer.querySelectorAll('li').forEach(li =>
          li.classList.toggle('active', li.dataset.topicId === tid)
        );
        setActivePage(visible.target);
      }, { root: null, threshold: [0.5, 0.75, 1] });

      pages.forEach(p => io.observe(p));

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
          saveHtmlBtn.style.display = 'inline-block';
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
          saveHtmlBtn.style.display = 'none';
          hideTemplateToolbar();
          hideImageToolbar();
          tableMenuAPI?.cancelResize();
          tableMenuAPI?.hide();
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
        const delta = command === 'indent' ? 10 : -10;
        applyIndentSnapshot(targets, delta);
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
      
      document.getElementById('boldBtn')?.addEventListener('click', () => execCmd('bold'));
      document.getElementById('italicBtn')?.addEventListener('click', () => execCmd('italic'));
      document.getElementById('underlineBtn')?.addEventListener('click', () => execCmd('underline'));
      document.getElementById('removeFormatBtn')?.addEventListener('click', () => execCmd('removeFormat'));
      document.getElementById('insertUlBtn')?.addEventListener('click', () => execCmd('insertUnorderedList'));
      document.getElementById('insertOlBtn')?.addEventListener('click', () => execCmd('insertOrderedList'));
      document.getElementById('indentBtn')?.addEventListener('click', () => handleIndentCommand('indent'));
      document.getElementById('outdentBtn')?.addEventListener('click', () => handleIndentCommand('outdent'));

      insertIconBtn?.addEventListener('pointerdown', () => {
        saveCurrentSelection();
      });

      insertIconBtn?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        saveCurrentSelection();
        if (iconPicker.classList.contains('show') && iconPickerAnchor === insertIconBtn) {
          hideIconPicker();
        } else {
          showIconPicker(insertIconBtn);
        }
      });

      insertIconBtn?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          saveCurrentSelection();
          if (iconPicker.classList.contains('show') && iconPickerAnchor === insertIconBtn) {
            hideIconPicker();
          } else {
            showIconPicker(insertIconBtn);
          }
        }
      });

      document.addEventListener('pointerdown', (event) => {
        if (!iconPicker.classList.contains('show')) {
          return;
        }
        if (iconPicker.contains(event.target)) {
          return;
        }
        if (event.target === insertIconBtn) {
          return;
        }
        hideIconPicker();
      });

      window.addEventListener('resize', hideIconPicker);
      document.addEventListener('scroll', hideIconPicker, true);

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
              const insertedNode = insertHtmlAtSelection(htmlCode);
              if (insertedNode) {
                hideModal();
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

        const insertedNode = insertHtmlAtSelection(tableHTML);
        if (insertedNode) {
          hideModal();
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
          const newHtml = html.replace(regex, (match) => {
            count++;
            return replaceText;
          });
          currentPage.innerHTML = newHtml;
        }

        status.textContent = `Se reemplazaron ${count} coincidencia(s)`;
      });
    }, 100);
  });

  /* === DUPLICAR TEMA === */
  document.getElementById('duplicateTopicBtn')?.addEventListener('click', () => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;
    duplicateTopicPage(currentPage);
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
          noteExport.reviewed = !!noteData.reviewed;
          noteExport.reviewCount = Number(noteData.reviewCount) || 0;
          noteExport.lastReviewed = noteData.lastReviewed || null;
          noteExport.borderColor = noteData.borderColor || null;
          noteExport.topicId = noteData.topicId || null;
          noteExport.sectionId = noteData.sectionId || null;
          noteExport.type = noteData.type || NOTE_TYPES.FLOATING;
          noteExport.anchorId = noteData.anchorId || null;
          noteExport.linkedTo = noteData.linkedTo || null;
          noteExport.createdAt = noteData.createdAt || null;
          noteExport.updatedAt = noteData.updatedAt || null;
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
          noteExport.meta = { ...noteData, element: undefined };
          delete noteExport.meta.element;
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

  function saveToLocalCache(showFeedback = true) {
    try {
      if (!window.localStorage) {
        throw new Error('Almacenamiento local no disponible');
      }

      const snapshot = {
        version: 1,
        savedAt: new Date().toISOString(),
        zoom: isMagicViewActive ? lastRegularZoom : currentZoom,
        documentShift: documentHorizontalShift,
        data: collectDocumentData()
      };

      window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(snapshot));

      if (showFeedback && cacheSaveBtn) {
        const oldHtml = cacheSaveBtn.innerHTML;
        cacheSaveBtn.innerHTML = '<span>✅</span> <span class="topbar-btn-label">Guardado</span>';
        setTimeout(() => {
          cacheSaveBtn.innerHTML = oldHtml;
        }, 2000);
      }

      return true;
    } catch (error) {
      console.error('Error al guardar en caché:', error);
      if (showFeedback) {
        alert('No se pudo guardar en caché: ' + error.message);
      }
      return false;
    }
  }

  function restoreFromLocalCache() {
    try {
      if (!window.localStorage) {
        return false;
      }

      const raw = window.localStorage.getItem(CACHE_STORAGE_KEY);
      if (!raw) {
        return false;
      }

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

  cacheSaveBtn?.addEventListener('click', () => saveToLocalCache(true));

  window.addEventListener('beforeunload', () => saveToLocalCache(false));

  const restoredFromCache = restoreFromLocalCache();
  if (!restoredFromCache) {
    buildSectionsPanel();
    applyZoom(currentZoom);
  }

}
