import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeTags,
  escapeHtml,
  normalizePriority,
  getNoteDisplayTitle,
  getNoteCategoryInfo
} from '../scripts/modules/notes/noteUtils.js';

import {
  DEFAULT_NOTE_PRIORITY,
  NOTE_CATEGORIES,
  DEFAULT_NOTE_CATEGORY
} from '../scripts/modules/notes/noteConstants.js';

describe('noteUtils', () => {
  describe('sanitizeTags', () => {
    it('trims and filters tag strings', () => {
      const input = ['  alpha ', 'beta', '', '  ', 'gamma'];
      assert.deepEqual(sanitizeTags(input), ['alpha', 'beta', 'gamma']);
    });

    it('ignores non-string entries and non-arrays', () => {
      assert.deepEqual(sanitizeTags(['one', null, 2, {}, 'three']), ['one', 'three']);
      assert.deepEqual(sanitizeTags(null), []);
    });
  });

  describe('escapeHtml', () => {
    it('escapes the main HTML special characters', () => {
      const input = "<span class='name'>& \"quote\"</span>";
      const expected = '&lt;span class=&#39;name&#39;&gt;&amp; &quot;quote&quot;&lt;/span&gt;';
      assert.equal(escapeHtml(input), expected);
    });

    it('returns empty string for non-string input', () => {
      assert.equal(escapeHtml(undefined), '');
      assert.equal(escapeHtml(123), '');
    });
  });

  describe('normalizePriority', () => {
    it('normalizes valid priority values case-insensitively', () => {
      assert.equal(normalizePriority('HIGH'), 'high');
      assert.equal(normalizePriority('low'), 'low');
    });

    it('falls back to the default priority for unknown values', () => {
      assert.equal(normalizePriority('urgent'), DEFAULT_NOTE_PRIORITY);
      assert.equal(normalizePriority(null), DEFAULT_NOTE_PRIORITY);
    });
  });

  describe('getNoteCategoryInfo', () => {
    it('returns the configuration for a known category', () => {
      const category = getNoteCategoryInfo('IMPORTANT');
      assert.equal(category, NOTE_CATEGORIES.IMPORTANT);
    });

    it('falls back to the default category when unknown', () => {
      const category = getNoteCategoryInfo('UNKNOWN');
      assert.equal(category, NOTE_CATEGORIES[DEFAULT_NOTE_CATEGORY]);
    });
  });

  describe('getNoteDisplayTitle', () => {
    it('returns trimmed title or fallback', () => {
      assert.equal(getNoteDisplayTitle('  Hola  ', 'fallback'), 'Hola');
      assert.equal(getNoteDisplayTitle('   ', 'fallback'), 'fallback');
      assert.equal(getNoteDisplayTitle(null, 'fallback'), 'fallback');
    });
  });
});
