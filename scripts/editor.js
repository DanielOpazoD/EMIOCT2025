import { Editor } from './core/Editor.js';

export async function initializeEditor(options = {}) {
  const editor = new Editor(options);
  await editor.ready;
  return editor;
}

export { Editor };
