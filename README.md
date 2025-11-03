# Cora Notes – Especificación Integral

## 1. Filosofía, propósito y público objetivo
- **Visión**: construir la última aplicación de notas que replique el cerebro humano mediante capas, conexiones y persistencia contextual. Cada sección, tema y nota flotante se entrelazan para mantener el contexto activo durante el estudio o la práctica clínica.
- **Posicionamiento**: competidor directo de OneNote/Evernote/Notion con énfasis en notas flotantes multicapa, supernotas tabuladas y una vista mágica que expande contenido sin perder el foco del documento.
- **Público objetivo principal**:
  - Estudiantes universitarios (especialmente ciencias de la salud) que necesitan integrar apuntes extensos, diagramas y recordatorios críticos.
  - Profesionales clínicos y de investigación que documentan casos, protocolos y hallazgos con referencias visuales.
  - Cualquier usuario que desee un entorno de escritura cognitivo con múltiples capas simultáneas y personalización profunda.

## 2. Arquitectura general de la interfaz web
La aplicación se estructura en capas visibles permanentes más capas flotantes, todas sincronizadas con el documento principal:

1. **Topbar fija**
   - Controles globales: zoom, desplazamiento horizontal, modo lectura, visor de notas, visor de imágenes, carga de HTML, impresión.
   - Botón de edición y menú de herramientas (exportar/importar JSON, estadísticas, exportar Markdown, copiar HTML, limpiar documento).
   - Selector de temas para la barra (gradientes premium) y acción de guardado en caché.

2. **Barra de edición avanzada**
   - Acciones de tipografía (tamaño, negrita, cursiva, subrayado), sangrías, resaltar, color de texto.
   - Copiar/pegar formato, plantillas, tablas, listas, símbolos, tarjetas plegables, espaciado personalizado.
   - Paletas emergentes, panel de espaciado y manejadores de tablas para edición precisa.

3. **Panel de navegación lateral (secciones y temas)**
   - Árbol jerárquico especialidad → sección → tema.
   - Búsqueda en tiempo real, creación/ordenamiento, indicadores de notas y estadísticas.
   - Modo de edición para renombrar/eliminar, impresión de secciones y contadores de palabras.

4. **Capa principal de documento**
   - Páginas de contenido continuo (`.page`) que se comportan como un rollo vertical.
   - Cada tema agrupa su contenido principal editable y mantiene ancladas sus notas flotantes.

5. **Capa de notas flotantes**
   - Contenedor fijo sobre el documento para notas arrastrables, redimensionables y tematizadas.
   - Mantiene visibilidad sincronizada con el viewport al desplazarse entre páginas.

6. **Magic View (capa mágica)**
   - Espacio expandible por tema activado con el botón ✨.
   - Se despliega a pantalla completa para contenido extendido (diagramas, casos clínicos, referencias largas) con botón flotante de retorno.

7. **Visor de imágenes integrado**
   - Biblioteca de imágenes asociada a cada documento con navegación, zoom, anotaciones y descargas.

8. **Gestor de notas (panel modal/lateral)**
   - Filtros por alcance (global/sección/tema), categoría, prioridad, búsqueda de texto, ordenamientos.
   - Acciones masivas: exportar, imprimir, marcar revisadas, eliminar.

## 3. Sistema de notas multicapa

### 3.1 Tipos y atributos principales
```ts
interface FloatingNote {
  id: string;
  topicId: string;         // tema al que pertenece
  sectionId: string;       // sección contenedora
  title: string;
  html: string;            // contenido rich text
  text: string;            // versión plano para búsquedas
  left: number;
  top: number;
  width: number | 'auto';
  height: number | 'auto';
  style: NoteStyleId;      // 19 estilos predefinidos
  borderColor?: string;
  borderWidth?: number;
  category?: string;       // etiquetas semánticas
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
  reviewed?: boolean;
  reviewCount?: number;
  compactHeader?: boolean;
  ultraCompact?: boolean;
  behindMainContent?: boolean;
  hoverAnimation?: boolean;
  styleNeutralText?: boolean;
  superNote?: boolean;     // habilita pestañas internas
  superTabs?: SuperTab[];
  anchors?: AnchorRef[];   // vínculos con texto del documento
  createdAt: number;
  updatedAt: number;
}

interface SuperTab {
  id: string;
  title: string;
  color?: string;
  pages: NotePage[];        // permite subpáginas por pestaña
  activePageId: string;
}
```

### 3.2 Comportamiento
- Redimensionamiento inteligente con `ResizeObserver`, arrastre desde cabecera y ajustes de ancho desde bordes laterales.
- Anclas de enlace (`<span class="note-anchor">`) que mantienen la referencia entre nota flotante y texto seleccionado en el documento.
- Estados especiales (compacto, ultra compacto, detrás del contenido, animación al hover) para adaptarse al flujo de estudio.
- Contadores de revisión y marcadores para seguimiento de estudio.

### 3.3 Supernotas y capas internas
- Cualquier nota puede transformarse en supernota, habilitando pestañas temáticas (Diagnóstico, Tratamiento, Seguimiento, etc.).
- Cada pestaña admite múltiples páginas internas con sincronización de contenido activo.
- Las supernotas heredan estilo, iconografía y posición de la nota base.

## 4. Flujo de navegación y persistencia visual
- El documento mantiene un registro de páginas (`pages = [...document.querySelectorAll('.page')]`) para simular una sola hoja continua.
- Estados de zoom y desplazamiento (`DOCUMENT_SHIFT_STEP`, `DOCUMENT_SHIFT_MIN/MAX`) garantizan que las notas flotantes se mantengan alineadas durante scroll y zoom.
- Banderas como `floatingNotesHidden`, `floatingNotesViewportRelaxedMatching` y `pendingFloatingNotesViewportSync` controlan visibilidad y sincronización con el viewport.
- Al crear una nota desde el icono contextual, se calcula la posición exacta sobre la capa flotante y se asegura su visibilidad inmediata.

## 5. Estética y personalización
- Sistema de temas globales (`theme-blue`, `theme-green`, `theme-purple`, `theme-orange`, `theme-teal`, `theme-rose`, `theme-sand`, `theme-slate`) que aplican variables CSS a cuerpo y páginas.
- Estilos específicos para la topbar (`topbar-color-default`, `topbar-color-slate`, `topbar-color-night`, `topbar-color-navy`, `topbar-color-sky`, `topbar-color-emerald`).
- 19 estilos de notas flotantes con gradientes, sombras suaves y tipografías optimizadas.
- Modo lectura con interfaz depurada y botón flotante para salir.
- Controles táctiles/ergonómicos: handles de notas, menús contextuales, paneles emergentes y botones flotantes.

## 6. Roadmap de modularización y modernización (Cora Notes 2.0)

### 6.1 Reestructura de archivos
```
src/
├── core/
│   ├── DocumentManager.js
│   ├── NoteRegistry.js
│   ├── StateManager.js
│   └── StorageManager.js
│
├── modules/
│   ├── editor/
│   │   ├── EditorController.js
│   │   ├── EditorToolbar.js
│   │   ├── RichTextEditor.js
│   │   └── TableManager.js
│   ├── notes/
│   │   ├── FloatingNoteManager.js
│   │   ├── SuperNoteManager.js
│   │   ├── NoteViewerController.js
│   │   └── NoteStyles.js
│   ├── sections/
│   │   ├── SectionManager.js
│   │   ├── TopicManager.js
│   │   ├── SectionPanel.js
│   │   └── SectionThemeManager.js
│   ├── magic/
│   │   ├── MagicViewManager.js
│   │   └── MagicContentManager.js
│   ├── image/
│   │   ├── ImageViewerManager.js
│   │   ├── ImageCropManager.js
│   │   └── ImageLibraryManager.js
│   ├── cloud/
│   │   ├── CloudSync.js
│   │   ├── FirebaseManager.js
│   │   └── ConflictResolver.js
│   ├── auth/
│   │   ├── AuthManager.js
│   │   ├── GoogleAuth.js
│   │   └── TokenManager.js
│   └── ai/
│       ├── AIEnhancer.js
│       ├── NoteOptimizer.js
│       ├── ContentAnalyzer.js
│       └── APIProviders.js
│
├── utils/
│   ├── id.js
│   ├── cache.js
│   ├── encryption.js
│   ├── sync-queue.js
│   └── helpers.js
│
├── ui/
│   ├── components/
│   │   ├── Modal.js
│   │   ├── Tooltip.js
│   │   ├── ColorPicker.js
│   │   └── ContextMenu.js
│   ├── themes/
│   │   ├── ThemeManager.js
│   │   └── themes.css
│   └── styles/
│       ├── main.css
│       ├── editor.css
│       ├── notes.css
│       ├── responsive.css
│       └── animations.css
│
├── types/
│   ├── index.d.ts
│   ├── Note.ts
│   ├── Section.ts
│   ├── User.ts
│   └── API.ts
│
└── index.js
```

### 6.2 Patrón de inicialización
```js
import { EditorController } from './modules/editor/EditorController.js';
import { AuthManager } from './modules/auth/AuthManager.js';
import { CloudSync } from './modules/cloud/CloudSync.js';
import { AIEnhancer } from './modules/ai/AIEnhancer.js';

class CoraNotesApp {
  async initialize() {
    this.auth = new AuthManager();
    await this.auth.initialize();

    this.editor = new EditorController({ userId: this.auth.userId });

    this.cloudSync = new CloudSync({
      userId: this.auth.userId,
      storageManager: this.editor.storageManager
    });

    this.ai = new AIEnhancer({ apiKey: process.env.OPENAI_API_KEY });

    this.setupEventBus();
    await this.loadDocument();
  }

  setupEventBus() {
    window.addEventListener('editor:editModeEntered', () => {
      this.cloudSync.startAutoSync();
    });

    window.addEventListener('note:created', (e) => {
      this.cloudSync.syncNote(e.detail);
    });
  }

  async loadDocument() {
    const doc = await this.cloudSync.getLatestDocument();
    await this.editor.loadDocument(doc);
  }
}

const app = new CoraNotesApp();
app.initialize().catch(console.error);
```

## 7. Sincronización en la nube

### 7.1 Objetivos
- Mantener documentos, notas y recursos sincronizados entre dispositivos.
- Operar en modo *offline-first* con colas de cambios y reconciliación de conflictos.
- Integrarse con Firebase (Realtime Database/Firestore) como backend de referencia.

### 7.2 CloudSync Manager
- Mantiene cola de cambios (`syncQueue`) con metadatos (`status`, `retries`, `lastSyncTime`).
- Ejecuta sincronización automática cada 30 segundos o al recuperar conexión.
- Resuelve conflictos mediante `ConflictResolver` con estrategias: AUTO, MANUAL, LAST_WRITE_WINS, MERGE.
- Descarga cambios remotos y los aplica al almacenamiento local evitando bucles (se ignoran cambios propios).

### 7.3 ConflictResolver
- Detección de diferencias de contenido vs metadatos.
- Resolución automática inteligente: intenta merge, conserva última modificación.
- Modal para resolución manual cuando es necesario (con detalles de versiones local/remota).
- Registro de conflictos (`_mergeConflict`, `_conflictInfo`).

### 7.4 Integración Firebase
```js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
```

## 8. Autenticación y gestión de sesión (Google/Gmail)

### 8.1 AuthManager
- Inicializa sesión, comprueba tokens guardados, emite eventos (`auth:authenticated`, `auth:unauthenticated`, `auth:authError`).
- `loginWithGoogle()` utiliza `GoogleAuth` para obtener credenciales y luego valida contra backend (`/api/auth/validate`).
- Gestiona tokens de acceso y refresh mediante `TokenManager`.
- Proporciona `getValidToken()` para módulos que requieran llamadas autenticadas.

### 8.2 GoogleAuth
- Carga dinámica de `https://accounts.google.com/gsi/client`.
- Renderiza botón o `prompt` automático para iniciar sesión.
- Decodifica JWT para obtener información básica del usuario (nombre, email, foto).
- `signOut()` deshabilita selección automática y limpia sesión.

### 8.3 TokenManager
- Almacena `idToken` y `refreshToken` (idealmente en `sessionStorage` + cookies HttpOnly en backend).
- Calcula expiración (`exp * 1000`) y refresca automáticamente antes de vencer.
- Permite limpieza completa al cerrar sesión.

## 9. Integración de IA

### 9.1 Objetivos
- Potenciar notas con resúmenes automáticos, generación de tarjetas, sugerencia de conexiones.
- Analizar contenido para detectar lagunas, proponer preguntas, sugerir recursos visuales.

### 9.2 Componentes
- `AIEnhancer`: fachada principal que recibe eventos (creación/edición de notas, selección de texto) y delega en otros módulos.
- `NoteOptimizer`: genera resúmenes, bullets, planes de estudio a partir de notas existentes.
- `ContentAnalyzer`: analiza el documento para identificar conceptos clave, redundancias, inconsistencias.
- `APIProviders`: abstracción para conectarse con modelos externos (OpenAI, Azure, servicios propietarios). Maneja cuotas, reintentos y fallback offline.

### 9.3 Flujos típicos
1. Usuario selecciona texto → `AIEnhancer.suggestSummary()` produce resumen/flashcards integrados como nota flotante.
2. Durante Magic View, `AIEnhancer.expandSection()` genera explicaciones extendidas o casos clínicos.
3. Panel de notas incluye sugerencias IA para repaso inteligente.

## 10. Importación y exportación (.json)
- **Importancia crítica**: posibilita respaldo completo de secciones, temas, notas y configuraciones. Es la base para migrar entre dispositivos y restaurar después de sincronizaciones fallidas.
- El formato JSON debe incluir:
  - Metadatos de documento (especialidad, fecha, tema activo, zoom).
  - Lista completa de secciones/temas con contenido HTML, Magic View asociado y anclas.
  - Registro de notas flotantes, supernotas, estilos personalizados, revisiones.
  - Recursos multimedia (referencias a archivos, metadata de visor de imágenes).
- Exportación disponible desde topbar (`Exportar JSON`) y desde panel de notas (exportación selectiva, Markdown).
- Importación permite fusionar con documento actual o reemplazar completamente (con vista previa y comprobaciones de conflicto).

## 11. Visor multimedia y anotaciones
- Biblioteca por documento con miniaturas, navegación previa/siguiente y zoom (0.25× a 4×).
- Anotaciones específicas por imagen (notas flotantes ancladas a coordenadas).
- Posibilidad de descargar, reemplazar o eliminar imágenes con historial.

## 12. Flujo de uso recomendado (ejemplo: estudiante de medicina)
1. Crear sección "Cardiología" y temas "Anatomía del corazón", "Arritmias", "Insuficiencia cardíaca".
2. Editar contenido principal de "Anatomía del corazón" con tablas y plantillas.
3. Activar Magic View (✨) para diagramas y casos extendidos.
4. Añadir nota flotante "Puntos clave" (estilo `rose`, prioridad alta, icono 💊) anclada a párrafo específico.
5. Convertir la nota en supernota con pestañas "Diagnóstico", "Tratamiento", "Seguimiento".
6. Gestionar notas desde el panel, filtrando por prioridad y marcando las revisadas.
7. Exportar secciones y notas a JSON como respaldo y sincronizar con la nube.

## 13. Comparativa rápida vs competidores
| Característica                  | Cora Notes | Notion | Evernote |
|--------------------------------|-----------|--------|----------|
| Notas flotantes multicapa      | ✅ Avanzadas | ❌ | ❌ |
| Supernotas con pestañas        | ✅ | ❌ | ❌ |
| Vista mágica por tema          | ✅ Única | ❌ | ❌ |
| Editor rich text completo      | ✅ | ✅ | ✅ |
| Tablas redimensionables        | ✅ | ✅ | ✅ |
| Temas visuales personalizables | ✅ (19+) | Limitado | Limitado |
| Exportación JSON/Markdown      | ✅ | ✅ | ✅ |
| Offline-first                  | ✅ (localStorage + IndexedDB) | ❌ | ✅ |
| Sincronización nube            | ✅ (Firebase) | ✅ | ✅ |
| Integración IA                 | ✅ (planificada) | Plugins | ❌ |
| Autenticación Google           | ✅ | ✅ | ✅ |

## 14. Lineamientos de desarrollo para futuras iteraciones
- Mantener separación estricta entre lógica (módulos) y presentación (componentes UI).
- Utilizar TypeScript para definir contratos de datos (`types/`).
- Implementar pruebas unitarias por módulo crítico (registries, sincronización, IA).
- Garantizar accesibilidad (teclado, ARIA en menús, contraste en temas).
- Documentar eventos globales (`editor:*`, `note:*`, `cloudSync:*`, `auth:*`) para facilitar extensiones.

---

Esta especificación sirve como guía integral para que otra IA o equipo humano construya Cora Notes desde cero, respetando la filosofía original y ampliándola con una arquitectura modular, sincronización en la nube, autenticación segura, integración de IA y soporte robusto de importación/exportación JSON.
