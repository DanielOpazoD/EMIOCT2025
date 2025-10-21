# Modularización de Cora Notes

## Estado Actual de la Refactorización

Se ha iniciado el proceso de modularización del archivo monolítico `scripts/editor.js` (14,822 líneas) en módulos más pequeños y manejables.

## ✅ Completado (Fase 1 - Fundamentos)

### 1. Estructura de Carpetas Creada

```
scripts/
├── editor/
│   ├── core/                    # Núcleo del editor
│   │   └── EditorState.js      ✅ Sistema de gestión de estado centralizado
│   │
│   ├── features/                # Funcionalidades principales
│   │   ├── floatingNotes/      ⏳ (Pendiente)
│   │   ├── imageViewer/        ⏳ (Pendiente)
│   │   ├── tables/             ⏳ (Pendiente)
│   │   ├── export/             ⏳ (Pendiente)
│   │   └── formatting/         ⏳ (Pendiente)
│   │
│   └── shared/                  # Código compartido
│       ├── constants/
│       │   └── editorConstants.js  ✅ Todas las constantes centralizadas
│       ├── utils/              ⏳ (Pendiente)
│       └── cache/
│           └── CacheManager.js ✅ Gestión de localStorage e IndexedDB
│
├── editor.js                    ⏳ (Pendiente refactorizar)
├── editor.js.backup            ✅ Backup del original
└── ...archivos existentes
```

### 2. Módulos Creados

#### ✅ EditorState.js (Core)
**Ubicación:** `scripts/editor/core/EditorState.js`

**Propósito:** Gestión centralizada del estado del editor

**Características:**
- Singleton con instancia `editorState`
- 50+ propiedades de estado organizadas
- Sistema de suscripción a cambios (`subscribe`)
- Métodos helper para resetear estados complejos
- Debugging mejorado con `getState()`

**Ejemplo de uso:**
```javascript
import { editorState } from './editor/core/EditorState.js';

// Obtener estado
console.log(editorState.currentZoom); // 1

// Actualizar estado
editorState.setState({ currentZoom: 1.5 });

// Suscribirse a cambios
const unsubscribe = editorState.subscribe('currentZoom', (newZoom) => {
  console.log('Zoom cambió a:', newZoom);
});

// Cancelar suscripción
unsubscribe();
```

#### ✅ editorConstants.js (Shared)
**Ubicación:** `scripts/editor/shared/constants/editorConstants.js`

**Propósito:** Centralizar todas las constantes del editor

**Categorías:**
- Aplicación (APP_NAME)
- Imágenes (min/max width, zoom, viewer)
- Notas Flotantes (estilos, colores, íconos)
- Viewport y Zoom
- Tablas
- Caché y Almacenamiento
- Temas
- Observadores

**Ejemplo de uso:**
```javascript
import {
  NOTE_STYLE_PRESETS,
  IMAGE_MIN_WIDTH,
  CACHE_STORAGE_KEY
} from './editor/shared/constants/editorConstants.js';

// Usar constantes
const styles = NOTE_STYLE_PRESETS;
const minWidth = IMAGE_MIN_WIDTH; // 60
```

#### ✅ CacheManager.js (Shared)
**Ubicación:** `scripts/editor/shared/cache/CacheManager.js`

**Propósito:** Gestionar caché con localStorage e IndexedDB

**Funciones exportadas:**
- `isQuotaExceededError(error)` - Detectar errores de cuota
- `openExtendedCacheDb()` - Abrir IndexedDB
- `writeExtendedCacheValue(value)` - Guardar en IndexedDB
- `readExtendedCacheValue()` - Leer de IndexedDB
- `clearExtendedCacheValue()` - Limpiar IndexedDB
- `getStylesheetTextForExport()` - Obtener CSS para exportar
- `clearStylesheetCache()` - Limpiar caché de CSS
- `resetExtendedCacheDb()` - Reset (útil para testing)

**Ejemplo de uso:**
```javascript
import {
  writeExtendedCacheValue,
  readExtendedCacheValue,
  isQuotaExceededError
} from './editor/shared/cache/CacheManager.js';

// Guardar datos
try {
  await writeExtendedCacheValue({ data: '...' });
} catch (error) {
  if (isQuotaExceededError(error)) {
    console.log('Cuota excedida!');
  }
}

// Leer datos
const data = await readExtendedCacheValue();
```

## 📋 Próximos Pasos (Fase 2 - Features)

### Prioridad Alta

1. **Extraer Notas Flotantes**
   - Crear `scripts/editor/features/floatingNotes/FloatingNotesManager.js`
   - Mover ~70 funciones y 3,500 líneas relacionadas
   - Funciones: `createFloatingNote`, `positionFloatingNote`, drag/resize, etc.

2. **Extraer Image Viewer**
   - Crear `scripts/editor/features/imageViewer/ImageViewerManager.js`
   - Mover ~50 funciones y 2,500 líneas relacionadas
   - Funciones: `openImageViewer`, `renderImageViewer`, navegación, etc.

3. **Extraer Table Editor**
   - Crear `scripts/editor/features/tables/TableManager.js`
   - Mover ~30 funciones y 1,500 líneas relacionadas
   - Funciones: `initializeTableMenu`, insertar/editar tablas, auto-resize, etc.

### Prioridad Media

4. **Extraer Export System**
   - Crear `scripts/editor/features/export/ExportManager.js`
   - Funciones de exportación a HTML, Markdown, JSON

5. **Extraer Formatting Tools**
   - Crear `scripts/editor/features/formatting/TextFormatter.js`
   - Bold, italic, underline, colores, listas, etc.

6. **Extraer Utilities**
   - Crear `scripts/editor/shared/utils/domUtils.js`
   - Funciones helper de DOM, selección, etc.

## 🔧 Cómo Continuar la Modularización

### Paso 1: Identificar Funciones a Extraer

Usar EDITOR_ANALYSIS.md para ver el listado completo de funciones por categoría.

### Paso 2: Crear Módulo

```bash
# Ejemplo: Crear módulo de notas flotantes
touch scripts/editor/features/floatingNotes/FloatingNotesManager.js
```

### Paso 3: Extraer Funciones

1. Copiar funciones relacionadas del `editor.js` original
2. Convertir a exports:
   ```javascript
   // Antes (en editor.js)
   function createFloatingNote(data) { ... }

   // Después (en FloatingNotesManager.js)
   export function createFloatingNote(data) { ... }
   ```

3. Importar dependencias necesarias:
   ```javascript
   import { editorState } from '../../core/EditorState.js';
   import { NOTE_STYLE_PRESETS } from '../../shared/constants/editorConstants.js';
   ```

### Paso 4: Actualizar editor.js

```javascript
// Importar módulo
import { createFloatingNote } from './editor/features/floatingNotes/FloatingNotesManager.js';

// Usar función importada
const note = createFloatingNote({ title: 'Test' });
```

### Paso 5: Probar

```bash
# Abrir index.html en navegador
# Verificar que todo funciona correctamente
```

## 📊 Métricas de Progreso

| Fase | Completado | Pendiente | % Progreso |
|------|-----------|-----------|------------|
| Fase 1: Fundamentos | 3 módulos | 0 | 100% ✅ |
| Fase 2: Features | 0 módulos | 5 | 0% |
| Fase 3: Integration | 0 | 1 | 0% |
| **TOTAL** | **3** | **6** | **33%** |

## 🎯 Objetivos Finales

### Métricas Esperadas Post-Refactorización Completa

| Métrica | Antes | Objetivo | Mejora |
|---------|-------|----------|--------|
| Líneas por archivo (max) | 14,822 | <500 | 97% ↓ |
| Funciones por archivo (max) | 500+ | <50 | 90% ↓ |
| Archivos JS | 8 | 25+ | 200% ↑ |
| Reusabilidad | Baja | Alta | ✅ |
| Testabilidad | <5% | >80% | 1500% ↑ |

## 🚀 Comandos Útiles

```bash
# Ver estructura actual
tree scripts/editor -L 3

# Buscar funciones en editor.js original
grep -n "function " scripts/editor.js | wc -l

# Verificar imports rotos
npm run lint  # (si configurado)

# Ejecutar tests
npm test
```

## 📚 Documentación de Referencia

- **EDITOR_ANALYSIS.md** - Análisis exhaustivo de 1,314 líneas del código original
- **MODULARIZATION_GUIDE.md** - Guía detallada de 933 líneas con plan completo
- **QUICK_REFERENCE.md** - Referencia rápida de 312 líneas

## ⚠️ Notas Importantes

1. **No modificar editor.js.backup** - Es el respaldo del original
2. **Probar frecuentemente** - Verificar que la app funciona después de cada extracción
3. **Commits frecuentes** - Hacer commit después de cada módulo completado
4. **Mantener compatibilidad** - Asegurar que las funciones exportadas mantengan las mismas firmas

## 💡 Siguiente Acción Recomendada

```bash
# 1. Revisar documentación de análisis
cat QUICK_REFERENCE.md

# 2. Comenzar con el módulo de notas flotantes (el más grande)
# Crear archivo y comenzar extracción
touch scripts/editor/features/floatingNotes/FloatingNotesManager.js

# 3. Buscar todas las funciones relacionadas con "floatingNote" en el original
grep -n "function.*floatingNote" scripts/editor.js.backup > floating_notes_functions.txt
```

¿Quieres que continúe con la extracción de algún módulo específico (notas flotantes, image viewer, tablas)?
