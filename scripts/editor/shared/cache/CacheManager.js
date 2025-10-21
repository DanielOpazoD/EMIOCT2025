/**
 * CacheManager - Gestión de caché con localStorage e IndexedDB
 *
 * Este módulo maneja el almacenamiento y recuperación de datos tanto en localStorage
 * como en IndexedDB (para grandes volúmenes de datos).
 */

import {
  CACHE_STORAGE_KEY,
  EXTENDED_CACHE_DB_NAME,
  EXTENDED_CACHE_STORE_NAME
} from '../constants/editorConstants.js';

// Estado del módulo
let extendedCacheDbPromise = null;
let cachedStylesheetForExport = null;

/**
 * Verifica si un error es de cuota excedida
 * @param {Error} error - Error a verificar
 * @returns {boolean} True si es error de cuota
 */
export function isQuotaExceededError(error) {
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

/**
 * Abre la base de datos IndexedDB para caché extendido
 * @returns {Promise<IDBDatabase>} Promesa que resuelve la base de datos
 */
export function openExtendedCacheDb() {
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
      };
      resolve(db);
    };
    request.onerror = () => {
      const err = request.error || new Error('No se pudo abrir IndexedDB');
      extendedCacheDbPromise = null;
      reject(err);
    };
    request.onblocked = () => {
      console.warn('Actualización de la caché extendida bloqueada por otra pestaña.');
    };
  });
  return extendedCacheDbPromise;
}

/**
 * Escribe un valor en la caché extendida (IndexedDB)
 * @param {*} value - Valor a guardar
 * @returns {Promise<boolean>} Promesa que resuelve true si se guardó correctamente
 */
export async function writeExtendedCacheValue(value) {
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

/**
 * Lee un valor de la caché extendida (IndexedDB)
 * @returns {Promise<*>} Promesa que resuelve el valor guardado o null
 */
export async function readExtendedCacheValue() {
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

/**
 * Limpia el valor de la caché extendida (IndexedDB)
 * @returns {Promise<void>} Promesa que resuelve cuando se ha limpiado
 */
export async function clearExtendedCacheValue() {
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

/**
 * Obtiene el texto de la hoja de estilos para exportación
 * @returns {Promise<string>} Promesa que resuelve el CSS como string
 */
export async function getStylesheetTextForExport() {
  if (cachedStylesheetForExport !== null) {
    return cachedStylesheetForExport;
  }

  const linkEl = document.querySelector('link[rel="stylesheet"][href]');
  if (!linkEl) {
    cachedStylesheetForExport = '';
    return cachedStylesheetForExport;
  }

  const href = linkEl.href || linkEl.getAttribute('href');

  try {
    const response = await fetch(href);
    if (!response.ok) {
      throw new Error(`No se pudo cargar estilos: ${response.status}`);
    }
    cachedStylesheetForExport = await response.text();
    return cachedStylesheetForExport;
  } catch (error) {
    console.error('Error cargando estilos para exportación:', error);
    try {
      const targetSheet = Array.from(document.styleSheets || []).find(sheet => sheet.ownerNode === linkEl);
      if (targetSheet?.cssRules) {
        cachedStylesheetForExport = Array.from(targetSheet.cssRules).map(rule => rule.cssText).join('\n');
        return cachedStylesheetForExport;
      }
    } catch (cssError) {
      console.warn('No se pudo leer reglas CSS para exportación:', cssError);
    }
    cachedStylesheetForExport = '';
    return cachedStylesheetForExport;
  }
}

/**
 * Limpia el caché de la hoja de estilos
 */
export function clearStylesheetCache() {
  cachedStylesheetForExport = null;
}

/**
 * Resetea la promesa de la base de datos (útil para testing)
 */
export function resetExtendedCacheDb() {
  extendedCacheDbPromise = null;
}
