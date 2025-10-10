import {
  NOTE_PRIORITY_SEQUENCE,
  DEFAULT_NOTE_PRIORITY,
  NOTE_CATEGORIES,
  DEFAULT_NOTE_CATEGORY
} from './noteConstants.js';

const NOTE_TITLE_ALLOWED_TAGS = new Set([
  'B', 'STRONG', 'I', 'EM', 'U', 'SPAN', 'FONT', 'SUP', 'SUB', 'SMALL', 'MARK', 'BR'
]);

const NOTE_TITLE_BLOCK_TAGS = new Set([
  'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'
]);

const NOTE_TITLE_STYLE_PROPERTIES = new Set([
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-decoration-line',
  'text-decoration-style',
  'text-decoration-color',
  'font-size',
  'font-family'
]);

const FONT_SIZE_MAP = Object.freeze({
  '1': '0.75em',
  '2': '0.875em',
  '3': '1em',
  '4': '1.125em',
  '5': '1.25em',
  '6': '1.5em',
  '7': '1.75em'
});

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
  const normalized = typeof title === 'string' ? title.trim() : '';
  return normalized.length ? normalized : fallback;
}

function sanitizeElementStyle(element) {
  if (!element || !element.getAttribute) return;
  const styleAttr = element.getAttribute('style');
  if (!styleAttr) {
    return;
  }
  const sanitized = [];
  const styleDecl = element.style;
  Array.from(styleDecl).forEach((prop) => {
    const normalized = prop.toLowerCase();
    if (NOTE_TITLE_STYLE_PROPERTIES.has(normalized)) {
      const value = styleDecl.getPropertyValue(prop);
      const priority = styleDecl.getPropertyPriority(prop);
      if (value) {
        sanitized.push(`${prop}: ${value}${priority ? ' !important' : ''}`.trim());
      }
    }
  });
  if (sanitized.length > 0) {
    element.setAttribute('style', sanitized.join('; '));
  } else {
    element.removeAttribute('style');
  }
}

function convertFontElement(element) {
  if (!element || element.tagName !== 'FONT') return element;
  const span = document.createElement('span');
  const color = element.getAttribute('color');
  const size = element.getAttribute('size');
  const face = element.getAttribute('face');
  const styles = [];
  if (color) {
    styles.push(`color: ${color}`);
  }
  if (size && FONT_SIZE_MAP[size]) {
    styles.push(`font-size: ${FONT_SIZE_MAP[size]}`);
  }
  if (face) {
    styles.push(`font-family: ${face}`);
  }
  if (styles.length > 0) {
    span.setAttribute('style', styles.join('; '));
  }
  while (element.firstChild) {
    span.appendChild(element.firstChild);
  }
  element.replaceWith(span);
  return span;
}

function sanitizeTitleNode(node) {
  if (!node) return;
  if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.tagName;
    if (tagName === 'SCRIPT' || tagName === 'STYLE') {
      node.remove();
      return;
    }
    if (NOTE_TITLE_BLOCK_TAGS.has(tagName)) {
      const span = document.createElement('span');
      while (node.firstChild) {
        span.appendChild(node.firstChild);
      }
      node.replaceWith(span);
      sanitizeTitleNode(span);
      return;
    }
    let current = node;
    if (tagName === 'FONT') {
      current = convertFontElement(node);
    }
    if (!NOTE_TITLE_ALLOWED_TAGS.has(current.tagName)) {
      if (current.tagName === 'BR') {
        return;
      }
      const parent = current.parentNode;
      const children = Array.from(current.childNodes);
      if (parent) {
        children.forEach(child => parent.insertBefore(child, current));
        parent.removeChild(current);
        children.forEach(child => sanitizeTitleNode(child));
      } else {
        current.remove();
        children.forEach(child => sanitizeTitleNode(child));
      }
      return;
    }
    Array.from(current.attributes).forEach(attr => {
      const name = attr.name.toLowerCase();
      if (name === 'style') {
        sanitizeElementStyle(current);
      } else if (name === 'class') {
        current.removeAttribute(attr.name);
      } else if (name.startsWith('on')) {
        current.removeAttribute(attr.name);
      } else if (name !== 'color' && name !== 'size' && name !== 'face') {
        current.removeAttribute(attr.name);
      }
    });
    if (current.tagName === 'FONT') {
      sanitizeElementStyle(current);
    }
    let child = current.firstChild;
    while (child) {
      const next = child.nextSibling;
      sanitizeTitleNode(child);
      child = next;
    }
  } else if (node.nodeType === Node.COMMENT_NODE) {
    node.remove();
  }
}

export function sanitizeNoteTitleHtml(html = '') {
  if (typeof html !== 'string' || !html.trim()) {
    return '';
  }
  const container = document.createElement('div');
  container.innerHTML = html;
  Array.from(container.childNodes).forEach(child => sanitizeTitleNode(child));
  const sanitized = container.innerHTML
    .replace(/\u00A0/g, ' ')
    .trim();
  return sanitized;
}

export function getNoteTitlePlainText(titleHtml = '') {
  if (!titleHtml) return '';
  return getNotePlainTextFromHtml(titleHtml);
}
