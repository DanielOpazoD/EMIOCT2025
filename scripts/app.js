import { initializeEditor } from './editor.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const editor = await initializeEditor({
      config: {
        modules: {
          notes: {
            defaultWidth: 300,
            maxVisible: 25
          }
        },
        ui: {
          theme: 'dark'
        }
      }
    });

    editor.on('note:created', (note) => {
      console.debug('Nueva nota creada', note);
    });
  } catch (error) {
    console.error('No se pudo inicializar el editor:', error);
  }
});
