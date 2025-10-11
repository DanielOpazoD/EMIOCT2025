const noop = () => {};

function previewRangeText(range) {
  if (!range) {
    return '';
  }
  const text = range.cloneContents?.().textContent || range.toString();
  return text ? text.slice(0, 60) : '';
}

function describeEditable(element) {
  if (!element) {
    return null;
  }
  if (element.dataset?.topicId) {
    return `topic:${element.dataset.topicId}`;
  }
  if (element.id) {
    return `#${element.id}`;
  }
  return element.tagName ? element.tagName.toLowerCase() : null;
}

export function installIconPickerDiagnostics(api = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  const {
    getCurrentPage = noop,
    focusCurrentPage: focusCurrentPageFn = noop,
    focusEditableElement = noop,
    saveSelection = noop,
    restoreSelection = noop,
    insertText = noop,
    getSavedSelection = noop,
    getLastFocusedEditable = noop,
    resolveEditableTarget = noop,
    scheduleIconPickerRebind = noop
  } = api;

  const root = window.__emiInternalTests = window.__emiInternalTests || {};

  root.iconPicker = {
    describeState() {
      const live = typeof window.getSelection === 'function' ? window.getSelection() : null;
      const saved = typeof getSavedSelection === 'function' ? getSavedSelection() : null;
      const lastEditable = typeof getLastFocusedEditable === 'function' ? getLastFocusedEditable() : null;
      return {
        hasSavedSelection: Boolean(saved),
        savedPreview: previewRangeText(saved),
        livePreview: live && live.rangeCount ? previewRangeText(live.getRangeAt(0)) : '',
        lastEditable: describeEditable(lastEditable)
      };
    },

    ensureSelection() {
      if (typeof saveSelection === 'function' && saveSelection()) {
        return true;
      }
      if (typeof resolveEditableTarget === 'function') {
        const target = resolveEditableTarget();
        if (target && typeof focusEditableElement === 'function') {
          return Boolean(focusEditableElement(target, { collapseToEnd: true }));
        }
      }
      return false;
    },

    focusActivePage() {
      if (typeof getCurrentPage !== 'function' || typeof focusCurrentPageFn !== 'function') {
        return false;
      }
      const page = getCurrentPage();
      if (!page) {
        return false;
      }
      return Boolean(focusCurrentPageFn(page, { collapseToEnd: true }));
    },

    rebind(delay = 0, label = 'Icon picker test rebind') {
      if (typeof scheduleIconPickerRebind === 'function') {
        scheduleIconPickerRebind(delay, label);
        return true;
      }
      return false;
    },

    insert(symbol = '•') {
      if (typeof insertText !== 'function') {
        return false;
      }
      return Boolean(insertText(`${symbol} `));
    },

    smoke() {
      const steps = [];
      steps.push({ step: 'ensureSelection', success: this.ensureSelection() });
      const inserted = this.insert();
      steps.push({ step: 'insertSymbol', success: inserted });
      if (typeof restoreSelection === 'function') {
        steps.push({ step: 'restoreSelection', success: restoreSelection() });
      }
      return steps;
    }
  };
}

export default installIconPickerDiagnostics;
