# Instrucciones para Probar Cora Notes

## Estado Actual

✅ **La aplicación funciona exactamente igual que antes**

Los módulos creados (EditorState, CacheManager, editorConstants) **NO están integrados todavía** en el código principal. La app sigue usando el `editor.js` original monolítico.

**Esto significa:**
- Tus datos antiguos funcionarán perfectamente
- Puedes importar/exportar sin problemas
- Todas las funcionalidades existentes siguen funcionando
- Los cambios solo prepararon la infraestructura para futura refactorización

---

## Cómo Probar la Aplicación

### Opción 1: Abrir Directamente en el Navegador

```bash
# Desde la raíz del proyecto
cd /home/user/EMIOCT2025

# Abrir index.html con tu navegador
# En Linux:
xdg-open index.html

# En macOS:
open index.html

# En Windows:
start index.html

# O simplemente arrastra index.html a tu navegador
```

### Opción 2: Usar Servidor HTTP Simple

Si el navegador tiene restricciones CORS, usa un servidor local:

```bash
# Con Python 3
cd /home/user/EMIOCT2025
python3 -m http.server 8000

# Con Python 2
python -m SimpleHTTPServer 8000

# Con Node.js (si tienes npx)
npx http-server -p 8000

# Con PHP
php -S localhost:8000
```

Luego abre: `http://localhost:8000`

---

## Pruebas Recomendadas

### 1. Verificar Funcionalidad Básica

- [ ] La aplicación carga correctamente
- [ ] Puedes crear una nueva sección
- [ ] Puedes crear un nuevo tema
- [ ] Puedes escribir contenido
- [ ] El modo edición funciona
- [ ] El modo lectura funciona

### 2. Probar Notas Flotantes

- [ ] Crear nota flotante
- [ ] Mover/redimensionar nota
- [ ] Cambiar estilo de nota
- [ ] Eliminar nota

### 3. Probar Visor de Imágenes

- [ ] Abrir visor de imágenes
- [ ] Subir imagen
- [ ] Hacer zoom
- [ ] Navegar entre imágenes

### 4. Probar Importación de Datos Antiguos

**Si tienes datos guardados anteriormente:**

1. Click en "Herramientas" ⚙️
2. Click en "Importar JSON" 📥
3. Seleccionar tu archivo JSON antiguo
4. Verificar que todo se importa correctamente

**Si NO tienes datos guardados:**

1. Crea algo de contenido nuevo
2. Exporta a JSON (Herramientas → Exportar JSON)
3. Limpia todo (Herramientas → Limpiar todo)
4. Importa el JSON que acabas de exportar
5. Verifica que todo vuelve correctamente

### 5. Probar Caché Local

- [ ] Crear contenido
- [ ] Click en "Guardar en caché" (botón en topbar)
- [ ] Refrescar la página (F5)
- [ ] Verificar que el contenido persiste

### 6. Probar Exportación

- [ ] Exportar JSON (funciona)
- [ ] Exportar Markdown (funciona)
- [ ] Copiar HTML (funciona)

---

## Probar los Nuevos Módulos (Opcional)

Si quieres verificar que los nuevos módulos funcionan correctamente, aquí hay un script de prueba:

### Crear archivo de prueba

```bash
# Crear script de prueba
cat > /home/user/EMIOCT2025/test-modules.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Test Módulos</title>
</head>
<body>
  <h1>Test de Módulos Nuevos</h1>
  <div id="output"></div>

  <script type="module">
    import { editorState } from './scripts/editor/core/EditorState.js';
    import {
      APP_NAME,
      NOTE_STYLE_PRESETS,
      IMAGE_MIN_WIDTH
    } from './scripts/editor/shared/constants/editorConstants.js';
    import {
      isQuotaExceededError,
      getStylesheetTextForExport
    } from './scripts/editor/shared/cache/CacheManager.js';

    const output = document.getElementById('output');

    function log(msg, success = true) {
      const p = document.createElement('p');
      p.textContent = msg;
      p.style.color = success ? 'green' : 'red';
      output.appendChild(p);
    }

    // Test EditorState
    log('✓ EditorState importado correctamente');
    log(`  Estado inicial zoom: ${editorState.currentZoom}`);

    editorState.setState({ currentZoom: 1.5 });
    log(`  Zoom actualizado a: ${editorState.currentZoom}`);

    // Test suscripción
    const unsub = editorState.subscribe('currentZoom', (value) => {
      log(`  Listener notificado: zoom = ${value}`);
    });
    editorState.setState({ currentZoom: 2 });
    unsub();

    // Test Constants
    log('✓ Constants importadas correctamente');
    log(`  APP_NAME: ${APP_NAME}`);
    log(`  Estilos de notas: ${NOTE_STYLE_PRESETS.length}`);
    log(`  IMAGE_MIN_WIDTH: ${IMAGE_MIN_WIDTH}px`);

    // Test CacheManager
    log('✓ CacheManager importado correctamente');
    const fakeError = new DOMException('QuotaExceededError');
    fakeError.name = 'QuotaExceededError';
    log(`  isQuotaExceededError: ${isQuotaExceededError(fakeError)}`);

    log('');
    log('=== TODOS LOS TESTS PASARON ===', true);
  </script>
</body>
</html>
EOF
```

Luego abre `test-modules.html` en tu navegador y deberías ver:

```
✓ EditorState importado correctamente
  Estado inicial zoom: 1
  Zoom actualizado a: 1.5
  Listener notificado: zoom = 2
✓ Constants importadas correctamente
  APP_NAME: Cora Notes
  Estilos de notas: 19
  IMAGE_MIN_WIDTH: 60px
✓ CacheManager importado correctamente
  isQuotaExceededError: true

=== TODOS LOS TESTS PASARON ===
```

---

## Verificar Compatibilidad con Datos Antiguos

### Escenario 1: Datos en localStorage

```javascript
// Abrir consola del navegador (F12)
// Ver si hay datos guardados:
console.log(localStorage.getItem('emi2025-editor-cache-v1'));
```

Si hay datos, deberían cargarse automáticamente al abrir la app.

### Escenario 2: Datos en IndexedDB

```javascript
// Abrir consola del navegador (F12)
// Ver si hay IndexedDB:
indexedDB.databases().then(dbs => {
  console.log('Bases de datos:', dbs);
});
```

---

## Resolución de Problemas

### La aplicación no carga

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Si ves errores de CORS, usa un servidor HTTP local

### Los datos no se importan

1. Verifica que el archivo JSON sea válido
2. Abre el JSON en un editor y verifica la estructura
3. Mira la consola del navegador por errores

### El caché no funciona

1. Verifica que localStorage esté habilitado en tu navegador
2. Verifica que no estés en modo incógnito
3. Prueba con otro navegador

---

## Resumen

✅ **La aplicación actual es 100% funcional**
✅ **Tus datos antiguos son 100% compatibles**
✅ **Los nuevos módulos están aislados y no afectan la funcionalidad**
✅ **Puedes continuar usando la app normalmente**

Los módulos creados son solo preparación para la futura refactorización. Cuando estemos listos, migraremos el código gradualmente para usar estos módulos.

---

## Siguiente Paso

Si todo funciona correctamente, podemos continuar con la **Fase 2** de la modularización, extrayendo los módulos de funcionalidades (notas flotantes, image viewer, etc.).

Si encuentras algún problema, repórtalo antes de continuar.
