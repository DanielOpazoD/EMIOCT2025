import { generateUniqueId } from '../../utils/id.js';
import {
  NOTE_TYPES,
  NOTE_CATEGORIES,
  NOTE_PRIORITY_SEQUENCE,
  DEFAULT_NOTE_PRIORITY,
  DEFAULT_NOTE_CATEGORY,
  DEFAULT_NOTE_TYPE,
  DEFAULT_NOTE_STYLE
} from './noteConstants.js';
import {
  normalizePriority,
  sanitizeTags,
  getNotePlainTextFromHtml,
  sanitizeNoteTitleHtml,
  getNoteTitlePlainText,
  escapeHtml
} from './noteUtils.js';

function normalizeBooleanFlag(value, defaultValue = false) {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return defaultValue;
}

function createNormalizedNotePage(rawPage = {}, {
  fallbackHtml = '',
  fallbackContent = ''
} = {}, seenIds = new Set()) {
  const base = rawPage && typeof rawPage === 'object' ? { ...rawPage } : {};
  let id = base.id ? String(base.id).trim() : '';
  while (!id || seenIds.has(id)) {
    id = generateUniqueId('note-page');
  }
  seenIds.add(id);

  const html = typeof base.html === 'string' ? base.html : fallbackHtml;
  const content = typeof base.content === 'string'
    ? base.content
    : (html ? getNotePlainTextFromHtml(html) : fallbackContent);
  const title = typeof base.title === 'string' ? base.title.trim() : null;
  const createdAt = base.createdAt ? String(base.createdAt) : new Date().toISOString();
  const updatedAt = base.updatedAt ? String(base.updatedAt) : new Date().toISOString();

  return {
    id,
    title,
    html,
    content,
    createdAt,
    updatedAt
  };
}

function normalizeNotePages(pagesInput, options = {}) {
  const { fallbackHtml = '', fallbackContent = '' } = options || {};
  const seenIds = new Set();
  const source = Array.isArray(pagesInput) ? pagesInput : [];
  const normalized = source
    .map(page => createNormalizedNotePage(page, { fallbackHtml, fallbackContent }, seenIds))
    .filter(Boolean);

  if (normalized.length === 0) {
    normalized.push(createNormalizedNotePage({}, { fallbackHtml, fallbackContent }, seenIds));
  }

  return normalized;
}

const DEFAULT_SUPER_TAB_COLOR = '#334155';

function normalizeTabColor(value, fallback = DEFAULT_SUPER_TAB_COLOR) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function createNormalizedSuperTab(rawTab = {}, options = {}, seenTabIds = new Set()) {
  const base = rawTab && typeof rawTab === 'object' ? { ...rawTab } : {};
  let id = base.id ? String(base.id).trim() : '';
  while (!id || seenTabIds.has(id)) {
    id = generateUniqueId('note-tab');
  }
  seenTabIds.add(id);

  const fallbackHtml = typeof base.html === 'string' ? base.html : options.fallbackHtml || '';
  const fallbackContent = typeof base.content === 'string' ? base.content : options.fallbackContent || '';
  const pages = normalizeNotePages(base.pages, { fallbackHtml, fallbackContent });

  let currentIndex = Number.isInteger(base.currentPageIndex) ? base.currentPageIndex : 0;
  currentIndex = Math.min(Math.max(currentIndex, 0), pages.length - 1);
  const activePage = pages[currentIndex] || pages[0];

  const title = typeof base.title === 'string' ? base.title.trim() : '';
  const createdAt = base.createdAt ? String(base.createdAt) : new Date().toISOString();
  const updatedAt = base.updatedAt ? String(base.updatedAt) : createdAt;

  return {
    id,
    title: title.length ? title : null,
    color: normalizeTabColor(base.color),
    pages,
    currentPageIndex: currentIndex,
    html: typeof base.html === 'string' ? base.html : (activePage?.html || ''),
    content: typeof base.content === 'string' ? base.content : (activePage?.content || ''),
    createdAt,
    updatedAt
  };
}

function normalizeSuperNoteTabs(tabsInput, options = {}) {
  const seenIds = new Set();
  const source = Array.isArray(tabsInput) ? tabsInput : [];
  const normalized = source
    .map(tab => createNormalizedSuperTab(tab, options, seenIds))
    .filter(Boolean);

  if (normalized.length === 0) {
    normalized.push(createNormalizedSuperTab({}, options, seenIds));
  }

  return normalized;
}

function applyPageStateToNote(note, overrides = {}) {
  const fallbackHtml = typeof overrides.html === 'string'
    ? overrides.html
    : (note.html || '');
  const fallbackContent = typeof overrides.content === 'string'
    ? overrides.content
    : (note.content || '');

  const pages = normalizeNotePages(
    overrides.pages !== undefined ? overrides.pages : note.pages,
    { fallbackHtml, fallbackContent }
  );

  let currentIndex = Number.isInteger(overrides.currentPageIndex)
    ? overrides.currentPageIndex
    : (Number.isInteger(note.currentPageIndex) ? note.currentPageIndex : 0);
  currentIndex = Math.min(Math.max(currentIndex, 0), pages.length - 1);

  if (typeof overrides.html === 'string' || typeof overrides.content === 'string') {
    const nowIso = overrides.updatedAt ? String(overrides.updatedAt) : new Date().toISOString();
    const targetPage = pages[currentIndex];
    const updatedPage = {
      ...targetPage,
      html: typeof overrides.html === 'string' ? overrides.html : targetPage.html,
      content: typeof overrides.content === 'string' ? overrides.content : targetPage.content,
      updatedAt: nowIso
    };
    pages[currentIndex] = updatedPage;
  }

  const activePage = pages[currentIndex] || pages[0];

  return {
    ...note,
    pages,
    currentPageIndex: currentIndex,
    html: activePage?.html || '',
    content: activePage?.content || ''
  };
}

function applySuperNoteState(note, overrides = {}) {
  const hasTabsOverride = Array.isArray(overrides.superTabs) && overrides.superTabs.length > 0;
  const requestedSuper = overrides.superNote !== undefined
    ? normalizeBooleanFlag(overrides.superNote, false)
    : (note.superNote || hasTabsOverride);

  if (!requestedSuper) {
    const cleared = {
      ...note,
      superNote: false,
      superTabs: [],
      activeSuperTabId: null
    };
    const next = applyPageStateToNote(cleared, overrides);
    next.superTabs = [];
    next.activeSuperTabId = null;
    next.superNote = false;
    return next;
  }

  const fallbackHtml = typeof overrides.html === 'string' ? overrides.html : (note.html || '');
  const fallbackContent = typeof overrides.content === 'string' ? overrides.content : (note.content || '');

  const normalizedTabsSource = hasTabsOverride
    ? overrides.superTabs
    : (Array.isArray(note.superTabs) ? note.superTabs : []);

  let tabs = normalizeSuperNoteTabs(normalizedTabsSource, { fallbackHtml, fallbackContent })
    .map(tab => ({
      ...tab,
      pages: tab.pages.map(page => ({ ...page }))
    }));

  if (!tabs.length) {
    const fallbackPages = normalizeNotePages(
      overrides.pages !== undefined ? overrides.pages : note.pages,
      { fallbackHtml, fallbackContent }
    );
    let initialIndex = Number.isInteger(overrides.currentPageIndex)
      ? overrides.currentPageIndex
      : (Number.isInteger(note.currentPageIndex) ? note.currentPageIndex : 0);
    initialIndex = Math.min(Math.max(initialIndex, 0), Math.max(fallbackPages.length - 1, 0));
    const fallbackTab = createNormalizedSuperTab({
      title: note.title || null,
      color: DEFAULT_SUPER_TAB_COLOR,
      pages: fallbackPages,
      currentPageIndex: initialIndex
    }, { fallbackHtml, fallbackContent });
    tabs = [{
      ...fallbackTab,
      pages: fallbackTab.pages.map(page => ({ ...page }))
    }];
  }

  let activeTabId = overrides.activeSuperTabId !== undefined
    ? (overrides.activeSuperTabId ? String(overrides.activeSuperTabId).trim() : null)
    : (note.activeSuperTabId ? String(note.activeSuperTabId).trim() : null);
  if (!activeTabId && hasTabsOverride && overrides.superTabs.length) {
    const firstOverride = overrides.superTabs[0];
    if (firstOverride && firstOverride.id) {
      activeTabId = String(firstOverride.id).trim();
    }
  }
  if (!activeTabId && tabs.length) {
    activeTabId = tabs[0].id;
  }

  let activeTab = tabs.find(tab => tab.id === activeTabId);
  if (!activeTab && tabs.length) {
    activeTab = tabs[0];
    activeTabId = activeTab.id;
  }

  const nowIso = overrides.updatedAt ? String(overrides.updatedAt) : new Date().toISOString();
  const shouldUpdatePages = overrides.pages !== undefined;
  const shouldUpdateHtml = typeof overrides.html === 'string';
  const shouldUpdateContent = typeof overrides.content === 'string';
  const hasPageUpdates = shouldUpdatePages || shouldUpdateHtml || shouldUpdateContent;

  if (activeTab && hasPageUpdates) {
    const tabFallbackHtml = shouldUpdateHtml ? overrides.html : (activeTab.html || fallbackHtml);
    const tabFallbackContent = shouldUpdateContent ? overrides.content : (activeTab.content || fallbackContent);
    let updatedPages = shouldUpdatePages
      ? normalizeNotePages(overrides.pages, { fallbackHtml: tabFallbackHtml, fallbackContent: tabFallbackContent })
      : activeTab.pages.map(page => ({ ...page }));
    if (!updatedPages.length) {
      updatedPages = normalizeNotePages([], { fallbackHtml: tabFallbackHtml, fallbackContent: tabFallbackContent });
    }
    let nextIndex = Number.isInteger(overrides.currentPageIndex)
      ? overrides.currentPageIndex
      : activeTab.currentPageIndex;
    nextIndex = Math.min(Math.max(nextIndex, 0), Math.max(updatedPages.length - 1, 0));
    const targetPage = updatedPages[nextIndex] || updatedPages[0];
    if (shouldUpdateHtml) {
      targetPage.html = overrides.html;
      targetPage.updatedAt = nowIso;
    }
    if (shouldUpdateContent) {
      targetPage.content = overrides.content;
      targetPage.updatedAt = nowIso;
    }
    activeTab = {
      ...activeTab,
      pages: updatedPages,
      currentPageIndex: nextIndex,
      html: targetPage?.html || '',
      content: targetPage?.content || '',
      updatedAt: nowIso
    };
  } else if (activeTab) {
    let nextIndex = Number.isInteger(overrides.currentPageIndex)
      ? overrides.currentPageIndex
      : activeTab.currentPageIndex;
    nextIndex = Math.min(Math.max(nextIndex, 0), Math.max(activeTab.pages.length - 1, 0));
    const targetPage = activeTab.pages[nextIndex] || activeTab.pages[0];
    activeTab = {
      ...activeTab,
      currentPageIndex: nextIndex,
      html: targetPage?.html || '',
      content: targetPage?.content || '',
      updatedAt: overrides.updatedAt ? nowIso : activeTab.updatedAt
    };
  }

  if (activeTab) {
    tabs = tabs.map(tab => (tab.id === activeTab.id ? activeTab : tab));
  }

  const activePage = activeTab?.pages?.[activeTab.currentPageIndex] || activeTab?.pages?.[0] || null;

  const nextNote = {
    ...note,
    superNote: true,
    superTabs: tabs,
    activeSuperTabId: activeTabId,
    pages: activeTab ? activeTab.pages : note.pages,
    currentPageIndex: activeTab ? activeTab.currentPageIndex : (note.currentPageIndex || 0),
    html: activePage?.html || '',
    content: activePage?.content || '',
    title: activeTab?.title || null,
    titleHtml: activeTab?.title ? escapeHtml(activeTab.title) : ''
  };

  return nextNote;
}

function normalizeCustomIcon(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return Array.from(trimmed).slice(0, 2).join('');
}

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

  let titleHtml = '';
  if (typeof options.titleHtml === 'string') {
    titleHtml = sanitizeNoteTitleHtml(options.titleHtml);
  }

  let title = null;
  if (typeof options.title === 'string') {
    title = options.title.trim();
  } else if (options.title === null) {
    title = null;
  }

  if (!titleHtml && title) {
    titleHtml = escapeHtml(title);
  }

  if (titleHtml) {
    const normalizedText = getNoteTitlePlainText(titleHtml).replace(/[\s\u00A0]+/g, ' ').trim();
    if (normalizedText) {
      title = normalizedText;
    } else {
      titleHtml = '';
      title = null;
    }
  } else if (title) {
    titleHtml = escapeHtml(title);
  }

  const base = {
    id,
    type,
    category,
    style: (options.style && String(options.style)) || DEFAULT_NOTE_STYLE,
    hoverAnimation: normalizeBooleanFlag(options.hoverAnimation, false),
    styleNeutralText: normalizeBooleanFlag(options.styleNeutralText, false),
    title,
    titleHtml,
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
    element: options.element || null,
    pages: [],
    currentPageIndex: 0,
    behindMainContent: !!options.behindMainContent,
    compactHeader: !!options.compactHeader,
    ultraCompact: !!options.ultraCompact,
    customIcon: normalizeCustomIcon(options.customIcon),
    superNote: normalizeBooleanFlag(options.superNote, false),
    superTabs: Array.isArray(options.superTabs) ? options.superTabs : [],
    activeSuperTabId: options.activeSuperTabId ? String(options.activeSuperTabId).trim() : null
  };

  return applySuperNoteState(base, {
    pages: options.pages,
    currentPageIndex: options.currentPageIndex,
    html: typeof options.html === 'string' ? options.html : base.html,
    content: typeof options.content === 'string' ? options.content : base.content,
    updatedAt: options.updatedAt || nowIso,
    superTabs: options.superTabs,
    activeSuperTabId: options.activeSuperTabId,
    superNote: options.superNote
  });
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
        if (key === 'pages' || key === 'currentPageIndex' || key === 'html' || key === 'content') {
          return;
        }
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
        } else if (key === 'compactHeader') {
          merged.compactHeader = !!overrides.compactHeader;
        } else if (key === 'ultraCompact') {
          merged.ultraCompact = !!overrides.ultraCompact;
        } else if (key === 'hoverAnimation') {
          merged.hoverAnimation = normalizeBooleanFlag(overrides.hoverAnimation, merged.hoverAnimation);
        } else if (key === 'styleNeutralText') {
          merged.styleNeutralText = normalizeBooleanFlag(overrides.styleNeutralText, merged.styleNeutralText);
        } else if (key === 'customIcon') {
          merged.customIcon = normalizeCustomIcon(overrides.customIcon);
        } else if (key === 'superNote') {
          merged.superNote = normalizeBooleanFlag(overrides.superNote, merged.superNote);
        } else if (key === 'superTabs') {
          merged.superTabs = Array.isArray(overrides.superTabs) ? overrides.superTabs : merged.superTabs;
        } else if (key === 'activeSuperTabId') {
          merged.activeSuperTabId = overrides.activeSuperTabId
            ? String(overrides.activeSuperTabId).trim()
            : null;
        } else if (key === 'titleHtml') {
          if (typeof overrides.titleHtml === 'string') {
            const sanitizedHtml = sanitizeNoteTitleHtml(overrides.titleHtml);
            merged.titleHtml = sanitizedHtml;
            const normalized = getNoteTitlePlainText(sanitizedHtml).replace(/[\s\u00A0]+/g, ' ').trim();
            merged.title = normalized.length ? normalized : null;
          } else if (overrides.titleHtml === null) {
            merged.titleHtml = '';
            merged.title = null;
          }
        } else if (key === 'title') {
          if (typeof overrides.title === 'string') {
            const trimmed = overrides.title.trim();
            merged.title = trimmed.length ? trimmed : null;
            if (trimmed.length) {
              merged.titleHtml = sanitizeNoteTitleHtml(overrides.titleHtml ?? escapeHtml(trimmed));
              const normalized = getNoteTitlePlainText(merged.titleHtml).replace(/[\s\u00A0]+/g, ' ').trim();
              merged.title = normalized.length ? normalized : null;
            } else {
              merged.titleHtml = '';
            }
          } else if (overrides.title === null) {
            merged.title = null;
            merged.titleHtml = '';
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
        } else if (key === 'borderColor') {
          return;
        } else if (overrides[key] !== undefined) {
          merged[key] = overrides[key];
        }
      });

      const nextUpdatedAt = overrides.updatedAt ? String(overrides.updatedAt) : new Date().toISOString();
      merged.updatedAt = nextUpdatedAt;
      existing = applySuperNoteState(merged, { ...overrides, updatedAt: nextUpdatedAt });
    } else {
      existing = applySuperNoteState(existing, {});
    }

    this._notes.set(id, existing);
    return existing;
  }

  update(noteId, updates = {}, options = {}) {
    if (!noteId) return null;
    const { silent = false } = options || {};
    this.ensure(noteId);
    const next = this.ensure(noteId, { ...updates, id: noteId });
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
  DEFAULT_NOTE_TYPE,
  DEFAULT_NOTE_STYLE
};
