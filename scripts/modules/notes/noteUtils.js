import { clamp } from '../../utils/dom.js';

export function computeInitialPosition(layer, offset = 0) {
  if (!layer) {
    return { left: 40 + (offset % 120), top: 80 + (offset % 160) };
  }
  const rect = layer.getBoundingClientRect();
  return {
    left: clamp(40 + (offset % 160), 0, Math.max(0, rect.width - 200)),
    top: clamp(80 + (offset % 200), 0, Math.max(0, rect.height - 200))
  };
}

export function restoreNotes(registry, notes, createNote) {
  if (!Array.isArray(notes)) return;
  notes.forEach((noteData) => {
    const note = createNote(noteData);
    if (note) {
      registry.add(note.serialize());
    }
  });
}
