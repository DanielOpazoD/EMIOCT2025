export function isString(value) {
  return typeof value === 'string';
}

export function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isObject(value) {
  return value !== null && typeof value === 'object';
}

export function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

export function clampNumber(value, min, max, fallback = min) {
  if (!isNumber(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
