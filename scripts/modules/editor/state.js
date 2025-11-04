import { IMAGE_VIEWER_DEFAULT_CONTEXT_KEY } from './editorConfig.js';
import { getDefaultImageViewerState } from './imageViewerState.js';

export function createEditorState() {
  return {
    editor: {
      isEditMode: false,
      isPanelEditMode: false,
      isReadingMode: false,
      pages: [...document.querySelectorAll('.page')],
      globalTopicCounter: 1,
      selectedTemplateBlock: null,
      allSectionsExpanded: true,
      savedSelection: null,
      pendingToolbarInsertionSnapshot: null,
      tableMenuAPI: null,
      cachedToolbarHeight: 0,
      iconPickerRebindTimer: null
    },
    image: {
      selectedImage: null,
      currentZoom: 1,
      lastRegularZoom: 1,
      zoomBeforeMagic: null,
      isMagicViewActive: false,
      activeMagicSource: null,
      activeMagicWrapper: null,
      activeMagicPage: null,
      crop: {
        image: null,
        isSelecting: false,
        startX: 0,
        startY: 0,
        currentRect: null,
        scaleX: 1,
        scaleY: 1
      },
      viewer: {
        state: getDefaultImageViewerState(),
        previousShift: null,
        activeShift: null,
        notesSaveTimer: null,
        zoom: 1,
        previewSource: null,
        currentToken: null,
        contextExternalImages: [],
        runtimeSelectionId: null,
        contextKey: IMAGE_VIEWER_DEFAULT_CONTEXT_KEY
      }
    },
    floatingNotes: {
      hidden: false,
      mainContentHidden: false,
      boldInfiniteMode: false,
      boldInfiniteApplying: false,
      autoTableResizeController: null,
      autoTableResizeTable: null,
      spacingTool: {
        isOpen: false,
        targets: [],
        originalStyles: new Map()
      },
      spacingToolSelectionSync: null,
      zIndex: 10,
      creationOffset: 0,
      dragState: { note: null, pointerId: null, offsetX: 0, offsetY: 0 },
      resizeState: {
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
      },
      activeStyleMenu: null,
      resizeObserver: null,
      viewportRelaxedMatching: false,
      pendingViewportSync: false,
      pendingViewportRefresh: false,
      pendingTopicIndicatorUpdate: false,
      cachedActiveTopicViewportState: null
    },
    document: {
      horizontalShift: 0
    },
    cache: {
      usingExtendedCache: false
    },
    panel: {
      sections: [],
      sectionThemes: new Map(),
      currentSectionId: '',
      currentPageRef: null,
      visibleSectionId: '',
      filterTerm: '',
      filterNormalized: ''
    }
  };
}
