export const TEMPLATE_BACKGROUND_PALETTE_COLORS = [
  '#ffffff', '#f8f9fa', '#fef9e7', '#fff3cd', '#fde2e4', '#f8d7da', '#e7f3ff', '#d1e7dd', '#e9ecef'
];

export const TEMPLATE_TEXT_PALETTE_COLORS = [
  '#212529', '#343a40', '#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1', '#6c757d', '#ffffff'
];

export const TEMPLATE_BORDER_PALETTE_COLORS = [
  '#ced4da', '#adb5bd', '#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1', '#0dcaf0', '#6c757d', '#212529'
];

export const TEMPLATE_ACCENT_PALETTE_COLORS = [
  '#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1', '#ffc107', '#20c997', '#0dcaf0', '#6c757d'
];

export const TEMPLATE_NOTE_STYLE_PRESETS = [
  { id: 'classic', className: 'note-style-classic', extraClasses: [] },
  { id: 'sky', className: 'note-style-sky', extraClasses: [] },
  { id: 'forest', className: 'note-style-forest', extraClasses: [] },
  { id: 'sunrise', className: 'note-style-sunrise', extraClasses: [] },
  { id: 'rose', className: 'note-style-rose', extraClasses: [] },
  { id: 'lilac', className: 'note-style-lilac', extraClasses: [] },
  { id: 'slate', className: 'note-style-slate', extraClasses: [] },
  { id: 'pearl', className: 'note-style-pearl', extraClasses: ['pearl'] }
];

export const TEMPLATE_NOTE_STYLE_CLASSES = TEMPLATE_NOTE_STYLE_PRESETS.map((preset) => preset.className);

export function createTemplateNoteStylePresetMap() {
  return new Map(TEMPLATE_NOTE_STYLE_PRESETS.map((preset) => [preset.id, preset]));
}
