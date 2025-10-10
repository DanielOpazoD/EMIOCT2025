import { initializeEditor } from './editor.js';

document.addEventListener('DOMContentLoaded', () => {
  initializeEditor().catch(error => {
    console.error('No se pudo inicializar el editor:', error);
  });
});
