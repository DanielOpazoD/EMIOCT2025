const storage = window.localStorage;

export function save(key, value) {
  try {
    const payload = JSON.stringify(value);
    storage.setItem(key, payload);
    return true;
  } catch (error) {
    console.error('No se pudo guardar en almacenamiento local', error);
    return false;
  }
}

export function load(key, fallback = null) {
  try {
    const raw = storage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('No se pudo leer desde almacenamiento local', error);
    return fallback;
  }
}

export function remove(key) {
  storage.removeItem(key);
}

export function exists(key) {
  return storage.getItem(key) !== null;
}
