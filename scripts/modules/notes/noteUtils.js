import {
  NOTE_PRIORITY_SEQUENCE,
  DEFAULT_NOTE_PRIORITY,
  NOTE_CATEGORIES,
  DEFAULT_NOTE_CATEGORY
} from './noteConstants.js';

export function normalizePriority(priority) {
  const normalized = String(priority || '').toLowerCase();
  return NOTE_PRIORITY_SEQUENCE.includes(normalized) ? normalized : DEFAULT_NOTE_PRIORITY;
}

export function getNoteCategoryInfo(category) {
  return NOTE_CATEGORIES[category] || NOTE_CATEGORIES[DEFAULT_NOTE_CATEGORY];
}

export function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map(tag => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(tag => tag.length > 0);
}

export function escapeHtml(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getNotePlainTextFromHtml(html = '') {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || '').trim();
}

export function getNoteDisplayTitle(title, fallback = '') {
  if (title === null || title === undefined) {
    return fallback;
  }
  return title;
}
