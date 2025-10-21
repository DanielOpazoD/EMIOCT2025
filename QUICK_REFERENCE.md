# QUICK REFERENCE: scripts/editor.js

## ESTADÍSTICAS PRINCIPALES

| Métrica | Valor |
|---------|-------|
| Total de líneas | 14,822 |
| Número de funciones | ~500 |
| Variables globales | 52+ |
| Event listeners | 325+ |
| Elementos DOM referenciados | 60+ |
| Constantes definidas | 50+ |
| Nivel de anidamiento máximo | 5-6 |
| Ciclomática promedio | Alta |

---

## CATEGORÍAS DE FUNCIONES

| Categoría | Cantidad | Líneas Est. |
|-----------|----------|-------------|
| Notas Flotantes | 70+ | 3,500 |
| Imágenes (visor + editor) | 50+ | 2,500 |
| Tablas | 30+ | 1,500 |
| Template Blocks | 15+ | 800 |
| Selección/Edición | 25+ | 1,200 |
| Viewport/Zoom | 15+ | 800 |
| Secciones/Topics | 20+ | 1,200 |
| UI Components | 20+ | 1,000 |
| Caché/Persistencia | 15+ | 800 |
| Colores/Resaltado | 25+ | 1,200 |
| Exportación | 10+ | 600 |
| Utilidades | 20+ | 800 |
| **TOTAL** | **500+** | **14,822** |

---

## VARIABLES DE ESTADO CLAVE

### Estado de Modos
- `isEditMode` - Modo edición
- `isReadingMode` - Modo lectura
- `isMagicViewActive` - Vista mágica
- `isPanelEditMode` - Edición de panel

### Estado de Notas Flotantes
- `floatingNotesHidden` - Visibilidad
- `floatingNoteDragState` - Estado de drag
- `floatingNoteResizeState` - Estado de resize
- `floatingNoteZIndex` - Z-index actual

### Estado de Viewport
- `currentZoom` - Nivel de zoom
- `documentHorizontalShift` - Desplazamiento
- `visibleSectionId` - Sección visible

### Estado del Visor de Imágenes
- `imageViewerState` - Estado completo
- `imageViewerZoom` - Zoom del visor
- `imageViewerContextKey` - Contexto actual

---

## FUNCIONES MÁS CRÍTICAS

### Top 10 por Importancia
1. **initializeEditor()** - Inicialización general
2. **createFloatingNote()** - Crear notas
3. **positionFloatingNote()** - Posicionamiento
4. **openImageViewer()** - Visor de imágenes
5. **initializeTableMenu()** - Menú de tablas
6. **saveCurrentSelection()** - Guardar selección
7. **applyZoom()** - Aplicar zoom
8. **buildSectionsPanel()** - Panel de secciones
9. **renderImageViewer()** - Renderizar visor
10. **restoreFromLocalCache()** - Restaurar caché

---

## DEPENDENCIAS PRINCIPALES

### Imports Externos
```
NoteRegistry (modules/notes/NoteRegistry.js)
  ├─ NOTE_TYPES
  ├─ NOTE_CATEGORIES
  └─ NOTE_PRIORITY_SEQUENCE

noteUtils.js
  ├─ sanitizeTags()
  ├─ escapeHtml()
  ├─ getNotePlainTextFromHtml()
  └─ getNoteDisplayTitle()

noteConstants.js
  ├─ SUPER_NOTE_DEFAULT_TAB_COLOR
  ├─ SUPER_NOTE_TAB_TITLE_MAX_LENGTH
  └─ SUPER_NOTE_PRESET_COLORS

id.js
  └─ generateUniqueId()
```

### Dependencias Internas (dentro del archivo)
- Funciones que se llaman entre sí
- Variables de estado compartidas
- Event listeners que desencadenan funciones

---

## PATRONES DE DISEÑO USADOS

### 1. Factory Pattern
```javascript
createFloatingNote(data)       // Crea nuevas notas
createTemplateBlock(template)  // Crea bloques
createColorPalette()           // Crea paletas
```

### 2. Observer Pattern
```javascript
notesRegistry.setChangeListener()  // Observa cambios
scheduleNotesViewRefresh()         // Notifica cambios
```

### 3. State Management
```javascript
saveCurrentSelection()    // Guarda estado
restoreSelection()        // Restaura estado
imageViewerState          // Estado centralizado
```

### 4. Adapter Pattern
```javascript
sanitizeFloatingNotePasteHtml()   // Adapta HTML
sanitizeViewerImages()             // Adapta imágenes
sanitizeImageViewerState()         // Migración de estado
```

### 5. Singleton
```javascript
imageViewerState    // Una sola instancia
notesRegistry       // Una sola instancia
```

### 6. Strategy Pattern
```javascript
normalizeColorToHex()   // Estrategia de normalización
Multiple sortBy options // Estrategias de ordenamiento
```

---

## PROBLEMAS PRINCIPALES

### High Coupling
- Variables globales compartidas
- Funciones muy interdependientes
- Difícil de testear aisladamente

### Low Cohesion
- Funciones sin relación en el mismo archivo
- Responsabilidades mezcladas
- Lógica duplicada en algunos lugares

### Code Complexity
- 500+ funciones en un archivo
- Event listeners esparcidos
- Anidamiento profundo

### Mantenibilidad
- Búsqueda lenta de funciones
- Git diffs enormes
- Colaboración complicada

---

## CONSTANTES A EXTRAER

### Grupo 1: Imágenes
```javascript
IMAGE_MIN_WIDTH = 60
IMAGE_MAX_WIDTH = 1600
IMAGE_VIEWER_ZOOM_MIN = 0.25
IMAGE_VIEWER_ZOOM_MAX = 4
IMAGE_VIEWER_ZOOM_STEP = 0.25
```

### Grupo 2: Notas Flotantes
```javascript
FLOATING_NOTE_DEFAULT_WIDTH = 240
FLOATING_NOTE_MIN_WIDTH = 0
FLOATING_NOTE_BORDER_DEFAULT_COLOR = '#94a3b8'
NOTE_STYLE_PRESETS = [...]
```

### Grupo 3: Temas
```javascript
AVAILABLE_THEMES = [...]
DEFAULT_THEME = 'theme-blue'
AVAILABLE_TOPBAR_THEMES = [...]
```

### Grupo 4: Cache
```javascript
CACHE_STORAGE_KEY = 'emi2025-editor-cache-v1'
EXTENDED_CACHE_DB_NAME = 'emi2025-editor-cache'
IMAGE_VIEWER_STORAGE_KEY = 'emi2025-image-viewer'
```

---

## RECOMENDACIONES INMEDIATAS

### Antes de Modularizar
1. ✅ Crear backup del archivo
2. ✅ Commit actual de git
3. ✅ Documentar API actual
4. ✅ Crear tests de regresión

### Estrategia de Refactorización
1. Extraer constantes (LOW RISK)
2. Crear módulo de state management (MEDIUM RISK)
3. Extraer módulos por funcionalidad (MEDIUM RISK)
4. Consolidar event listeners (MEDIUM RISK)
5. Implementar dependency injection (HIGH RISK)

### Orden de Extracción Recomendado
1. **Phase 1**: Utilities, Constants (sin dependencias)
2. **Phase 2**: Cache, State Management (infraestructura)
3. **Phase 3**: Modules independientes (Image Viewer, Table, Template)
4. **Phase 4**: Modules dependientes (Note Management, Sections)
5. **Phase 5**: Core Integration

---

## CHECKLISTPARA MODULARIZACIÓN

### Preparación
- [ ] Backup de archivo original
- [ ] Branch de git creado
- [ ] Estructura de carpetas definida
- [ ] APIs documentadas

### Extracción
- [ ] Módulo 1: Note Management
- [ ] Módulo 2: Image Viewer
- [ ] Módulo 3: Table Editor
- [ ] Módulo 4: Template Blocks
- [ ] Módulo 5: Selection
- [ ] Módulo 6: Viewport
- [ ] Módulo 7: Sections
- [ ] Módulo 8: UI Components
- [ ] Módulo 9: Cache
- [ ] Módulo 10: Image Editor
- [ ] Módulo 11: Highlighting
- [ ] Módulo 12: Export
- [ ] Módulo 13: Utilities
- [ ] Módulo 14: Floating Note
- [ ] Módulo 15: State

### Testing
- [ ] Tests unitarios por módulo
- [ ] Tests de integración
- [ ] Tests E2E
- [ ] Performance baseline

### Documentación
- [ ] README por módulo
- [ ] Ejemplos de uso
- [ ] API reference
- [ ] Diagrama de dependencias

---

## MÉTRICAS ESPERADAS POST-REFACTORIZACIÓN

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Líneas por archivo (max) | 14,822 | 2,000 | 86% ↓ |
| Funciones por archivo (max) | 500+ | 80 | 84% ↓ |
| Ciclomática promedio | Alta | Media | 40% ↓ |
| Test coverage | <10% | >80% | 800% ↑ |
| Tiempo rebuild (hot) | ~2s | <100ms | 95% ↓ |
| Bundle size (gzipped) | Same | Same | 0% |

---

## RECURSOS ÚTILES

### Documentación Generada
- `EDITOR_ANALYSIS.md` - Análisis exhaustivo completo
- `MODULARIZATION_GUIDE.md` - Guía detallada de módulos
- `QUICK_REFERENCE.md` - Este archivo

### Archivos Relacionados
- `/home/user/EMIOCT2025/scripts/editor.js` - Archivo original
- `/home/user/EMIOCT2025/modules/notes/` - Módulo de notas
- `/home/user/EMIOCT2025/utils/` - Utilidades compartidas

---

## CONCLUSIÓN

El archivo `editor.js` es un **monolito bien estructurado pero necesita urgentemente modularización**. El análisis completo está disponible en `EDITOR_ANALYSIS.md`. La refactorización propuesta en 15 módulos es realizable en 4-6 semanas con el equipo adecuado.

**Próximos pasos**:
1. Revisar `MODULARIZATION_GUIDE.md`
2. Crear estructura de carpetas
3. Comenzar extracción de Módulo 1 (Note Management)
4. Implementar sistema de importación modular

