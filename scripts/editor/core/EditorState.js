/**
 * EditorState - Gestión centralizada del estado del editor
 *
 * Este módulo maneja todo el estado global del editor de forma centralizada,
 * permitiendo mejor control, debugging y gestión de cambios.
 */

export class EditorState {
  constructor() {
    // Estado de Modos
    this.isEditMode = false;
    this.isPanelEditMode = false;
    this.isReadingMode = false;
    this.isMagicViewActive = false;

    // Páginas y Secciones
    this.pages = [];
    this.globalTopicCounter = 1;
    this.allSectionsExpanded = true;
    this.visibleSectionId = null;

    // Selección y Edición
    this.selectedImage = null;
    this.selectedTemplateBlock = null;
    this.savedSelection = null;
    this.pendingToolbarInsertionSnapshot = null;

    // Zoom y Viewport
    this.currentZoom = 1;
    this.lastRegularZoom = 1;
    this.zoomBeforeMagic = null;
    this.documentHorizontalShift = 0;

    // Magic View
    this.activeMagicSource = null;
    this.activeMagicWrapper = null;
    this.activeMagicPage = null;

    // Notas Flotantes
    this.floatingNotesHidden = false;
    this.floatingNoteZIndex = 10;
    this.floatingNoteCreationOffset = 0;
    this.activeFloatingNoteStyleMenu = null;
    this.floatingNoteResizeObserver = null;
    this.floatingNotesViewportRelaxedMatching = false;
    this.pendingFloatingNotesViewportSync = false;
    this.pendingFloatingNoteViewportRefresh = false;
    this.pendingTopicNoteIndicatorUpdate = false;
    this.cachedActiveTopicViewportState = null;

    // Estados de Drag/Resize
    this.floatingNoteDragState = {
      note: null,
      pointerId: null,
      offsetX: 0,
      offsetY: 0
    };

    this.floatingNoteResizeState = {
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

    // Crop State
    this.cropState = {
      image: null,
      isSelecting: false,
      startX: 0,
      startY: 0,
      currentRect: null,
      scaleX: 1,
      scaleY: 1
    };

    // Spacing Tool
    this.spacingToolState = {
      isOpen: false,
      targets: [],
      originalStyles: new Map()
    };
    this.spacingToolSelectionSync = null;

    // Image Viewer
    this.imageViewerState = null; // Se inicializará con getDefaultImageViewerState()
    this.imageViewerPreviousShift = null;
    this.imageViewerActiveShift = null;
    this.imageViewerNotesSaveTimer = null;
    this.imageViewerZoom = 1;
    this.imageViewerPreviewSource = null;
    this.imageViewerCurrentToken = null;
    this.imageViewerContextExternalImages = [];
    this.imageViewerRuntimeSelectionId = null;
    this.imageViewerContextKey = 'global'; // IMAGE_VIEWER_DEFAULT_CONTEXT_KEY

    // Content Visibility
    this.mainContentHidden = false;

    // Formatting
    this.boldInfiniteMode = false;
    this.boldInfiniteApplying = false;

    // Tables
    this.tableMenuAPI = null;
    this.autoTableResizeController = null;
    this.autoTableResizeTable = null;

    // Cache
    this.cachedToolbarHeight = 0;
    this.cachedStylesheetForExport = null;
    this.extendedCacheDbPromise = null;
    this.usingExtendedCache = false;

    // Misc
    this.iconPickerRebindTimer = null;

    // Listeners para cambios de estado
    this.listeners = new Map();
  }

  /**
   * Actualiza el estado y notifica a los listeners
   * @param {Object} updates - Objeto con las propiedades a actualizar
   */
  setState(updates) {
    const changedKeys = [];

    for (const [key, value] of Object.entries(updates)) {
      if (this[key] !== value) {
        this[key] = value;
        changedKeys.push(key);
      }
    }

    // Notificar a los listeners sobre los cambios
    changedKeys.forEach(key => this.notifyListeners(key));
  }

  /**
   * Suscribirse a cambios en una propiedad específica
   * @param {string} key - Nombre de la propiedad
   * @param {Function} callback - Función a ejecutar cuando cambie
   * @returns {Function} Función para cancelar la suscripción
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }

    this.listeners.get(key).push(callback);

    // Retornar función de unsubscribe
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notificar a los listeners de una propiedad
   * @param {string} key - Nombre de la propiedad que cambió
   */
  notifyListeners(key) {
    const callbacks = this.listeners.get(key) || [];
    callbacks.forEach(cb => cb(this[key]));
  }

  /**
   * Obtener el estado completo (útil para debugging)
   * @returns {Object} Copia del estado actual
   */
  getState() {
    const state = {};
    for (const key in this) {
      if (this.hasOwnProperty(key) && key !== 'listeners') {
        state[key] = this[key];
      }
    }
    return state;
  }

  /**
   * Resetear el drag state de notas flotantes
   */
  resetFloatingNoteDragState() {
    this.floatingNoteDragState = {
      note: null,
      pointerId: null,
      offsetX: 0,
      offsetY: 0
    };
  }

  /**
   * Resetear el resize state de notas flotantes
   */
  resetFloatingNoteResizeState() {
    this.floatingNoteResizeState = {
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
  }

  /**
   * Resetear el crop state
   */
  resetCropState() {
    this.cropState = {
      image: null,
      isSelecting: false,
      startX: 0,
      startY: 0,
      currentRect: null,
      scaleX: 1,
      scaleY: 1
    };
  }
}

// Exportar una instancia singleton
export const editorState = new EditorState();
