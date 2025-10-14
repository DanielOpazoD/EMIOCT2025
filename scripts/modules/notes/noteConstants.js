export const NOTE_TYPES = Object.freeze({
  FLOATING: 'floating',
  MARGIN: 'margin',
  INLINE: 'inline',
  FOOTNOTE: 'footnote',
  SUPER: 'super'
});

export const NOTE_CATEGORIES = Object.freeze({
  IMPORTANT: { icon: '⚠️', color: '#dc3545', label: 'Importante' },
  PEARL: { icon: '💎', color: '#6f42c1', label: 'Perla clínica' },
  REMEMBER: { icon: '🔔', color: '#fd7e14', label: 'Recordar' },
  QUESTION: { icon: '❓', color: '#0dcaf0', label: 'Duda' },
  REFERENCE: { icon: '📚', color: '#198754', label: 'Referencia' },
  TODO: { icon: '☑️', color: '#6c757d', label: 'Por hacer' },
  PERSONAL: { icon: '✍️', color: '#0d6efd', label: 'Personal' }
});

export const NOTE_PRIORITY_SEQUENCE = ['normal', 'high', 'low'];
export const DEFAULT_NOTE_PRIORITY = 'normal';
export const DEFAULT_NOTE_CATEGORY = 'PERSONAL';
export const DEFAULT_NOTE_TYPE = NOTE_TYPES.FLOATING;
export const DEFAULT_NOTE_STYLE = 'blank';

export const SUPER_NOTE_DEFAULT_TAB_COLOR = '#334155';
export const SUPER_NOTE_TAB_TITLE_MAX_LENGTH = 25;
export const SUPER_NOTE_PRESET_COLORS = Object.freeze([
  '#334155',
  '#0f172a',
  '#1d4ed8',
  '#0ea5e9',
  '#10b981',
  '#22c55e',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#6366f1'
]);
