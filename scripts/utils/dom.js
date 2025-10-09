export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  if (options.className) {
    element.className = options.className;
  }
  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, value]) => {
      element.dataset[key] = value;
    });
  }
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  if (options.textContent !== undefined) {
    element.textContent = options.textContent;
  }
  if (options.html !== undefined) {
    element.innerHTML = options.html;
  }
  return element;
}

export function toggleClass(element, className, force) {
  if (!element) return;
  if (force === undefined) {
    element.classList.toggle(className);
  } else if (force) {
    element.classList.add(className);
  } else {
    element.classList.remove(className);
  }
}

export function bindEvent(element, event, handler, options) {
  if (!element) return () => {};
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

export function focusElement(element) {
  if (!element) return;
  requestAnimationFrame(() => {
    element.focus();
  });
}

export function measureElement(element) {
  if (!element) {
    return { width: 0, height: 0, rect: new DOMRect() };
  }
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    rect
  };
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function compose(...fns) {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
}
