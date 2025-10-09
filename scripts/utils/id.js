let counters = new Map();

function normalizePrefix(prefix) {
  if (typeof prefix !== 'string' || prefix.trim().length === 0) {
    return 'id';
  }
  return prefix.trim().replace(/\s+/g, '-');
}

export function generateUniqueId(prefix = 'id') {
  const normalized = normalizePrefix(prefix);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  const counter = (counters.get(normalized) || 0) + 1;
  counters.set(normalized, counter);
  return `${normalized}-${timestamp}-${random}-${counter}`;
}

export function resetUniqueIdCounters() {
  counters = new Map();
}
