import { Editor } from './core/Editor.js';

let editorInstance = null;

export async function initializeEditor(options = {}) {
  if (editorInstance) {
    return editorInstance;
  }

  editorInstance = new Editor({
    container: options.container || document.getElementById('editor-container') || document.body,
    config: options.config || {}
  });

  await editorInstance.ready;
  return editorInstance;
}

export { Editor };
