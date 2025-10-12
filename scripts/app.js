import { initializeEditor } from './editor.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeEditor()
    .then((editor) => {
      window.editorInstance = editor;
    })
    .catch((error) => {
      console.error('No se pudo inicializar el editor:', error);
    });
});
