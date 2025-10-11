class FakeNode {
  constructor(nodeType) {
    this.nodeType = nodeType;
    this.parentNode = null;
    this.childNodes = [];
  }

  appendChild(node) {
    if (!node) return null;
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }

  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index === -1) {
      throw new Error('Node to remove is not a child');
    }
    this.childNodes.splice(index, 1);
    node.parentNode = null;
    return node;
  }

  replaceChild(newChild, oldChild) {
    const index = this.childNodes.indexOf(oldChild);
    if (index === -1) {
      throw new Error('Node to replace is not a child');
    }
    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }
    newChild.parentNode = this;
    this.childNodes[index] = newChild;
    oldChild.parentNode = null;
    return oldChild;
  }

  contains(target) {
    if (target === this) {
      return true;
    }
    return this.childNodes.some(child => child.contains(target));
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] || null;
  }

  cloneNode(deep = false) {
    throw new Error('cloneNode must be implemented by subclasses');
  }
}

class FakeText extends FakeNode {
  constructor(data = '') {
    super(3);
    this.nodeValue = data;
  }

  get textContent() {
    return this.nodeValue;
  }

  set textContent(value) {
    this.nodeValue = value;
  }

  cloneNode() {
    return new FakeText(this.nodeValue);
  }
}

class FakeElement extends FakeNode {
  constructor(tagName) {
    super(1);
    this.tagName = tagName.toUpperCase();
    this.dataset = {};
    this.attributes = new Map();
    this.contentEditable = 'inherit';
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name === 'contenteditable') {
      this.contentEditable = String(value);
    }
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  get textContent() {
    return this.childNodes.map(child => child.textContent).join('');
  }

  set textContent(value) {
    this.childNodes = [new FakeText(String(value))];
    this.childNodes[0].parentNode = this;
  }

  get innerHTML() {
    return this.childNodes.map(child => child.textContent).join('');
  }

  set innerHTML(value) {
    this.childNodes.forEach(child => {
      child.parentNode = null;
    });
    this.childNodes = [];
    if (value) {
      const text = new FakeText(String(value));
      text.parentNode = this;
      this.childNodes.push(text);
    }
  }

  cloneNode(deep = false) {
    const clone = new FakeElement(this.tagName);
    clone.dataset = { ...this.dataset };
    clone.contentEditable = this.contentEditable;
    this.attributes.forEach((value, key) => {
      clone.attributes.set(key, value);
    });
    if (deep) {
      this.childNodes.forEach(child => {
        clone.appendChild(child.cloneNode(true));
      });
    }
    return clone;
  }
}

function lowestCommonAncestor(a, b) {
  if (!a || !b) {
    return null;
  }
  const ancestors = new Set();
  let current = a;
  while (current) {
    ancestors.add(current);
    current = current.parentNode;
  }
  current = b;
  while (current) {
    if (ancestors.has(current)) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

class FakeRange {
  constructor(document) {
    this.document = document;
    this.startContainer = null;
    this.startOffset = 0;
    this.endContainer = null;
    this.endOffset = 0;
  }

  setStart(node, offset) {
    this.startContainer = node;
    this.startOffset = offset;
    if (!this.endContainer) {
      this.collapse(true);
    }
  }

  setEnd(node, offset) {
    this.endContainer = node;
    this.endOffset = offset;
  }

  collapse(toStart = false) {
    if (toStart || !this.endContainer) {
      this.endContainer = this.startContainer;
      this.endOffset = this.startOffset;
    } else {
      this.startContainer = this.endContainer;
      this.startOffset = this.endOffset;
    }
  }

  get collapsed() {
    return this.startContainer === this.endContainer && this.startOffset === this.endOffset;
  }

  get commonAncestorContainer() {
    return lowestCommonAncestor(this.startContainer, this.endContainer);
  }

  cloneRange() {
    const clone = new FakeRange(this.document);
    clone.startContainer = this.startContainer;
    clone.startOffset = this.startOffset;
    clone.endContainer = this.endContainer;
    clone.endOffset = this.endOffset;
    return clone;
  }
}

class FakeDocument {
  constructor() {
    this.body = new FakeElement('body');
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  createTextNode(text) {
    return new FakeText(text);
  }

  createRange() {
    return new FakeRange(this);
  }

  contains(node) {
    return this.body.contains(node);
  }

  appendChild(node) {
    return this.body.appendChild(node);
  }

  replaceChild(newChild, oldChild) {
    return this.body.replaceChild(newChild, oldChild);
  }
}

export function createFakeDocument() {
  const doc = new FakeDocument();
  doc.documentElement = doc.body;
  return doc;
}

export function assignGlobalDom() {
  const doc = createFakeDocument();
  global.document = doc;
  global.Node = { TEXT_NODE: 3, DOCUMENT_FRAGMENT_NODE: 11 };
  return doc;
}

export { FakeDocument, FakeElement, FakeText, FakeRange };
