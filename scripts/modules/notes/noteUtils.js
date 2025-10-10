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
  const normalized = typeof title === 'string' ? title.trim() : '';
  return normalized.length ? normalized : fallback;
}

function sanitizeStyleAttribute(style) {
  if (!style || typeof style !== 'string') return '';
  const allowedProperties = new Set([
    'color',
    'background-color',
    'font-weight',
    'font-style',
    'text-decoration',
    'text-decoration-line',
    'text-decoration-style',
    'text-decoration-color',
    'font-size',
    'font-variant',
    'font-family',
    'letter-spacing',
    'text-transform'
  ]);
  const temp = document.createElement('div');
  temp.style.cssText = style;
  Array.from(temp.style).forEach((prop) => {
    if (!allowedProperties.has(prop)) {
      temp.style.removeProperty(prop);
    }
  });
  return temp.getAttribute('style') || '';
}

function convertFontElementToSpan(element) {
  if (!(element instanceof HTMLElement) || element.tagName !== 'FONT') {
    return element;
  }
  const span = document.createElement('span');
  const color = element.getAttribute('color');
  const size = element.getAttribute('size');
  const face = element.getAttribute('face');
  if (color) {
    span.style.color = color;
  }
  if (size) {
    const sizeMap = {
      '1': '0.75rem',
      '2': '0.875rem',
      '3': '1rem',
      '4': '1.125rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '7': '2rem'
    };
    const resolved = sizeMap[size] || null;
    if (resolved) {
      span.style.fontSize = resolved;
    }
  }
  if (face) {
    span.style.fontFamily = face;
  }
  while (element.firstChild) {
    span.appendChild(element.firstChild);
  }
  return span;
}

export function sanitizeNoteTitleHtml(html = '') {
  if (typeof html !== 'string') {
    return '';
  }
  if (
    typeof document === 'undefined'
    || typeof document.createElement !== 'function'
    || typeof Node === 'undefined'
  ) {
    return html.trim();
  }
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  const allowedTags = new Set([
    'B', 'STRONG', 'I', 'EM', 'U', 'MARK', 'SPAN', 'SMALL',
    'SUB', 'SUP', 'S', 'DEL', 'INS', 'BR'
  ]);

  const traverse = (node) => {
    if (!node) return;
    const childNodes = Array.from(node.childNodes);
    childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        let element = child;
        if (element.tagName === 'FONT') {
          element = convertFontElementToSpan(element);
          child.replaceWith(element);
        }

        if (!allowedTags.has(element.tagName)) {
          traverse(element);
          while (element.firstChild) {
            element.parentNode.insertBefore(element.firstChild, element);
          }
          element.remove();
          return;
        }

        Array.from(element.attributes).forEach(attr => {
          if (attr.name === 'style') {
            const sanitized = sanitizeStyleAttribute(attr.value);
            if (sanitized) {
              element.setAttribute('style', sanitized);
            } else {
              element.removeAttribute('style');
            }
          } else {
            element.removeAttribute(attr.name);
          }
        });

        traverse(element);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      }
    });
  };

  traverse(wrapper);
  return wrapper.innerHTML.trim();
}
