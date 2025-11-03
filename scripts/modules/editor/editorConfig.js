export const APP_NAME = 'Cora Notes';

export const IMAGE_MIN_WIDTH = 60;
export const IMAGE_MAX_WIDTH = 1600;
export const IMAGE_RESIZE_STEP = 0.1;

export const NOTE_STYLE_PRESETS = [
  { id: 'blank', name: 'Blanca', className: 'floating-note-style-blank' },
  { id: 'default', name: 'Clásica', className: 'floating-note-style-default' },
  { id: 'sky', name: 'Cielo', className: 'floating-note-style-sky' },
  { id: 'mint', name: 'Menta', className: 'floating-note-style-mint' },
  { id: 'rose', name: 'Pétalo', className: 'floating-note-style-rose' },
  { id: 'lilac', name: 'Lavanda', className: 'floating-note-style-lilac' },
  { id: 'slate', name: 'Pizarra', className: 'floating-note-style-slate' },
  { id: 'citrus', name: 'Cítrica', className: 'floating-note-style-citrus' },
  { id: 'midnight', name: 'Nocturna', className: 'floating-note-style-midnight' },
  { id: 'dawn', name: 'Aurora', className: 'floating-note-style-dawn' },
  { id: 'forest', name: 'Bosque', className: 'floating-note-style-forest' },
  { id: 'sand', name: 'Arena', className: 'floating-note-style-sand' },
  { id: 'peach', name: 'Durazno', className: 'floating-note-style-peach' },
  { id: 'ice', name: 'Hielo', className: 'floating-note-style-ice' },
  { id: 'sage', name: 'Salvia', className: 'floating-note-style-sage' },
  { id: 'morning', name: 'Matinal', className: 'floating-note-style-morning' },
  { id: 'breeze', name: 'Brisa', className: 'floating-note-style-breeze' },
  { id: 'mist', name: 'Niebla', className: 'floating-note-style-mist' },
  { id: 'spring', name: 'Primavera', className: 'floating-note-style-spring' }
];

export const FLOATING_NOTE_BORDER_DEFAULT_COLOR = '#94a3b8';
export const FLOATING_NOTE_BORDER_DEFAULT_WIDTH = 1;
export const FLOATING_NOTE_BORDER_COLORS = [
  '#000000',
  '#1f2937',
  '#475569',
  '#94a3b8',
  '#fecaca',
  '#fde68a',
  '#bbf7d0',
  '#bae6fd',
  '#ddd6fe',
  '#fbcfe8',
  '#fef3c7'
];

export const NOTE_ICON_SYMBOLS = [
  '📌', '🔑', '⭐', '✔️', '💊', '📝', '📂', '🩻', '🩺', '📍', '📊', '⚠️', '✍️'
];

export const ICON_FEATURE_ENABLED = true;

export const IMAGE_VIEWER_DEFAULT_CONTEXT_KEY = 'global';
export const IMAGE_VIEWER_STORAGE_KEY = 'emi2025-image-viewer';
export const IMAGE_VIEWER_ZOOM_MIN = 0.25;
export const IMAGE_VIEWER_ZOOM_MAX = 4;
export const IMAGE_VIEWER_ZOOM_STEP = 0.25;

export const FLOATING_NOTE_DEFAULT_WIDTH = 240;
export const FLOATING_NOTE_MIN_WIDTH = 0;
export const FLOATING_NOTE_MIN_HEIGHT = 0;

export const DOCUMENT_SHIFT_STEP = 80;
export const DOCUMENT_SHIFT_MIN = -1500;
export const DOCUMENT_SHIFT_MAX = 1500;

export const AVAILABLE_THEMES = [
  'theme-blue',
  'theme-green',
  'theme-purple',
  'theme-orange',
  'theme-teal',
  'theme-rose',
  'theme-sand',
  'theme-slate'
];

export const DEFAULT_THEME = 'theme-blue';

export const AVAILABLE_TOPBAR_THEMES = [
  'topbar-color-default',
  'topbar-color-slate',
  'topbar-color-night',
  'topbar-color-navy',
  'topbar-color-sky',
  'topbar-color-emerald'
];

export const TOPBAR_THEME_STORAGE_KEY = 'emi2025-topbar-theme';

export const CACHE_STORAGE_KEY = 'emi2025-editor-cache-v1';
export const EXTENDED_CACHE_DB_NAME = 'emi2025-editor-cache';
export const EXTENDED_CACHE_STORE_NAME = 'snapshots';
