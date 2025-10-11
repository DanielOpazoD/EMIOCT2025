export function getNodePath(node, root) {
  if (!node || !root) {
    return null;
  }
  const path = [];
  let current = node;
  while (current && current !== root) {
    const parent = current.parentNode;
    if (!parent) {
      return null;
    }
    const index = Array.prototype.indexOf.call(parent.childNodes, current);
    if (index === -1) {
      return null;
    }
    path.unshift(index);
    current = parent;
  }
  if (current !== root) {
    return null;
  }
  return path;
}

export function getNodeFromPath(root, path) {
  if (!root || !Array.isArray(path)) {
    return null;
  }
  let current = root;
  for (let i = 0; i < path.length; i += 1) {
    const index = path[i];
    if (!current || !current.childNodes || index < 0 || index >= current.childNodes.length) {
      return null;
    }
    current = current.childNodes[index];
  }
  return current;
}

function getNodeLength(node) {
  if (!node) {
    return 0;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    return node.nodeValue ? node.nodeValue.length : 0;
  }
  return node.childNodes ? node.childNodes.length : 0;
}

export function clampOffset(node, offset) {
  const length = getNodeLength(node);
  if (typeof offset !== 'number' || Number.isNaN(offset)) {
    return Math.max(0, length);
  }
  if (offset < 0) {
    return 0;
  }
  if (offset > length) {
    return length;
  }
  return offset;
}

export function serializePosition(node, offset, root) {
  const path = getNodePath(node, root);
  if (!path) {
    return null;
  }
  return {
    path,
    offset: clampOffset(node, offset)
  };
}

export function createSelectionBookmark(range, editable, topicId = null) {
  if (!range || !editable) {
    return null;
  }
  if (editable !== range.commonAncestorContainer && !editable.contains(range.commonAncestorContainer)) {
    if (!editable.contains(range.startContainer) || !editable.contains(range.endContainer)) {
      return null;
    }
  }
  const start = serializePosition(range.startContainer, range.startOffset, editable);
  const end = serializePosition(range.endContainer, range.endOffset, editable);
  if (!start || !end) {
    return null;
  }
  return {
    topicId: topicId || editable.dataset?.topicId || null,
    start,
    end,
    collapsed: range.collapsed
  };
}

export function restoreRangeFromBookmark(bookmark, editable) {
  if (!bookmark || !editable) {
    return null;
  }
  const startNode = getNodeFromPath(editable, bookmark.start?.path || []);
  const endNode = getNodeFromPath(editable, bookmark.end?.path || []);
  if (!startNode || !endNode) {
    return null;
  }
  const range = document.createRange();
  range.setStart(startNode, clampOffset(startNode, bookmark.start?.offset ?? 0));
  range.setEnd(endNode, clampOffset(endNode, bookmark.end?.offset ?? 0));
  return range;
}

export function isBookmarkWithinEditable(bookmark, editable) {
  if (!bookmark || !editable) {
    return false;
  }
  const startNode = getNodeFromPath(editable, bookmark.start?.path || []);
  const endNode = getNodeFromPath(editable, bookmark.end?.path || []);
  return Boolean(startNode && endNode);
}

export function findEditableHost(node) {
  if (!node) {
    return null;
  }

  let current = node;
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      current = current.parentElement;
      continue;
    }

    if (current.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      if ('host' in current && current.host) {
        current = current.host;
      } else {
        current = current.parentElement;
      }
      continue;
    }

    if (!current || current.nodeType !== 1) {
      break;
    }

    const editableValue = typeof current.isContentEditable === 'boolean'
      ? current.isContentEditable
      : current.getAttribute && current.getAttribute('contenteditable') === 'true';

    if (editableValue) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

export function captureSelectionSnapshot(selection, { fallbackEditable = null } = {}) {
  if (!selection || typeof selection.getRangeAt !== 'function' || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!range) {
    return null;
  }

  const candidates = [
    range.commonAncestorContainer,
    selection.anchorNode,
    selection.focusNode,
    fallbackEditable
  ];

  let editable = null;
  for (const candidate of candidates) {
    const host = findEditableHost(candidate);
    if (host) {
      editable = host;
      break;
    }
  }

  if (!editable || !editable.contains(range.startContainer) || !editable.contains(range.endContainer)) {
    return null;
  }

  let outerEditable = editable;
  while (outerEditable?.parentElement) {
    const parent = outerEditable.parentElement;
    if (!parent || parent.nodeType !== 1) {
      break;
    }
    const parentEditable = typeof parent.isContentEditable === 'boolean'
      ? parent.isContentEditable
      : parent.getAttribute && parent.getAttribute('contenteditable') === 'true';
    if (!parentEditable) {
      break;
    }
    outerEditable = parent;
  }

  editable = outerEditable;

  const bookmark = createSelectionBookmark(range, editable);
  if (!bookmark) {
    return null;
  }

  return {
    range: range.cloneRange(),
    editable,
    bookmark
  };
}
