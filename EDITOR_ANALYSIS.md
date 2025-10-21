# ANÁLISIS EXHAUSTIVO: scripts/editor.js (14,822 líneas)

## 1. ESTRUCTURA GENERAL DEL ARCHIVO

### 1.1 Contexto de Inicialización
- **Punto de entrada**: `export async function initializeEditor()`
- **Scope**: Todo el código está encapsulado dentro de esta función async
- **Importaciones externas**: 
  - `NoteRegistry` y constantes de notas (modules/notes/)
  - Utilidades de notas (noteUtils.js, noteConstants.js)
  - Generador de IDs únicos

### 1.2 Características Principales
1. **Sistema de notas flotantes** - Gestión completa de notas independientes
2. **Editor visual** con drag & drop
3. **Visor de imágenes** con múltiples contextos
4. **Editor de tablas** con menú completo
5. **Sistema de temas** (8 temas disponibles)
6. **Gestión de secciones y temas** (topics)
7. **Magic View** - Vista especial de temas
8. **Sistema de caché** - IndexedDB + localStorage
9. **Exportación de datos** - HTML, Markdown, JSON
10. **Herramientas de formato** - Colores, estilos, resaltado

---

## 2. VARIABLES DE ESTADO GLOBAL (52 variables principales)

### 2.1 Estados de Modo
```javascript
- isEditMode: false                    // Modo edición activo
- isPanelEditMode: false               // Modo edición de panel
- isReadingMode: false                 // Modo lectura
- isMagicViewActive: false             // Magic view activo
- floatingNotesHidden: false           // Notas flotantes ocultas
- mainContentHidden: false             // Contenido principal oculto
- boldInfiniteMode: false              // Modo "bold infinite"
- boldInfiniteApplying: false          // Aplicando bold infinite
```

### 2.2 Estados de Interacción
```javascript
- pages: []                            // Todas las páginas/temas
- currentPageRef: null                 // Página actual
- currentSectionId: ''                 // Sección actual
- visibleSectionId: ''                 // Sección visible
- globalTopicCounter: 1                // Contador de temas
- selectedImage: null                  // Imagen seleccionada
- selectedTemplateBlock: null          // Bloque template seleccionado
- activeMagicSource: null              // Fuente de magic view
- activeTopbarDropdown: null           // Dropdown del topbar activo
```

### 2.3 Estados de Zoom y Posición
```javascript
- currentZoom: 1                       // Nivel de zoom actual
- lastRegularZoom: 1                   // Último zoom regular
- zoomBeforeMagic: null                // Zoom antes de magic view
- documentHorizontalShift: 0           // Desplazamiento horizontal
- floatingNoteZIndex: 10               // Z-index de notas flotantes
- floatingNoteCreationOffset: 0        // Offset de creación de notas
```

### 2.4 Estados de Selección y Clipboard
```javascript
- savedSelection: null                 // Selección guardada
- pendingToolbarInsertionSnapshot: null // Snapshot de inserción
- iconPickerRebindTimer: null          // Timer del icon picker
- tableMenuAPI: null                   // API del menú de tabla
- cachedToolbarHeight: 0               // Altura toolbar cacheada
```

### 2.5 Estados de Image Viewer
```javascript
- imageViewerState: {...}              // Estado completo del visor
- imageViewerZoom: 1
- imageViewerContextExternalImages: []
- imageViewerContextKey: 'global'
- imageViewerRuntimeSelectionId: null
- imageViewerNotesSaveTimer: null
- imageViewerCurrentToken: null
```

### 2.6 Estados de Notas Flotantes
```javascript
- floatingNoteDragState: { note, pointerId, offsetX, offsetY }
- floatingNoteResizeState: { note, pointerId, orientation, edge, corner, startX... }
- activeFloatingNoteStyleMenu: null
- floatingNoteResizeObserver: null
- floatingNotesViewportRelaxedMatching: false
- pendingFloatingNotesViewportSync: false
- pendingFloatingNoteViewportRefresh: false
- cachedActiveTopicViewportState: null
```

### 2.7 Estados de Espaciado y Tabla
```javascript
- spacingToolState: { isOpen, targets[], originalStyles }
- spacingToolSelectionSync: null
- autoTableResizeController: null
- autoTableResizeTable: null
```

### 2.8 Estados de Panel y Filtrado
```javascript
- panelFilterTerm: ''
- panelFilterNormalized: ''
- sections: []
- sectionThemes: new Map()
- currentTopbarTheme: AVAILABLE_TOPBAR_THEMES[0]
```

### 2.9 Estados de Caché
```javascript
- cachedStylesheetForExport: null
- extendedCacheDbPromise: null
- usingExtendedCache: false
- sections: []
```

---

## 3. CONSTANTES (50+ definidas)

### 3.1 Constantes de Imágenes
```javascript
- IMAGE_MIN_WIDTH = 60
- IMAGE_MAX_WIDTH = 1600
- IMAGE_RESIZE_STEP = 0.1
- IMAGE_VIEWER_DEFAULT_CONTEXT_KEY = 'global'
- IMAGE_VIEWER_ZOOM_MIN = 0.25
- IMAGE_VIEWER_ZOOM_MAX = 4
- IMAGE_VIEWER_ZOOM_STEP = 0.25
- IMAGE_VIEWER_STORAGE_KEY = 'emi2025-image-viewer'
```

### 3.2 Constantes de Notas Flotantes
```javascript
- FLOATING_NOTE_BORDER_DEFAULT_COLOR = '#94a3b8'
- FLOATING_NOTE_BORDER_DEFAULT_WIDTH = 1
- FLOATING_NOTE_BORDER_COLORS = [...11 colores...]
- FLOATING_NOTE_DEFAULT_WIDTH = 240
- FLOATING_NOTE_MIN_WIDTH = 0
- FLOATING_NOTE_MIN_HEIGHT = 0
- NOTE_STYLE_PRESETS = [...19 estilos...]
```

### 3.3 Constantes de Tema
```javascript
- AVAILABLE_THEMES = ['theme-blue', 'theme-green', 'theme-purple', ...]
- DEFAULT_THEME = 'theme-blue'
- AVAILABLE_TOPBAR_THEMES = [...6 temas topbar...]
- TOPBAR_THEME_STORAGE_KEY = 'emi2025-topbar-theme'
```

### 3.4 Constantes de Documento
```javascript
- DOCUMENT_SHIFT_STEP = 80
- DOCUMENT_SHIFT_MIN = -1500
- DOCUMENT_SHIFT_MAX = 1500
- CACHE_STORAGE_KEY = 'emi2025-editor-cache-v1'
- EXTENDED_CACHE_DB_NAME = 'emi2025-editor-cache'
- EXTENDED_CACHE_STORE_NAME = 'snapshots'
```

### 3.5 Constantes Importadas
```javascript
- NOTE_TYPES (FLOATING, SUPER, etc.)
- NOTE_CATEGORIES (de NoteRegistry)
- NOTE_PRIORITY_SEQUENCE
- DEFAULT_NOTE_PRIORITY
- SUPER_NOTE_DEFAULT_TAB_COLOR
- SUPER_NOTE_TAB_TITLE_MAX_LENGTH
- SUPER_NOTE_PRESET_COLORS
```

### 3.6 Iconos y Símbolos
```javascript
- NOTE_ICON_SYMBOLS = ['📌', '🔑', '⭐', ...]
- ICON_FEATURE_ENABLED = true
```

---

## 4. REFERENCIAS A ELEMENTOS DOM (60+ elementos)

### 4.1 Panel y Navegación
```javascript
- panel                        // #topic-panel
- sectionsContainer            // #sectionsContainer
- panelTopicCount              // #panelTopicCount
- panelSearchInput             // #panelSearchInput
- panelSearchClear             // #panelSearchClear
- plusBtn                      // .topbar-plus
- panelClose                   // .panel-close (nodelist)
- panelBackdrop                // #panel-backdrop
```

### 4.2 Magic View
```javascript
- magic                        // #magic-view
- specialtySpan                // #specialtyTitle
- magicBackFloating            // #magicBackFloating
```

### 4.3 Modal y Overlays
```javascript
- modalOverlay                 // #modalOverlay
- modalContent                 // #modalContent
```

### 4.4 Notas Flotantes
```javascript
- floatingNotesLayer           // #floatingNotesLayer
- addFloatingNoteBtn           // #addFloatingNoteBtn
- toggleNotesBtn               // #toggleNotesBtn
- toggleMainContentBtn         // #toggleMainContentBtn
- printFloatingNotesViewBtn    // #printFloatingNotesViewBtn
- notesViewBtn                 // #notesViewBtn
```

### 4.5 Topbar
```javascript
- topbar                       // .topbar
- topbarToolsToggle            // #topbarToolsToggle
- topbarToolsDropdown          // #topbarToolsDropdown
- topbarThemeToggle            // #topbarThemeToggle
- topbarThemeDropdown          // #topbarThemeDropdown
- topbarThemeButtons           // [data-theme] elements
```

### 4.6 Botones de Control
```javascript
- editBtn                      // #editBtn
- saveHtmlBtn                  // #saveHtmlBtn
- loadHtmlBtn                  // #loadHtmlBtn
- loadHtmlInput                // #loadHtmlInput
- editToolbar                  // #editToolbar
- statsBtn                     // #statsBtn
- clearAllBtn                  // #clearAllBtn
- exportDataBtn                // #exportDataBtn
- importDataBtn                // #importDataBtn
- importDataInput              // #importDataInput
- cacheSaveBtn                 // #cacheSaveBtn
```

### 4.7 Imágenes
```javascript
- imageToolbar                 // #imageToolbar
- imageAltInput                // #imageAltInput
- applyAltBtn                  // #applyAltBtn
- imageFrameToggle             // #imageFrameToggle
- wrapFigureBtn                // #wrapFigureBtn
- unwrapFigureBtn              // #unwrapFigureBtn
- cropImageBtn                 // #cropImageBtn
- imageWidthIncreaseBtn        // #imageWidthIncrease
- imageWidthDecreaseBtn        // #imageWidthDecrease
- widthDisplay                 // #widthDisplay
```

### 4.8 Modal de Crop
```javascript
- imageCropModal               // #imageCropModal
- imageCropStage               // #imageCropStage
- imageCropPreview             // #imageCropPreview
- imageCropSelection           // #imageCropSelection
- imageCropApplyBtn            // #imageCropApplyBtn
- imageCropCancelBtn           // #imageCropCancelBtn
- imageCropCloseBtn            // #imageCropCloseBtn
- imageCropSizeLabel           // #imageCropSizeLabel
```

### 4.9 Visor de Imágenes
```javascript
- imageViewerPanel             // #imageViewerPanel
- imageViewerBtn               // #imageViewerBtn
- imageViewerAddImageBtn       // #imageViewerAddImageBtn
- imageViewerDownloadBtn       // #imageViewerDownloadBtn
- imageViewerCloseBtn          // #imageViewerCloseBtn
- imageViewerUploadInput       // #imageViewerUploadInput
- imageViewerActiveImage       // #imageViewerActiveImage
- imageViewerStageSurface      // #imageViewerStageSurface
- imageViewerGallery           // #imageViewerGallery
- imageViewerPrevBtn / NextBtn / ZoomInBtn / ZoomOutBtn
```

### 4.10 Toolbar de Template
```javascript
- templateToolbar              // #templateToolbar
- templateBgColorInput         // #templateBgColor
- templateTextColorInput       // #templateTextColor
- templateBorderColorInput     // #templateBorderColor
- templateAccentColorInput     // #templateAccentColor
- templateFontSizeSlider       // #templateFontSize
- templateMarginTopSlider      // #templateMarginTop
- templateBorderWidthSlider    // #templateBorderWidth
```

### 4.11 Menú de Tabla
```javascript
- tableMenu                    // (elemento del menú)
- tableBorderColorButtons      // (botones de color)
- tableBorderColorCustom       // (input custom)
- tableBorderWidthInput        // (input width)
- toggleVerticalBorders        // (checkbox)
- toggleHorizontalBorders      // (checkbox)
- tableOuterBorderToggle       // (checkbox)
```

---

## 5. FUNCIONES PRINCIPALES POR CATEGORÍA

### 5.1 Inicialización y Setup (14 funciones)
```javascript
export async function initializeEditor()
function initializeSections()
function setupMagicIcons()
function buildSectionsPanel()
function buildIconPicker()
function mountIconPicker(picker)
function ensureIconPicker()
function initializeTableMenu()
function initializeCollapseCards(root)
function initPalette(container, colors, onSelect)
function getDefaultImageViewerState()
function getDefaultImageViewerContext()
function enableHtmlPaste()
function measureToolbarHeight()
```

### 5.2 Gestión de Caché y Persistencia (12 funciones)
```javascript
function isQuotaExceededError(error)
function openExtendedCacheDb()
async function writeExtendedCacheValue(value)
async function readExtendedCacheValue()
async function clearExtendedCacheValue()
async function getStylesheetTextForExport()
function loadImageViewerState()
function persistImageViewerState()
function setImageViewerState(updater, options)
function saveToLocalCache(explicit)
async function restoreFromLocalCache()
function saveExtendedCacheState()
```

### 5.3 Notas Flotantes - Crear/Eliminar (6 funciones)
```javascript
function createFloatingNote(data)
function deleteFloatingNote(note)
function duplicateFloatingNote(note)
function clearFloatingNotes()
function clampAllFloatingNotes()
function restoreFloatingNotes(notes, hidden)
```

### 5.4 Notas Flotantes - Estilo y Apariencia (15 funciones)
```javascript
function getFloatingNoteStyle(styleId)
function applyFloatingNoteStyle(note, styleId)
function applyFloatingNoteBorderState(note, options, {persist})
function applyFloatingNoteSize(note, width, height)
function resetFloatingNoteSize(note)
function updateFloatingNoteSizeDataset(note)
function applyFloatingNoteTextNeutralState(note, keepNeutral, {persist})
function toggleFloatingNoteNeutralText(note)
function applyNoteHeaderCompactState(note, compact, {persist})
function applyNoteUltraCompactState(note, ultraCompact, {persist})
function applyNoteBehindState(note, behind, {persist})
function applyNoteHoverAnimationState(note, enabled, {persist})
function toggleNoteHoverAnimation(note)
function resolveFloatingNoteBorderBase(note)
function clearNoteStyleClasses(target)
```

### 5.5 Notas Flotantes - Posicionamiento y Drag (10 funciones)
```javascript
function positionFloatingNote(note, left, top, options)
function clampNotePosition(note, left, top)
function bringNoteToFront(note)
function startFloatingNoteDrag(note, event)
function handleFloatingNotePointerMove(event)
function endFloatingNoteDrag(event)
function startFloatingNoteHorizontalResize(note, edge, event)
function startFloatingNoteCornerResize(note, corner, event)
function tryBeginFloatingNoteDrag(note, event, menu)
function shouldUseFloatingNoteDragHandle(note, event)
```

### 5.6 Notas Flotantes - Datos y Metadatos (15 funciones)
```javascript
function ensureNoteData(noteId, overrides)
function updateNoteData(noteId, updates, {silent})
function removeNoteData(noteId)
function isFloatingFamilyNote(note)
function setNoteCategory(note, categoryId)
function setNoteTags(note, tags)
function promptNoteTags(note)
function setNotePriority(note, priority)
function cycleNotePriority(note)
function toggleNoteReviewed(note, forceValue)
function setNoteCustomIcon(note, symbol)
function beginNoteLinking(note)
function attachExistingAnchor(note, anchorId)
function clearNoteAnchor(note)
function removeNoteAnchor(noteId)
```

### 5.7 Notas Flotantes - Visibilidad y Control (9 funciones)
```javascript
function setFloatingNotesVisibility(hidden)
function refreshToggleNotesButton()
function setFloatingNotesEditable(editable)
function updateFloatingNotesPrintControl()
function printVisibleFloatingNotes()
function focusFloatingNoteById(noteId)
function resolveFloatingNoteInitialPosition(noteData, fallbackLeft, fallbackTop)
function scheduleFloatingNotesViewportRefresh(options)
function requestFloatingNotesViewportSync()
```

### 5.8 Notas Flotantes - Super Notes (15 funciones)
```javascript
function updateSuperNoteBody(note, noteData)
function getSuperNoteTabFallbackTitle(index)
function getSuperNoteTabDisplayTitle(tab, index)
function renderSuperNoteUI(note, noteData)
function activateSuperNoteTab(note, tabId)
function addSuperNoteTab(note)
function removeSuperNoteTab(note, tabId)
function openSuperNoteTabColorPicker(note, tabId)
function applySuperNoteTabColor(note, tabId, color)
function toggleSuperNoteMode(note)
function hideSuperNoteColorPanel(note, {clearTarget})
function showSuperNoteColorPanel(note)
function syncSuperNoteColorPanel(note, noteData)
function startSuperNoteTabInlineEdit(note, tabId)
function finishSuperNoteTabInlineEdit(note, tabId, {cancel})
```

### 5.9 Notas Flotantes - Topic Notes Popover (10 funciones)
```javascript
function isTopicNotesPopoverOpen()
function closeTopicNotesPopover()
function openTopicNotesPopover(page, anchor)
function toggleTopicNotesPopover(page, anchor)
function positionTopicNotesPopover(anchor)
function renderTopicNotesPopover(topicId)
function getTopicNotesForTopic(topicId)
function collectTopicNoteCounts()
function refreshTopicNoteIndicators()
function scheduleTopicNoteIndicatorRefresh()
```

### 5.10 Notas Flotantes - Menú de Opciones (4 funciones)
```javascript
function buildNoteOptionsMenu(note)
function syncNoteOptionsMenu(menu, noteData)
function openFloatingNoteStyleMenu(menu, anchorElement)
function closeFloatingNoteStyleMenu(menu)
```

### 5.11 Imágenes - Visor (20+ funciones)
```javascript
function openImageViewer()
function closeImageViewer({restoreShift})
function toggleImageViewer(forceState)
function renderImageViewer()
function getActiveImageViewerContextKey()
function getActiveImageViewerContext()
function getImageViewerCombinedImages()
function getActiveViewerImage()
function setImageViewerZoom(value)
function adjustImageViewerZoom(delta)
function resetImageViewerZoom()
function clampImageViewerZoom(value)
function applyImageViewerZoom()
function updateImageViewerZoomControls()
function enforceImageViewerShift({force})
function computeImageViewerShift()
function activateImageViewerContext(contextKey, {externalImages, selectedRuntimeId, rerender})
function updateImageViewerContext(contextKey, updater, options)
function updateImageViewerMetaDisplay(image)
```

### 5.12 Imágenes - Contextos (8 funciones)
```javascript
function buildViewerContextKey(prefix, identifier)
function resolveImageViewerScopeForElement(element)
function createExternalEntryFromImage(img, contextKey, index)
function buildExternalImagesForScope(scope, anchorImage)
function previewImageFromElement(imgElement)
function sanitizeViewerImages(images)
function sanitizeImageViewerContext(context)
function sanitizeImageViewerState(next)
```

### 5.13 Imágenes - Manejo de Archivos (4 funciones)
```javascript
async function handleImageViewerFiles(fileList)
function handleImageViewerDownload()
function handleImageViewerRemove()
function handleImageViewerSelect(event)
```

### 5.14 Imágenes - Navegación (3 funciones)
```javascript
function stepImageViewerSelection(direction)
function handleImageViewerWheelZoom(event)
function handleImageViewerNotesInput()
```

### 5.15 Imágenes - Editor de Imágenes (15 funciones)
```javascript
function showImageToolbar(img)
function hideImageToolbar()
function repositionImageToolbar()
function updateToolbarState(img)
function updateToolbarPosition(img)
function getImageContainer(img)
function setImageWidthPx(img, width)
function getImageWidthPx(img)
function getImageNaturalWidth(img)
function updateWidthDisplayForImage(img)
function changeSelectedImageWidth(multiplier)
function wrapImageWithFigure()
function unwrapImageFigure()
function ensureFloatingNoteImageInitialSize(img, container)
function markFloatingNoteImagesInitialized(container)
```

### 5.16 Imágenes - Crop (5 funciones)
```javascript
function openImageCropModal(img)
function closeImageCropModal()
function setCropSelection(startX, startY, currentX, currentY)
function updateCropScale()
function getImageContainer(img)
```

### 5.17 Tablas - Inicialización y Menú (7 funciones)
```javascript
function wrapTableIfNeeded(table)
function makeTableResizable(table)
function initializeTableMenu()
function ensureTableDefaults(table)
function getTableWrapper(table)
function countColumns(table)
function countRows(table)
```

### 5.18 Tablas - Manipulación (11 funciones)
```javascript
function insertRow(relativePosition)
function deleteRow()
function insertColumn(position)
function deleteColumn()
function clearColumn()
function toggleHeaderRow()
function toggleZebra()
function selectColumn()
function ensureCellContext()
function openTools()
function handleAction(action)
```

### 5.19 Tablas - Estilos y Propiedades (11 funciones)
```javascript
function applySpacing()
function applyHorizontalOffset()
function adjustTableOffset(direction)
function applyBorderStyles()
function updateBorderControls()
function applySpacingPreset(key)
function updateSpacingControls()
function updateThemeButtons()
function applyTheme(themeClass)
function updateMenuState()
function updateSizeDisplay()
```

### 5.20 Tablas - Redimensionamiento Automático (3 funciones)
```javascript
function activateTableAutoResize(table)
function deactivateTableAutoResize()
function handleTablePointerDown(event)
```

### 5.21 Zoom y Navegación (10 funciones)
```javascript
function updateZoom(delta)
function applyZoom(level, options)
function syncMagicZoom()
function adjustFloatingNotesForZoom(prevZoom, nextZoom)
function adjustDocumentShift(delta)
function applyDocumentShift()
function getToolbarOffset()
function scrollPageIntoViewWithOffset(pageElement, behavior)
function getCurrentPage()
function getCurrentMagicPage()
```

### 5.22 Temas y Páginas (12 funciones)
```javascript
function getPageTheme(page)
function applyThemeToPage(page, themeClass)
function syncBodyTheme(themeClass)
function updateThemeSelectControl(themeClass)
function getVisibleSectionId()
function refreshSectionVisibility({force})
function updateSectionsPanelActiveState()
function ensureVisibleSection({force})
function setVisibleSection(sectionId, {force})
function setActivePage(page)
function setSectionTheme(sectionId, themeClass)
function updateSectionIndicator(page)
```

### 5.23 Secciones (12 funciones)
```javascript
function buildSectionsPanel()
function togglePanelEditMode()
function toggleAllSections()
function renameSection(section)
function deleteSection(section)
function addNewSection()
function promptCreateTopicInSection(section)
function createTopicPageForSection(section, title)
function sortSectionsAlpha()
function sortSectionsNumeric()
function printSection(section)
function getCurrentSectionId()
```

### 5.24 Topics/Temas (8 funciones)
```javascript
function renameTopicPage(page)
function moveTopicPage(page)
function deleteTopicPage(page)
function getTopicTitle(page)
function showTopicMenu(event, tema)
function hideTopicMenu()
function setActiveTopicListHighlight(topicId)
function getCurrentTopicId()
```

### 5.25 Magic View (10 funciones)
```javascript
function activateMagicTopic(anchorId, title, pageRef)
function closeMagicView()
function returnFromMagicView()
function ensureMagicTopicSource(anchorId, pageRef)
function persistMagicEdits()
function setMagicFloatingBackVisibility(visible, disabled)
function magicAnchorFor(page)
(function setSpecialtyFromBuildComment())
function getCurrentMagicPage()
function resolveActiveTopicFromViewport()
```

### 5.26 Selección y Edición de Texto (20 funciones)
```javascript
function saveCurrentSelection(options)
function restoreSelection()
function clearSavedSelection()
function createSelectionSnapshot(selection)
function cloneSelectionSnapshot(snapshot)
function restoreSelectionSnapshot(snapshot, options)
function ensureEditableSelection()
function isSelectionWithinEditable(selection)
function resolveSelectionForInsertion()
function insertNodeAtSelection(node)
function insertHtmlAtSelection(html)
function insertTextAtSelection(text, options)
function getRangeContextElement(range)
function resolveEditableAncestor(node)
function isNodeInDocument(node)
function captureToolbarInsertionSnapshot()
function clearToolbarInsertionSnapshot()
function primeToolbarInsertionSelection()
function captureIconPickerSelectionSnapshot()
function clearIconPickerSelectionSnapshot()
```

### 5.27 Icon Picker (12 funciones)
```javascript
function buildIconPicker()
function ensureIconPicker()
function mountIconPicker(picker)
function bindIconPickerTrigger()
function resolveIconPickerTrigger()
function detachIconPickerTrigger()
function scheduleIconPickerRebind(delay)
function showIconPicker(anchor)
function hideIconPicker()
function toggleIconPicker(anchor)
function restoreSelectionForIconInsertion()
function stopIconPickerPropagation(event)
```

### 5.28 Template Blocks (15 funciones)
```javascript
function createTemplateBlock(template)
function serializeTemplateBlocks(page)
function restoreTemplateBlocks(page, serializedBlocks)
function getTemplateTarget(block)
function insertNoteSpacer(position)
function readSerializedNoteStyle(block, target)
function applyNoteStyle(block, styleId, options)
function getAppliedNoteStyle(block, target)
function markNoteStyleAsCustom(block, target)
function showTemplateToolbar(block)
function hideTemplateToolbar()
function repositionTemplateToolbar()
function updateTemplateToolbarState(block)
function updateTemplateToolbarPosition(block)
function updateBorderWidthDataset(block, baseWidth, accentExtra)
```

### 5.29 Estilos de Template (7 funciones)
```javascript
function applyTemplateBackground(color)
function applyTemplateTextColor(color)
function applyTemplateBorderColor(color)
function applyTemplateAccentColor(color)
function createCollapseCardElement()
function initializeCollapseCards(root)
function initPalette(container, colors, onSelect)
```

### 5.30 Colores y Formato (20 funciones)
```javascript
function normalizeColorToHex(color, fallback)
function normalizeColorValue(value)
function isClearHighlightColor(color)
function isTransparentColor(value)
function createColorPalette(paletteId, colors, isHighlight)
function updateHighlightPaletteActiveColor(palette, activeColor)
function activatePersistentHighlight(color)
function deactivatePersistentHighlight()
function applyPersistentHighlightIfNeeded()
function schedulePersistentHighlight()
function applyColor(color, isHighlight, options)
function applyColorToRange(range, color, isHighlight)
function copySelectedFormat()
function applyCopiedFormat()
function supportsCommand(command)
function setPaletteActive(container, value)
function isHighlightElement(element)
function stripHighlightFromElement(element)
function collectHighlightWrappersForRange(range)
function clearHighlightFromRange(range)
```

### 5.31 Resaltado y Edición (8 funciones)
```javascript
function isRangeWithinEditable(range)
function rangeFullyContainsNode(range, node)
function unwrapElementPreservingContent(element)
function sanitizeHighlightFragment(fragment)
function getLineHeightRatio(element)
function getLineHeightFromStyle(element)
function adjustFontSizeProportionally(direction)
function clampFontSize(value)
```

### 5.32 Pegar y Sanitizar (5 funciones)
```javascript
function enableHtmlPaste()
function sanitizeFloatingNotePasteHtml(rawHtml)
function sanitizeCitations(el)
function purgeUnwantedNotes(root)
function normalizePearls(root)
```

### 5.33 Limpieza y Normalización (8 funciones)
```javascript
function afterContentSanitize(root)
function resetInteractiveBindings(root)
function initializeCollapseCards(root)
function countWords(html)
function normalizeTemplateDataValue(value)
function normalizeCustomIconValue(value)
function resolveBooleanFlag(value, defaultValue)
function parsePxValue(value, fallback)
```

### 5.34 Viewport y Validación (8 funciones)
```javascript
function invalidateActiveTopicViewportState()
function getActiveTopicViewportState()
function captureActiveTopicViewportContext()
function consumeFloatingNotesRelaxedMatching()
function syncNoteViewportAnchors(note, viewportState, {force})
function applyFloatingNoteTopicVisibility(note, options)
function refreshFloatingNotesTopicVisibility({relaxMatching})
function findPageByTopicId(topicId)
```

### 5.35 Utilidades de Documento (12 funciones)
```javascript
function getDocumentTitle()
function setDocumentTitle(value)
function getCurrentPage()
function getCurrentMagicPage()
function getCurrentTopicId()
function getCurrentSectionId()
function findPageByTopicId(topicId)
function formatDateTime(isoString)
function downloadTextFile(content, filename, mimeType)
function htmlToMarkdown(html)
function readFileAsDataUrl(file)
function computeImageDimensions(dataUrl)
```

### 5.36 Panel (3 funciones)
```javascript
function openPanel()
function closePanel()
function setPanelFilter(value)
```

### 5.37 Topbar (4 funciones)
```javascript
function toggleReadingMode()
function closeTopbarDropdowns()
function toggleTopbarDropdown(trigger, dropdown)
function applyTopbarTheme(theme, {persist})
```

### 5.38 Modal (2 funciones)
```javascript
function showModal(content)
function hideModal()
```

### 5.39 Exportación (5 funciones)
```javascript
async function getStylesheetTextForExport()
function htmlToMarkdown(html)
function downloadTextFile(content, filename, mimeType)
function saveToLocalCache(explicit)
async function restoreFromLocalCache()
```

### 5.40 Flashcards (1 función)
```javascript
function createFlashcardFromNote(noteData)
```

### 5.41 Página (2 funciones)
```javascript
function printCurrentTopic()
function printSection(section)
```

### 5.42 Toggles y Utilidades (10 funciones)
```javascript
function toggleEditMode()
function toggleReadingMode()
function execCmd(command, value)
function handleIndentCommand(command)
function toggleNoteHeaderCompact(note)
function toggleNoteUltraCompact(note)
function toggleNoteBehindMain(note)
function clampToInputRange(value, input, fallback)
function setActiveAlignButton(activeClass)
function applyFloatClass(targetClass)
```

### 5.43 Título y Documentación (3 funciones)
```javascript
function getDocumentTitle()
function setDocumentTitle(value)
function safeCssEscape(value)
```

---

## 6. EVENTOS PRINCIPALES (325 event listeners registrados)

### 6.1 Eventos de Documento
- `addEventListener('click')` - Múltiples handlers globales
- `addEventListener('keydown')` - Comandos globales
- `addEventListener('selectionchange')` - Cambios de selección
- `addEventListener('scroll')` - Scroll con passive true
- `addEventListener('dblclick')` - Doble click global
- `addEventListener('beforeunload')` - Guardado al cerrar

### 6.2 Eventos de Ventana
- `addEventListener('resize')` - Reposicionamiento responsive
- `addEventListener('scroll')` - Con passive true para performance
- `addEventListener('DOMContentLoaded')` - Inicialización del picker

### 6.3 Eventos de UI
- Botones de topbar
- Dropdowns de navegación
- Botones de tema
- Botones de herramientas
- Botones de exportación/importación

### 6.4 Eventos de Tabla
- `click` en celdas
- `mousemove` para redimensionamiento
- `mousedown` para interacción
- `mouseleave` para salida

### 6.5 Eventos de Imagen
- `click` en galería
- `wheel` para zoom (no passive = permite preventDefault)
- `load` para carga de imagen
- `change` en input de archivo

### 6.6 Eventos de Notas Flotantes
- `pointerdown` para drag y resize
- `click` en opciones
- `keydown` para atajos

### 6.7 Eventos de Panel
- `click` para búsqueda
- `input` para filtrado
- `click` para secciones

---

## 7. DEPENDENCIAS ENTRE FUNCIONES

### 7.1 Cadena Crítica de Inicialización
```
initializeEditor()
  ├─ notesRegistry.setChangeListener()
  ├─ buildSectionsPanel()
  │  ├─ initializeSections()
  │  └─ setupMagicIcons()
  ├─ initializeTableMenu()
  ├─ ensureIconPicker()
  │  ├─ buildIconPicker()
  │  └─ mountIconPicker()
  ├─ loadImageViewerState()
  └─ restoreFromLocalCache()
```

### 7.2 Dependencias de Notas Flotantes
```
createFloatingNote()
  ├─ ensureNoteData()
  ├─ getFloatingNoteStyle()
  ├─ renderSuperNoteUI()
  ├─ updateSuperNoteBody()
  ├─ applyFloatingNoteStyle()
  ├─ positionFloatingNote()
  ├─ bringNoteToFront()
  ├─ attachFloatingNoteResizeHandles()
  ├─ buildNoteOptionsMenu()
  ├─ syncNoteViewportAnchors()
  └─ scheduleFloatingNotesViewportRefresh()
```

### 7.3 Dependencias del Image Viewer
```
openImageViewer()
  ├─ getImageViewerCombinedImages()
  ├─ getActiveViewerImage()
  ├─ renderImageViewer()
  ├─ updateImageViewerZoomControls()
  ├─ enforceImageViewerShift()
  └─ persistImageViewerState()
```

### 7.4 Dependencias de Tablas
```
initializeTableMenu()
  ├─ ensureTableDefaults()
  ├─ updateMenuState()
  │  ├─ updateSizeDisplay()
  │  ├─ updateSpacingControls()
  │  ├─ updateBorderControls()
  │  ├─ updateThemeButtons()
  │  └─ updateStatefulButtons()
  ├─ handleAction()
  │  ├─ insertRow()
  │  ├─ deleteRow()
  │  ├─ toggleHeaderRow()
  │  └─ ... más acciones
  └─ applyBorderStyles()
```

### 7.5 Dependencias de Secciones
```
buildSectionsPanel()
  ├─ initializeSections()
  ├─ setupMagicIcons()
  ├─ buildSectionsPanel()  // recursive
  ├─ renameSection()
  ├─ deleteSection()
  ├─ addNewSection()
  └─ createTopicPageForSection()
```

### 7.6 Dependencias de Selección
```
saveCurrentSelection()
  ├─ ensureEditableSelection()
  ├─ createSelectionSnapshot()
  └─ getSavedSelectionRect()

restoreSelection()
  ├─ restoreSelectionSnapshot()
  ├─ isSelectionWithinEditable()
  └─ ... validación
```

### 7.7 Dependencias de Color
```
applyColor()
  ├─ isHighlightElement()
  ├─ applyColorToRange()
  │  ├─ normalizeColorToHex()
  │  ├─ stripHighlightFromElement()
  │  └─ clearHighlightFromRange()
  └─ persistMagicEdits()
```

---

## 8. PATRONES ARQUITECTÓNICOS IDENTIFICADOS

### 8.1 Patrón State Management
- Variables globales para estado (52+ variables)
- Funciones de actualización específicas por tema
- Listeners para cambios de estado (notesRegistry)
- Persistencia automática en caché

### 8.2 Patrón Delegation
- `handleAction()` en tablas - delegación de acciones
- Listeners de evento que llaman a funciones específicas
- Menús que disparan acciones según data attribute

### 8.3 Patrón Observer
- `ResizeObserver` para cambios de tamaño de notas
- `MutationObserver` potencial (no detectado)
- Listeners de cambio en registry

### 8.4 Patrón Factory
- `createFloatingNote()` con opciones
- `createTemplateBlock()` con template
- `createColorPalette()` con configuración

### 8.5 Patrón Singleton
- `imageViewerState` - único estado para visor
- `notesRegistry` - instancia única

### 8.6 Patrón Strategy
- Múltiples estrategias de normalización de colores
- Múltiples estrategias de viewport sync
- Múltiples modos de ordenamiento de notas

### 8.7 Patrón Adapter
- `sanitizeFloatingNotePasteHtml()` - adapta HTML puro
- `sanitizeViewerImages()` - adapta imágenes
- `sanitizeImageViewerState()` - migración de estado legacy

---

## 9. SUGERENCIAS DE MODULARIZACIÓN

### Módulo 1: Note Management (2,000-2,500 líneas)
**Responsabilidad**: Gestión completa de notas flotantes

**Funciones a incluir**:
- Crear, eliminar, duplicar notas
- Persistencia de datos de notas
- Opciones de notas
- Anclas de tema
- Flashcards

**Dependencias externas**:
- NoteRegistry (modules/notes/)
- Sistema de zoom
- Sistema de posicionamiento

---

### Módulo 2: Image Viewer Module (2,000-2,500 líneas)
**Responsabilidad**: Gestión del visor de imágenes

**Funciones a incluir**:
- Estado del visor
- Contextos múltiples
- Zoom y navegación
- Descarga y carga
- Limpieza de imágenes

**Dependencias externas**:
- localStorage/IndexedDB
- Sistema de archivo

---

### Módulo 3: Table Editor Module (1,500-2,000 líneas)
**Responsabilidad**: Edición y manipulación de tablas

**Funciones a incluir**:
- Menú de tabla
- Manipulación de filas/columnas
- Estilos y bordes
- Redimensionamiento automático
- Propiedades de espaciado

---

### Módulo 4: Template & Blocks Module (1,000-1,500 líneas)
**Responsabilidad**: Sistemas de bloques template

**Funciones a incluir**:
- Creación de bloques
- Estilos de template
- Colores y paletas
- Toolbar de template
- Collapse cards

---

### Módulo 5: Selection & Editing Module (1,500-2,000 líneas)
**Responsabilidad**: Gestión de selección y edición de texto

**Funciones a incluir**:
- Snapshots de selección
- Restauración de selección
- Edición de texto
- Pegar HTML
- Icon picker
- Formatos de color

---

### Módulo 6: Viewport & Positioning Module (800-1,200 líneas)
**Responsabilidad**: Gestión de viewport y posicionamiento

**Funciones a incluir**:
- Zoom
- Desplazamiento de documento
- Posicionamiento de notas
- Sincronización de viewport
- Clamping

---

### Módulo 7: Sections & Topics Module (1,500-2,000 líneas)
**Responsabilidad**: Gestión de secciones y temas

**Funciones a incluir**:
- Panel de secciones
- Creación/eliminación de temas
- Ordenamiento
- Temas de páginas
- Magic view

---

### Módulo 8: UI Components Module (1,000-1,500 líneas)
**Responsabilidad**: Componentes de interfaz reutilizables

**Funciones a incluir**:
- Topbar
- Modales
- Dropdowns
- Icon picker
- Menús emergentes

---

### Módulo 9: Cache & Persistence Module (800-1,200 líneas)
**Responsabilidad**: Caché y persistencia

**Funciones a incluir**:
- IndexedDB
- localStorage
- Serialización
- Sanitización
- Migración de datos

---

### Módulo 10: Utilities Module (600-1,000 líneas)
**Responsabilidad**: Utilidades generales

**Funciones a incluir**:
- Normalización de colores
- Formateo
- Validación
- Escaping
- Cálculos de dimensiones

---

### Módulo 11: Image Editor Module (1,200-1,500 líneas)
**Responsabilidad**: Edición de imágenes

**Funciones a incluir**:
- Toolbar de imagen
- Crop
- Redimensionamiento
- Ancho de imagen
- Wrapping en figure

---

### Módulo 12: Highlighting & Colors Module (1,000-1,500 líneas)
**Responsabilidad**: Sistema de resaltado y colores

**Funciones a incluir**:
- Paletas de colores
- Resaltado persistente
- Colores de bordes
- Colores de fuente
- Limpieza de resaltado

---

### Módulo 13: Export & Import Module (800-1,200 líneas)
**Responsabilidad**: Exportación e importación

**Funciones a incluir**:
- Exportar a Markdown
- Exportar a HTML
- Importar HTML
- Copiar HTML
- Estadísticas

---

### Módulo 14: Super Notes Module (1,000-1,500 líneas)
**Responsabilidad**: Sistema de Super Notes con tabs

**Funciones a incluir**:
- Gestión de tabs
- Edición inline de tabs
- Color picker de tabs
- Rendering de UI
- Sincronización

---

### Módulo 15: Topic Notes Popover (600-1,000 líneas)
**Responsabilidad**: Popover de notas de tema

**Funciones a incluir**:
- Renderizado del popover
- Posicionamiento
- Conteo de notas
- Gestión de acciones
- Indicadores

---

## 10. COMPLEJIDAD Y DEUDA TÉCNICA

### 10.1 Problemas Identificados
1. **Acoplamiento alto**: Muchas funciones dependen de variables globales
2. **No hay separación clara de responsabilidades**: Un archivo hace 14,822 líneas
3. **Difícil de testear**: Variables globales hacen testing complicado
4. **Duplication**: Código repetido en manejo de estado
5. **Código no modular**: Event listeners esparcidos en el archivo

### 10.2 Métricas de Complejidad
- **Número de funciones**: ~500
- **Número de variables globales**: 52+
- **Número de event listeners**: 325+
- **Número de elementos DOM referenciados**: 60+
- **Profundidad de anidamiento**: Hasta 5-6 niveles
- **Ciclomática**: Muy alta en algunas funciones

---

## 11. ESTRATEGIA DE REFACTORIZACIÓN RECOMENDADA

### Fase 1: Preparación (1-2 semanas)
1. Crear estructura de carpetas para módulos
2. Establecer interfaces/contratos entre módulos
3. Crear archivo de configuración central
4. Agregar tipos (JSDoc o TypeScript)

### Fase 2: Extracción de Módulos (2-4 semanas)
1. Extraer módulos uno a uno
2. Crear archivos de índice para cada módulo
3. Exponer APIs limpias
4. Mantener backward compatibility

### Fase 3: Refactorización de Estado (1-2 semanas)
1. Crear state manager centralizado
2. Reducir variables globales
3. Implementar pattern Observer global
4. Sincronizar con persistencia

### Fase 4: Testing (2-3 semanas)
1. Agregar tests unitarios
2. Tests de integración entre módulos
3. Tests E2E
4. Tests de performance

---

## CONCLUSIÓN

El archivo `editor.js` es un monolito funcional bien estructurado pero necesita urgentemente ser modularizado. La refactorización en 15 módulos propuestos mantendría la funcionalidad actual mientras facilitaría:
- Mantenibilidad
- Testing
- Colaboración en equipo
- Reutilización de código
- Documentación

El código no es malicioso ni tiene vulnerabilidades evidentes, simplemente requiere organización arquitectónica mejor.
