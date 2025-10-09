import { generateUniqueId } from '../../utils/id.js';
import {
  NOTE_TYPES,
  NOTE_CATEGORIES,
  NOTE_PRIORITY_SEQUENCE,
  DEFAULT_NOTE_PRIORITY,
  DEFAULT_NOTE_CATEGORY,
  DEFAULT_NOTE_TYPE
} from './noteConstants.js';
import {
  normalizePriority,
  sanitizeTags
} from './noteUtils.js';

export function createEnhancedNote(options = {}) {
  const nowIso = new Date().toISOString();
  const id = (options.id && String(options.id).trim()) || generateUniqueId('note');
  const type = Object.values(NOTE_TYPES).includes(options.type)
    ? options.type
    : DEFAULT_NOTE_TYPE;
  const categoryKey = (options.category && String(options.category).toUpperCase()) || DEFAULT_NOTE_CATEGORY;
  const category = NOTE_CATEGORIES[categoryKey] ? categoryKey : DEFAULT_NOTE_CATEGORY;
  const priority = normalizePriority(options.priority);
  const tags = sanitizeTags(options.tags);
  const createdAt = options.createdAt ? String(options.createdAt) : nowIso;
  const updatedAt = options.updatedAt ? String(options.updatedAt) : nowIso;

  let title = null;
  if (typeof options.title === 'string') {
    title = options.title.trim();
  } else if (options.title === null) {
    title = null;
  }

  return {
    id,
    type,
    category,
    style: (options.style && String(options.style)) || 'default',
    title,
    content: typeof options.content === 'string' ? options.content : '',
    html: typeof options.html === 'string' ? options.html : '',
    linkedTo: options.linkedTo || null,
    topicId: options.topicId || null,
    sectionId: options.sectionId || null,
    tags,
    priority,
    createdAt,
    updatedAt,
    reviewed: !!options.reviewed,
    reviewCount: Number.isFinite(options.reviewCount) ? Number(options.reviewCount) : 0,
    lastReviewed: options.lastReviewed || null,
    left: Number.isFinite(options.left) ? Number(options.left) : null,
    top: Number.isFinite(options.top) ? Number(options.top) : null,
    width: Number.isFinite(options.width) ? Number(options.width) : null,
    height: Number.isFinite(options.height) ? Number(options.height) : null,
    pageOffsetLeft: Number.isFinite(options.pageOffsetLeft) ? Number(options.pageOffsetLeft) : null,
    pageOffsetTop: Number.isFinite(options.pageOffsetTop) ? Number(options.pageOffsetTop) : null,
    relativeLeft: Number.isFinite(options.relativeLeft) ? Number(options.relativeLeft) : null,
    relativeTop: Number.isFinite(options.relativeTop) ? Number(options.relativeTop) : null,
    anchorId: options.anchorId || null,
    element: options.element || null
  };
}

export class NoteRegistry {
  constructor({ onChange } = {}) {
    this._notes = new Map();
    this._onChange = typeof onChange === 'function' ? onChange : () => {};
  }

  setChangeListener(listener) {
    this._onChange = typeof listener === 'function' ? listener : () => {};
  }

  get size() {
    return this._notes.size;
  }

  get(noteId) {
    return this._notes.get(noteId);
  }

  has(noteId) {
    return this._notes.has(noteId);
  }

  values() {
    return this._notes.values();
  }

  entries() {
    return this._notes.entries();
  }

  keys() {
    return this._notes.keys();
  }

  forEach(callback) {
    return this._notes.forEach(callback);
  }

  set(noteId, noteData, options = {}) {
    const { silent = false } = options || {};
    this._notes.set(noteId, noteData);
    if (!silent) {
      this._notifyChange();
    }
    return this;
  }

  ensure(noteId, overrides = {}) {
    const id = (noteId && String(noteId).trim()) || generateUniqueId('note');
    let existing = this._notes.get(id);

    if (!existing) {
      existing = createEnhancedNote({ id, ...overrides });
    } else if (overrides && typeof overrides === 'object') {
      const merged = { ...existing };
      Object.keys(overrides).forEach((key) => {
        if (key === 'tags') {
          merged.tags = sanitizeTags(overrides.tags);
        } else if (key === 'priority') {
          merged.priority = normalizePriority(overrides.priority);
        } else if (key === 'category') {
          const catKey = overrides.category ? String(overrides.category).toUpperCase() : DEFAULT_NOTE_CATEGORY;
          merged.category = NOTE_CATEGORIES[catKey] ? catKey : DEFAULT_NOTE_CATEGORY;
        } else if (key === 'type') {
          merged.type = Object.values(NOTE_TYPES).includes(overrides.type) ? overrides.type : DEFAULT_NOTE_TYPE;
        } else if (key === 'reviewed') {
          merged.reviewed = !!overrides.reviewed;
        } else if (key === 'reviewCount') {
          merged.reviewCount = Number.isFinite(overrides.reviewCount)
            ? Number(overrides.reviewCount)
            : merged.reviewCount;
        } else if (key === 'title') {
          if (typeof overrides.title === 'string') {
            merged.title = overrides.title.trim();
          } else if (overrides.title === null) {
            merged.title = null;
          }
        } else if (
          key === 'left' ||
          key === 'top' ||
          key === 'width' ||
          key === 'height' ||
          key === 'pageOffsetLeft' ||
          key === 'pageOffsetTop' ||
          key === 'relativeLeft' ||
          key === 'relativeTop'
        ) {
          merged[key] = Number.isFinite(overrides[key]) ? Number(overrides[key]) : merged[key];
        } else if (overrides[key] !== undefined) {
          merged[key] = overrides[key];
        }
      });

      if (!overrides.updatedAt) {
        merged.updatedAt = new Date().toISOString();
      }

      existing = merged;
    }

    this._notes.set(id, existing);
    return existing;
  }

  update(noteId, updates = {}, options = {}) {
    if (!noteId) return null;
    const { silent = false } = options || {};
    const current = this.ensure(noteId);
    const next = this.ensure(noteId, { ...current, ...updates, id: noteId });
    this._notes.set(noteId, next);
    if (!silent) {
      this._notifyChange();
    }
    return next;
  }

  delete(noteId, options = {}) {
    const { silent = false } = options || {};
    const removed = this._notes.delete(noteId);
    if (removed && !silent) {
      this._notifyChange();
    }
    return removed;
  }

  remove(noteId, options = {}) {
    return this.delete(noteId, options);
  }

  clear(options = {}) {
    const { silent = false } = options || {};
    if (this._notes.size === 0) {
      return;
    }
    this._notes.clear();
    if (!silent) {
      this._notifyChange();
    }
  }

  _notifyChange() {
    try {
      this._onChange();
    } catch (error) {
      console.error('Error notifying note registry change', error);
    }
  }
}

export {
  NOTE_TYPES,
  NOTE_CATEGORIES,
  NOTE_PRIORITY_SEQUENCE,
  DEFAULT_NOTE_PRIORITY,
  DEFAULT_NOTE_CATEGORY,
  DEFAULT_NOTE_TYPE
};
