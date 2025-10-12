import { Editor } from './core/Editor.js';

let editorInstance = null;

export async function initializeEditor(options = {}) {
  const container = options.container || document.querySelector('[data-editor-root]') || document.body;
  if (!container.hasAttribute('data-editor-root')) {
    container.setAttribute('data-editor-root', '');
  }

  editorInstance = new Editor({
    ...options,
    container
  });

  await editorInstance.whenReady();
  return editorInstance;
}

export function getEditorInstance() {
  return editorInstance;
}

export { Editor };
