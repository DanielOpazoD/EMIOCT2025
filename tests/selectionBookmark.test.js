import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSelectionBookmark,
  restoreRangeFromBookmark,
  serializePosition,
  getNodeFromPath,
  getNodePath,
  findEditableHost,
  captureSelectionSnapshot
} from '../scripts/modules/editorSelection.js';
import { assignGlobalDom } from './helpers/fakeDom.js';

describe('editor selection bookmarks', () => {
  beforeEach(() => {
    assignGlobalDom();
    document.body.innerHTML = '';
  });

  function createEditable(builder) {
    const editable = document.createElement('div');
    editable.contentEditable = 'true';
    editable.dataset.topicId = 'topic-1';
    if (typeof builder === 'function') {
      builder(editable);
    }
    document.body.appendChild(editable);
    return editable;
  }

  function buildPhrase(root) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode('Hola '));
    const strong = document.createElement('strong');
    strong.appendChild(document.createTextNode('mun'));
    const em = document.createElement('em');
    em.appendChild(document.createTextNode('do'));
    p.appendChild(strong);
    p.appendChild(em);
    root.appendChild(p);
  }

  function buildSpanPair(root) {
    const p = document.createElement('p');
    const firstSpan = document.createElement('span');
    firstSpan.appendChild(document.createTextNode('Uno'));
    const text = document.createTextNode(' y ');
    const secondSpan = document.createElement('span');
    secondSpan.appendChild(document.createTextNode('dos'));
    p.appendChild(firstSpan);
    p.appendChild(text);
    p.appendChild(secondSpan);
    root.appendChild(p);
  }

  function buildSimpleParagraph(root, text) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(text));
    root.appendChild(p);
  }

  it('findEditableHost climbs to the nearest contentEditable ancestor', () => {
    const editable = createEditable(root => buildSimpleParagraph(root, 'Texto dentro'));
    const paragraph = editable.firstChild;
    const textNode = paragraph.firstChild;
    const host = findEditableHost(textNode);
    assert.equal(host, editable);
  });

  it('serializes and restores a collapsed caret inside deeply nested nodes', () => {
    const editable = createEditable(buildPhrase);
    const paragraph = editable.firstChild;
    const strong = paragraph.childNodes[1];
    const strongText = strong.firstChild;
    const range = document.createRange();
    range.setStart(strongText, 2);
    range.collapse(true);

    const bookmark = createSelectionBookmark(range, editable);
    assert.ok(bookmark);
    assert.equal(bookmark?.topicId, 'topic-1');

    // simulate DOM replacement
    const replacement = createEditable(buildPhrase);
    document.body.replaceChild(replacement, editable);

    const restored = restoreRangeFromBookmark(bookmark, replacement);
    assert.ok(restored);
    assert.equal(restored?.collapsed, true);
    assert.equal(restored?.startContainer?.textContent, 'mun');
    assert.equal(restored?.startOffset, 2);
  });

  it('restores a non-collapsed selection spanning siblings after DOM cloning', () => {
    const editable = createEditable(buildSpanPair);
    const paragraph = editable.firstChild;
    const firstSpan = paragraph.childNodes[0];
    const secondSpan = paragraph.childNodes[2];
    const range = document.createRange();
    range.setStart(firstSpan.firstChild, 1);
    range.setEnd(secondSpan.firstChild, 2);

    const bookmark = createSelectionBookmark(range, editable);
    assert.ok(bookmark);

    const clone = editable.cloneNode(true);
    clone.dataset.topicId = 'topic-1';
    const restored = restoreRangeFromBookmark(bookmark, clone);
    assert.ok(restored);
    assert.equal(restored?.startContainer?.textContent, 'Uno');
    assert.equal(restored?.startOffset, 1);
    assert.equal(restored?.endContainer?.textContent, 'dos');
    assert.equal(restored?.endOffset, 2);
  });

  it('returns null when nodes referenced by bookmark no longer exist', () => {
    const editable = createEditable(root => buildSimpleParagraph(root, 'Texto'));
    const paragraph = editable.firstChild;
    const textNode = paragraph.firstChild;
    const range = document.createRange();
    range.setStart(textNode, 5);
    range.collapse(true);

    const bookmark = createSelectionBookmark(range, editable);
    assert.ok(bookmark);

    const replacement = createEditable(() => {});
    document.body.replaceChild(replacement, editable);

    const restored = restoreRangeFromBookmark(bookmark, replacement);
    assert.equal(restored, null);
  });

  it('computes node paths relative to editable root', () => {
    const editable = createEditable(root => {
      const p = document.createElement('p');
      const firstSpan = document.createElement('span');
      firstSpan.appendChild(document.createTextNode('abc'));
      const secondSpan = document.createElement('span');
      secondSpan.appendChild(document.createTextNode('def'));
      p.appendChild(firstSpan);
      p.appendChild(secondSpan);
      root.appendChild(p);
    });
    const paragraph = editable.firstChild;
    const spans = paragraph.childNodes;
    const path = getNodePath(spans[1], editable);
    assert.deepEqual(path, [0, 1]);

    const resolved = getNodeFromPath(editable, path);
    assert.equal(resolved, spans[1]);

    const textNode = spans[1].firstChild;
    const position = serializePosition(textNode, 3, editable);
    assert.deepEqual(position?.path, [0, 1, 0]);
    assert.equal(position?.offset, 3);
  });

  it('captureSelectionSnapshot preserves caret location across DOM replacements', () => {
    const editable = createEditable(buildPhrase);
    const paragraph = editable.firstChild;
    const strong = paragraph.childNodes[1];
    const strongText = strong.firstChild;
    const range = document.createRange();
    range.setStart(strongText, 2);
    range.collapse(true);

    const selection = {
      rangeCount: 1,
      getRangeAt: () => range,
      anchorNode: strongText,
      focusNode: strongText
    };

    const snapshot = captureSelectionSnapshot(selection);
    assert.ok(snapshot);
    assert.equal(snapshot?.editable, editable);
    assert.equal(snapshot?.bookmark?.topicId, 'topic-1');

    const replacement = editable.cloneNode(true);
    replacement.dataset.topicId = 'topic-1';
    document.body.replaceChild(replacement, editable);

    const restored = restoreRangeFromBookmark(snapshot.bookmark, replacement);
    assert.ok(restored);
    assert.equal(restored?.startContainer?.textContent, 'mun');
    assert.equal(restored?.startOffset, 2);
  });

  it('captureSelectionSnapshot returns null for selections without an editable host', () => {
    const orphanText = document.createTextNode('Sin editable');
    document.body.appendChild(orphanText);

    const range = document.createRange();
    range.setStart(orphanText, 3);
    range.collapse(true);

    const selection = {
      rangeCount: 1,
      getRangeAt: () => range,
      anchorNode: orphanText,
      focusNode: orphanText
    };

    const snapshot = captureSelectionSnapshot(selection);
    assert.equal(snapshot, null);
  });
});
