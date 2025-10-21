# GUÍA DE MODULARIZACIÓN: scripts/editor.js

## RESUMEN EJECUTIVO

**Archivo actual**: `scripts/editor.js`
- **Líneas**: 14,822
- **Funciones**: ~500
- **Variables de estado global**: 52+
- **Event listeners**: 325+
- **Elementos DOM referenciados**: 60+

**Estado actual**: Monolito funcional bien estructurado pero acoplado

**Objetivo**: Dividir en 15 módulos lógicos independientes

---

## PROPUESTA DE ARQUITECTURA

```
scripts/
├── editor.js                          (Punto de entrada simplificado)
├── modules/
│   ├── noteManagement/
│   │   ├── index.js
│   │   ├── floatingNoteCore.js
│   │   ├── noteData.js
│   │   ├── superNotes.js
│   │   ├── topicNotes.js
│   │   └── noteAnchors.js
│   ├── imageViewer/
│   │   ├── index.js
│   │   ├── viewerState.js
│   │   ├── contexts.js
│   │   ├── navigation.js
│   │   ├── files.js
│   │   └── display.js
│   ├── tableEditor/
│   │   ├── index.js
│   │   ├── tableMenu.js
│   │   ├── manipulation.js
│   │   ├── styling.js
│   │   └── autoResize.js
│   ├── templateBlocks/
│   │   ├── index.js
│   │   ├── creation.js
│   │   ├── styling.js
│   │   ├── toolbar.js
│   │   └── palettes.js
│   ├── selection/
│   │   ├── index.js
│   │   ├── snapshots.js
│   │   ├── insertion.js
│   │   ├── iconPicker.js
│   │   └── restoration.js
│   ├── viewport/
│   │   ├── index.js
│   │   ├── zoom.js
│   │   ├── positioning.js
│   │   ├── scrolling.js
│   │   └── viewport.js
│   ├── sections/
│   │   ├── index.js
│   │   ├── panel.js
│   │   ├── management.js
│   │   ├── topics.js
│   │   └── magic.js
│   ├── ui/
│   │   ├── index.js
│   │   ├── topbar.js
│   │   ├── modals.js
│   │   ├── dropdowns.js
│   │   └── panels.js
│   ├── cache/
│   │   ├── index.js
│   │   ├── indexedDB.js
│   │   ├── localStorage.js
│   │   ├── serialization.js
│   │   └── migration.js
│   ├── imageEditor/
│   │   ├── index.js
│   │   ├── toolbar.js
│   │   ├── crop.js
│   │   ├── resizing.js
│   │   └── wrapping.js
│   ├── highlighting/
│   │   ├── index.js
│   │   ├── colors.js
│   │   ├── palettes.js
│   │   ├── persistent.js
│   │   └── ranges.js
│   ├── export/
│   │   ├── index.js
│   │   ├── html.js
│   │   ├── markdown.js
│   │   ├── data.js
│   │   └── files.js
│   ├── utilities/
│   │   ├── index.js
│   │   ├── colors.js
│   │   ├── formatting.js
│   │   ├── dom.js
│   │   ├── validation.js
│   │   └── strings.js
│   └── state/
│       ├── index.js
│       ├── stateManager.js
│       ├── listeners.js
│       └── persistence.js
└── constants/
    ├── index.js
    ├── imageViewer.js
    ├── floatingNotes.js
    ├── themes.js
    ├── cache.js
    └── ui.js
```

---

## MÓDULO 1: NOTE MANAGEMENT (2,000-2,500 líneas)

### Funciones a incluir:
```
CREAR/ELIMINAR:
- createFloatingNote(data)
- deleteFloatingNote(note)
- duplicateFloatingNote(note)
- clearFloatingNotes()
- clampAllFloatingNotes()
- restoreFloatingNotes(notes, hidden)

DATOS:
- ensureNoteData(noteId, overrides)
- updateNoteData(noteId, updates, {silent})
- removeNoteData(noteId)
- isFloatingFamilyNote(note)

METADATOS:
- setNoteCategory(note, categoryId)
- setNoteTags(note, tags)
- promptNoteTags(note)
- setNotePriority(note, priority)
- cycleNotePriority(note)
- toggleNoteReviewed(note, forceValue)
- setNoteCustomIcon(note, symbol)

SUPER NOTES:
- updateSuperNoteBody(note, noteData)
- getSuperNoteTabFallbackTitle(index)
- getSuperNoteTabDisplayTitle(tab, index)
- renderSuperNoteUI(note, noteData)
- activateSuperNoteTab(note, tabId)
- addSuperNoteTab(note)
- removeSuperNoteTab(note, tabId)
- openSuperNoteTabColorPicker(note, tabId)
- applySuperNoteTabColor(note, tabId, color)
- toggleSuperNoteMode(note)

TOPIC NOTES POPOVER:
- isTopicNotesPopoverOpen()
- closeTopicNotesPopover()
- openTopicNotesPopover(page, anchor)
- toggleTopicNotesPopover(page, anchor)
- positionTopicNotesPopover(anchor)
- renderTopicNotesPopover(topicId)
- getTopicNotesForTopic(topicId)
- collectTopicNoteCounts()
- refreshTopicNoteIndicators()
- scheduleTopicNoteIndicatorRefresh()

ANCHORS:
- beginNoteLinking(note)
- attachExistingAnchor(note, anchorId)
- clearNoteAnchor(note)
- removeNoteAnchor(noteId)
```

### Dependencias externas:
- NoteRegistry (modules/notes/)
- Viewport module (para posicionamiento)
- UI module (para menús)

### API pública:
```javascript
export const noteManagement = {
  create: createFloatingNote,
  delete: deleteFloatingNote,
  duplicate: duplicateFloatingNote,
  update: updateNoteData,
  getData: ensureNoteData,
  // ...
};
```

---

## MÓDULO 2: IMAGE VIEWER (2,000-2,500 líneas)

### Funciones a incluir:
```
CORE:
- openImageViewer()
- closeImageViewer({restoreShift})
- toggleImageViewer(forceState)
- renderImageViewer()

STATE:
- getImageViewerCombinedImages()
- getActiveViewerImage()
- getActiveImageViewerContextKey()
- getActiveImageViewerContext()
- setImageViewerState(updater, options)

CONTEXTOS:
- buildViewerContextKey(prefix, identifier)
- activateImageViewerContext(contextKey, options)
- updateImageViewerContext(contextKey, updater, options)
- resolveImageViewerScopeForElement(element)
- createExternalEntryFromImage(img, contextKey, index)
- buildExternalImagesForScope(scope, anchorImage)
- previewImageFromElement(imgElement)

ZOOM:
- setImageViewerZoom(value)
- adjustImageViewerZoom(delta)
- resetImageViewerZoom()
- clampImageViewerZoom(value)
- applyImageViewerZoom()
- updateImageViewerZoomControls()

SHIFT:
- computeImageViewerShift()
- enforceImageViewerShift({force})

ARCHIVOS:
- async handleImageViewerFiles(fileList)
- handleImageViewerDownload()
- handleImageViewerRemove()
- handleImageViewerSelect(event)

EVENTOS:
- stepImageViewerSelection(direction)
- handleImageViewerWheelZoom(event)
- handleImageViewerNotesInput()

META:
- updateImageViewerMetaDisplay(image)

SANITIZACIÓN:
- sanitizeViewerImages(images)
- sanitizeImageViewerContext(context)
- sanitizeImageViewerState(next)

PERSISTENCIA:
- loadImageViewerState()
- persistImageViewerState()
```

### Dependencias externas:
- Cache module (para persistencia)
- Viewport module (para shift)

### API pública:
```javascript
export const imageViewer = {
  open: openImageViewer,
  close: closeImageViewer,
  toggle: toggleImageViewer,
  setZoom: setImageViewerZoom,
  // ...
};
```

---

## MÓDULO 3: TABLE EDITOR (1,500-2,000 líneas)

### Funciones a incluir:
```
CORE:
- wrapTableIfNeeded(table)
- makeTableResizable(table)
- initializeTableMenu()

MENU:
- ensureTableDefaults(table)
- getTableWrapper(table)
- countColumns(table)
- countRows(table)
- updateMenuState()

MANIPULACIÓN:
- insertRow(relativePosition)
- deleteRow()
- insertColumn(position)
- deleteColumn()
- clearColumn()
- toggleHeaderRow()
- toggleZebra()
- selectColumn()
- ensureCellContext()
- openTools()
- handleAction(action)

ESTILOS:
- applySpacing()
- applyHorizontalOffset()
- adjustTableOffset(direction)
- applyBorderStyles()
- updateBorderControls()
- applySpacingPreset(key)
- updateSpacingControls()
- updateThemeButtons()
- applyTheme(themeClass)
- updateSizeDisplay()

AUTO-RESIZE:
- activateTableAutoResize(table)
- deactivateTableAutoResize()
- handleTablePointerDown(event)
```

### Dependencias externas:
- Utilities module (para normalización)

### API pública:
```javascript
export const tableEditor = {
  initialize: initializeTableMenu,
  insertRow: insertRow,
  deleteRow: deleteRow,
  // ...
};
```

---

## MÓDULO 4: TEMPLATE BLOCKS (1,000-1,500 líneas)

### Funciones a incluir:
```
CREACIÓN:
- createTemplateBlock(template)
- getTemplateTarget(block)
- insertNoteSpacer(position)

SERIALIZACIÓN:
- serializeTemplateBlocks(page)
- restoreTemplateBlocks(page, serializedBlocks)

ESTILOS:
- applyNoteStyle(block, styleId, options)
- getAppliedNoteStyle(block, target)
- markNoteStyleAsCustom(block, target)
- readSerializedNoteStyle(block, target)
- clearNoteStyleClasses(target)

TOOLBAR:
- showTemplateToolbar(block)
- hideTemplateToolbar()
- repositionTemplateToolbar()
- updateTemplateToolbarState(block)
- updateTemplateToolbarPosition(block)

PALETAS:
- applyTemplateBackground(color)
- applyTemplateTextColor(color)
- applyTemplateBorderColor(color)
- applyTemplateAccentColor(color)
- initPalette(container, colors, onSelect)
- updateBorderWidthDataset(block, baseWidth, accentExtra)
- createCollapseCardElement()
- initializeCollapseCards(root)

UTILIDADES:
- normalizeTemplateDataValue(value)
```

### Dependencias externas:
- UI module (para paletas)
- Utilities module

### API pública:
```javascript
export const templateBlocks = {
  create: createTemplateBlock,
  applyStyle: applyNoteStyle,
  // ...
};
```

---

## MÓDULO 5: SELECTION (1,500-2,000 líneas)

### Funciones a incluir:
```
SNAPSHOTS:
- createSelectionSnapshot(selection)
- cloneSelectionSnapshot(snapshot)
- restoreSelectionSnapshot(snapshot, options)
- saveCurrentSelection(options)
- restoreSelection()
- clearSavedSelection()

TOOLBAR INSERTION:
- captureToolbarInsertionSnapshot()
- clearToolbarInsertionSnapshot()
- primeToolbarInsertionSelection()
- getSavedSelectionRect()

ICON PICKER:
- captureIconPickerSelectionSnapshot()
- clearIconPickerSelectionSnapshot()

EDITABLE:
- ensureEditableSelection()
- isSelectionWithinEditable(selection)
- resolveSelectionForInsertion()

INSERCIÓN:
- insertNodeAtSelection(node)
- insertHtmlAtSelection(html)
- insertTextAtSelection(text, options)
- getRangeContextElement(range)

UTILIDADES:
- resolveEditableAncestor(node)
- isNodeInDocument(node)

ICON PICKER MODULE:
- buildIconPicker()
- ensureIconPicker()
- mountIconPicker(picker)
- bindIconPickerTrigger()
- resolveIconPickerTrigger()
- detachIconPickerTrigger()
- scheduleIconPickerRebind(delay)
- showIconPicker(anchor)
- hideIconPicker()
- toggleIconPicker(anchor)
- restoreSelectionForIconInsertion()
- stopIconPickerPropagation(event)
```

### Dependencias externas:
- UI module

### API pública:
```javascript
export const selection = {
  save: saveCurrentSelection,
  restore: restoreSelection,
  insertHtml: insertHtmlAtSelection,
  insertText: insertTextAtSelection,
  // ...
};
```

---

## MÓDULO 6: VIEWPORT (800-1,200 líneas)

### Funciones a incluir:
```
ZOOM:
- updateZoom(delta)
- applyZoom(level, options)
- syncMagicZoom()
- adjustFloatingNotesForZoom(prevZoom, nextZoom)

DESPLAZAMIENTO:
- adjustDocumentShift(delta)
- applyDocumentShift()

NAVEGACIÓN:
- scrollPageIntoViewWithOffset(pageElement, behavior)
- getCurrentPage()
- getCurrentMagicPage()

TOOLBAR:
- getToolbarOffset()
- measureToolbarHeight()

VIEWPORT STATE:
- invalidateActiveTopicViewportState()
- getActiveTopicViewportState()
- captureActiveTopicViewportContext()
- consumeFloatingNotesRelaxedMatching()

SINCRONIZACIÓN:
- syncNoteViewportAnchors(note, viewportState, {force})
- applyFloatingNoteTopicVisibility(note, options)
- refreshFloatingNotesTopicVisibility({relaxMatching})
- scheduleFloatingNotesViewportRefresh(options)
- requestFloatingNotesViewportSync()
```

### Dependencias externas:
- Note Management module

### API pública:
```javascript
export const viewport = {
  zoom: (delta) => updateZoom(delta),
  shift: (delta) => adjustDocumentShift(delta),
  // ...
};
```

---

## MÓDULO 7: SECTIONS & TOPICS (1,500-2,000 líneas)

### Funciones a incluir:
```
PANEL:
- buildSectionsPanel()
- togglePanelEditMode()
- openPanel()
- closePanel()
- setPanelFilter(value)

SECCIONES:
- initializeSections()
- toggleAllSections()
- renameSection(section)
- deleteSection(section)
- addNewSection()
- sortSectionsAlpha()
- sortSectionsNumeric()
- printSection(section)

TOPICS:
- renameTopicPage(page)
- moveTopicPage(page)
- deleteTopicPage(page)
- getTopicTitle(page)
- showTopicMenu(event, tema)
- hideTopicMenu()
- setActiveTopicListHighlight(topicId)
- getCurrentTopicId()
- getCurrentSectionId()
- findPageByTopicId(topicId)
- createTopicPageForSection(section, title)
- promptCreateTopicInSection(section)

MAGIC VIEW:
- activateMagicTopic(anchorId, title, pageRef)
- closeMagicView()
- returnFromMagicView()
- ensureMagicTopicSource(anchorId, pageRef)
- persistMagicEdits()
- setMagicFloatingBackVisibility(visible, disabled)
- magicAnchorFor(page)
- setupMagicIcons()

TEMAS:
- getPageTheme(page)
- applyThemeToPage(page, themeClass)
- syncBodyTheme(themeClass)
- updateThemeSelectControl(themeClass)
- getVisibleSectionId()
- refreshSectionVisibility({force})
- updateSectionsPanelActiveState()
- ensureVisibleSection({force})
- setVisibleSection(sectionId, {force})
- setActivePage(page)
- setSectionTheme(sectionId, themeClass)
- updateSectionIndicator(page)
```

### Dependencias externas:
- UI module
- Utilities module

---

## MÓDULO 8: UI COMPONENTS (1,000-1,500 líneas)

### Funciones a incluir:
```
TOPBAR:
- toggleReadingMode()
- closeTopbarDropdowns()
- toggleTopbarDropdown(trigger, dropdown)
- applyTopbarTheme(theme, {persist})

MODALES:
- showModal(content)
- hideModal()

MENUS:
- openFloatingNoteStyleMenu(menu, anchorElement)
- closeFloatingNoteStyleMenu(menu)
- positionFloatingNoteMenu(menu, anchorElement)
- syncFloatingNoteStyleMenu(menu, styleId)
- buildNoteOptionsMenu(note)
- syncNoteOptionsMenu(menu, noteData)

SUPER NOTES UI:
- showSuperNoteColorPanel(note)
- hideSuperNoteColorPanel(note, {clearTarget})
- syncSuperNoteColorPanel(note, noteData)
- startSuperNoteTabInlineEdit(note, tabId)
- finishSuperNoteTabInlineEdit(note, tabId, {cancel})
```

### Dependencias externas:
- State module

---

## MÓDULO 9: CACHE & PERSISTENCE (800-1,200 líneas)

### Funciones a incluir:
```
INDEXEDDB:
- openExtendedCacheDb()
- async writeExtendedCacheValue(value)
- async readExtendedCacheValue()
- async clearExtendedCacheValue()
- isQuotaExceededError(error)

ESTADO:
- loadImageViewerState()
- persistImageViewerState()
- setImageViewerState(updater, options)

CACHE LOCAL:
- saveToLocalCache(explicit)
- async restoreFromLocalCache()
- saveExtendedCacheState()

ESTILO EXPORT:
- async getStylesheetTextForExport()
```

### Dependencias externas:
- Ninguna (bajo nivel)

---

## MÓDULO 10: IMAGE EDITOR (1,200-1,500 líneas)

### Funciones a incluir:
```
TOOLBAR:
- showImageToolbar(img)
- hideImageToolbar()
- repositionImageToolbar()
- updateToolbarState(img)
- updateToolbarPosition(img)

CONTENEDOR:
- getImageContainer(img)
- setActiveAlignButton(activeClass)

ANCHO:
- getImageNaturalWidth(img)
- getImageWidthPx(img)
- setImageWidthPx(img, width)
- updateWidthDisplayForImage(img)
- changeSelectedImageWidth(multiplier)

CROP:
- openImageCropModal(img)
- closeImageCropModal()
- setCropSelection(startX, startY, currentX, currentY)
- updateCropScale()

WRAPPING:
- wrapImageWithFigure()
- unwrapImageFigure()

INICIALIZACIÓN:
- ensureFloatingNoteImageInitialSize(img, container)
- markFloatingNoteImagesInitialized(container)
```

---

## MÓDULO 11: HIGHLIGHTING & COLORS (1,000-1,500 líneas)

### Funciones a incluir:
```
COLORES:
- normalizeColorToHex(color, fallback)
- normalizeColorValue(value)
- isClearHighlightColor(color)
- isTransparentColor(value)

PALETAS:
- createColorPalette(paletteId, colors, isHighlight)
- updateHighlightPaletteActiveColor(palette, activeColor)

RESALTADO PERSISTENTE:
- activatePersistentHighlight(color)
- deactivatePersistentHighlight()
- applyPersistentHighlightIfNeeded()
- schedulePersistentHighlight()

APLICACIÓN:
- applyColor(color, isHighlight, options)
- applyColorToRange(range, color, isHighlight)

FORMATO:
- copySelectedFormat()
- applyCopiedFormat()
- supportsCommand(command)

ELEMENTOS:
- isHighlightElement(element)
- stripHighlightFromElement(element)
- collectHighlightWrappersForRange(range)
- clearHighlightFromRange(range)

RANGO:
- isRangeWithinEditable(range)
- rangeFullyContainsNode(range, node)
- unwrapElementPreservingContent(element)
- sanitizeHighlightFragment(fragment)
```

---

## MÓDULO 12: EXPORT & IMPORT (800-1,200 líneas)

### Funciones a incluir:
```
MARKDOWN:
- htmlToMarkdown(html)

ARCHIVOS:
- downloadTextFile(content, filename, mimeType)
- readFileAsDataUrl(file)

ESTADÍSTICAS:
- countWords(html)

EXPORTACIÓN:
- async getStylesheetTextForExport()

FLASHCARDS:
- createFlashcardFromNote(noteData)

IMPRESIÓN:
- printCurrentTopic()
- printSection(section)
```

---

## MÓDULO 13: UTILITIES (600-1,000 líneas)

### Funciones a incluir:
```
COLORES:
- normalizeColorToHex(color, fallback)
- normalizeColorValue(value)

FORMATOS:
- formatDateTime(isoString)
- computeImageDimensions(dataUrl)
- formatBytes(bytes)

VALIDACIÓN:
- resolveBooleanFlag(value, defaultValue)
- parsePxValue(value, fallback)
- clampFontSize(value)
- clampToInputRange(value, input, fallback)

DOM:
- safeCssEscape(value)
- getLineHeightRatio(element)
- getLineHeightFromStyle(element)
- adjustFontSizeProportionally(direction)
- getFontSizeFromElement(element)

NORMALIZACIÓN:
- normalizeTemplateDataValue(value)
- normalizeCustomIconValue(value)

CÁLCULOS:
- clamp(value, min, max)
```

---

## MÓDULO 14: FLOATING NOTE CORE (1,500-2,000 líneas)

### Funciones a incluir:
```
CREAR/ELIMINAR:
- createFloatingNote(data)
- deleteFloatingNote(note)
- duplicateFloatingNote(note)
- clearFloatingNotes()
- clampAllFloatingNotes()

POSICIONAMIENTO:
- positionFloatingNote(note, left, top, options)
- clampNotePosition(note, left, top)
- bringNoteToFront(note)
- resolveFloatingNoteInitialPosition(noteData, fallbackLeft, fallbackTop)

DRAG & RESIZE:
- startFloatingNoteDrag(note, event)
- handleFloatingNotePointerMove(event)
- endFloatingNoteDrag(event)
- startFloatingNoteHorizontalResize(note, edge, event)
- startFloatingNoteCornerResize(note, corner, event)
- tryBeginFloatingNoteDrag(note, event, menu)
- shouldUseFloatingNoteDragHandle(note, event)
- isPointerInNoteLeftCorner(note, clientX, clientY)

ESTILO:
- getFloatingNoteStyle(styleId)
- applyFloatingNoteStyle(note, styleId)
- applyFloatingNoteBorderState(note, options, {persist})
- applyFloatingNoteSize(note, width, height)
- resetFloatingNoteSize(note)
- updateFloatingNoteSizeDataset(note)
- resolveFloatingNoteBorderBase(note)

ESTADO:
- applyFloatingNoteTextNeutralState(note, keepNeutral, {persist})
- toggleFloatingNoteNeutralText(note)
- applyNoteHeaderCompactState(note, compact, {persist})
- applyNoteUltraCompactState(note, ultraCompact, {persist})
- applyNoteBehindState(note, behind, {persist})
- applyNoteHoverAnimationState(note, enabled, {persist})
- toggleNoteHoverAnimation(note)
- toggleNoteHeaderCompact(note)
- toggleNoteUltraCompact(note)
- toggleNoteBehindMain(note)

VISIBILIDAD:
- setFloatingNotesVisibility(hidden)
- refreshToggleNotesButton()
- setFloatingNotesEditable(editable)
- updateFloatingNotesPrintControl()
- printVisibleFloatingNotes()
- focusFloatingNoteById(noteId)

INTERACCIÓN:
- attachFloatingNoteResizeHandles(note)
- updateFloatingNotePageUI(note, noteData)
- goToFloatingNotePage(note, direction)
- addFloatingNotePage(note)
- removeFloatingNotePage(note)
- syncNoteElementMeta(note, noteData)

PEGAR:
- sanitizeFloatingNotePasteHtml(rawHtml)
```

---

## MÓDULO 15: STATE MANAGEMENT (600-1,000 líneas)

### Funciones a incluir:
```
INICIALIZACIÓN:
- initializeEditor() (simplificado)

CORE:
- Gestión centralizada del estado
- Listeners de cambio
- Sincronización con persistencia

OBSERVADORES:
- setChangeListener (para NoteRegistry)
- scheduleNotesViewRefresh()

VALIDADORES:
- Validación de estado
- Sanitización de datos
```

---

## PLAN DE EXTRACCIÓN

### Fase 1: Preparación (1 semana)
1. Crear estructura de carpetas
2. Crear archivos índice para cada módulo
3. Agregar JSDoc/TypeScript
4. Establecer contratos de API

### Fase 2: Extracción (3-4 semanas)
1. Semana 1: Módulos 1-5 (Note Management, Image Viewer, Table, Template, Selection)
2. Semana 2: Módulos 6-10 (Viewport, Sections, UI, Cache, Image Editor)
3. Semana 3: Módulos 11-15 (Highlighting, Export, Utilities, Floating Note, State)
4. Semana 4: Integración y testing

### Fase 3: Testing (2 semanas)
1. Tests unitarios por módulo
2. Tests de integración
3. Tests E2E
4. Performance testing

### Fase 4: Documentación (1 semana)
1. README por módulo
2. Ejemplos de uso
3. Guía de contribución

---

## CRITERIOS DE ÉXITO

- [ ] Todos los módulos extraídos
- [ ] Zero cambios funcionales
- [ ] Reduce complejidad en editor.js
- [ ] Mejora testabilidad
- [ ] Reduce coupling entre módulos
- [ ] Facilita mantenimiento futuro
- [ ] Tests pasan 100%
- [ ] Documentación completa

---

## BENEFICIOS ESPERADOS

1. **Mantenibilidad**: Cada módulo tiene responsabilidad única y clara
2. **Testing**: Más fácil de testear módulos independientes
3. **Reutilización**: Módulos pueden usarse en otros proyectos
4. **Colaboración**: Equipo puede trabajar en paralelo
5. **Debugging**: Errores más fáciles de localizar
6. **Performance**: Code splitting más efectivo
7. **Escalabilidad**: Agregar features sin complejidad adicional

