import {
  CACHE_STORAGE_KEY,
  EXTENDED_CACHE_DB_NAME,
  EXTENDED_CACHE_STORE_NAME
} from './editorConfig.js';

export function createExtendedCacheController() {
  let extendedCacheDbPromise = null;

  function resetExtendedCachePromise() {
    extendedCacheDbPromise = null;
  }

  function isQuotaExceededError(error) {
    if (!error) {
      return false;
    }

    const quotaNames = ['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'];
    if (quotaNames.includes(error.name)) {
      return true;
    }

    if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
      return quotaNames.includes(error.name);
    }

    return false;
  }

  function openExtendedCacheDb() {
    if (!('indexedDB' in window)) {
      return Promise.reject(new Error('IndexedDB no está disponible'));
    }

    if (extendedCacheDbPromise) {
      return extendedCacheDbPromise;
    }

    extendedCacheDbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(EXTENDED_CACHE_DB_NAME, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(EXTENDED_CACHE_STORE_NAME)) {
          db.createObjectStore(EXTENDED_CACHE_STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          resetExtendedCachePromise();
        };
        resolve(db);
      };

      request.onerror = () => {
        const err = request.error || new Error('No se pudo abrir IndexedDB');
        resetExtendedCachePromise();
        reject(err);
      };

      request.onblocked = () => {
        console.warn('Actualización de la caché extendida bloqueada por otra pestaña.');
      };
    });

    return extendedCacheDbPromise;
  }

  function hasOpenExtendedCache() {
    return Boolean(extendedCacheDbPromise);
  }

  async function writeExtendedCacheValue(value) {
    try {
      const db = await openExtendedCacheDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(EXTENDED_CACHE_STORE_NAME, 'readwrite');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error || new Error('No se pudo guardar en almacenamiento extendido'));
        tx.onabort = () => reject(tx.error || new Error('Se canceló el guardado en almacenamiento extendido'));
        const store = tx.objectStore(EXTENDED_CACHE_STORE_NAME);
        store.put(value, CACHE_STORAGE_KEY);
      });
    } catch (error) {
      console.error('Error al escribir en la caché extendida:', error);
      throw error;
    }
  }

  async function readExtendedCacheValue() {
    try {
      const db = await openExtendedCacheDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(EXTENDED_CACHE_STORE_NAME, 'readonly');
        tx.onerror = () => reject(tx.error || new Error('No se pudo leer la caché extendida'));
        const store = tx.objectStore(EXTENDED_CACHE_STORE_NAME);
        const request = store.get(CACHE_STORAGE_KEY);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error || new Error('Error leyendo la caché extendida'));
      });
    } catch (error) {
      console.error('Error al leer la caché extendida:', error);
      return null;
    }
  }

  async function clearExtendedCacheValue() {
    if (!('indexedDB' in window)) {
      return;
    }

    try {
      const db = await openExtendedCacheDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(EXTENDED_CACHE_STORE_NAME, 'readwrite');
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error || new Error('No se pudo limpiar la caché extendida'));
        tx.onabort = () => reject(tx.error || new Error('Se canceló la limpieza de la caché extendida'));
        const store = tx.objectStore(EXTENDED_CACHE_STORE_NAME);
        store.delete(CACHE_STORAGE_KEY);
      });
    } catch (error) {
      console.error('Error al limpiar la caché extendida:', error);
    }
  }

  return {
    isQuotaExceededError,
    writeExtendedCacheValue,
    readExtendedCacheValue,
    clearExtendedCacheValue,
    hasOpenExtendedCache
  };
}
