import {
  IMAGE_VIEWER_DEFAULT_CONTEXT_KEY
} from './editorConfig.js';

export function getDefaultImageViewerContext() {
  return {
    images: [],
    selectedImageId: null,
    notesById: {}
  };
}

export function getDefaultImageViewerState() {
  return {
    contexts: {
      [IMAGE_VIEWER_DEFAULT_CONTEXT_KEY]: getDefaultImageViewerContext()
    },
    activeContext: IMAGE_VIEWER_DEFAULT_CONTEXT_KEY
  };
}

export function sanitizeViewerImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  const unique = new Map();

  images.forEach((image) => {
    if (!image || typeof image !== 'object') {
      return;
    }

    const id = typeof image.id === 'string' ? image.id : '';
    const dataUrl = typeof image.dataUrl === 'string' ? image.dataUrl : '';
    if (!id || !dataUrl) {
      return;
    }

    unique.set(id, {
      id,
      dataUrl,
      name: typeof image.name === 'string' && image.name ? image.name : 'imagen-sin-nombre',
      size: Number.isFinite(image.size) ? image.size : 0,
      type: typeof image.type === 'string' && image.type ? image.type : 'image/*',
      createdAt: typeof image.createdAt === 'string' ? image.createdAt : new Date().toISOString(),
      width: Number.isFinite(image.width) ? image.width : null,
      height: Number.isFinite(image.height) ? image.height : null
    });
  });

  return Array.from(unique.values());
}

export function sanitizeImageViewerContext(context) {
  if (!context || typeof context !== 'object') {
    return getDefaultImageViewerContext();
  }

  const sanitizedImages = sanitizeViewerImages(context.images);
  const notesById = {};

  if (context.notesById && typeof context.notesById === 'object') {
    Object.entries(context.notesById).forEach(([key, value]) => {
      if (typeof value === 'string') {
        notesById[key] = value;
      }
    });
  }

  let selectedImageId = typeof context.selectedImageId === 'string' ? context.selectedImageId : null;
  if (!sanitizedImages.some((image) => image.id === selectedImageId)) {
    selectedImageId = sanitizedImages.length ? sanitizedImages[sanitizedImages.length - 1].id : null;
  }

  return {
    images: sanitizedImages,
    selectedImageId,
    notesById
  };
}

export function sanitizeImageViewerState(next) {
  if (!next || typeof next !== 'object') {
    return getDefaultImageViewerState();
  }

  const looksLegacy = Array.isArray(next.images)
    || typeof next.selectedImageId === 'string'
    || (next.notesById && typeof next.notesById === 'object');

  if (looksLegacy) {
    const legacyContext = sanitizeImageViewerContext({
      images: next.images,
      selectedImageId: next.selectedImageId,
      notesById: next.notesById
    });
    return {
      contexts: {
        [IMAGE_VIEWER_DEFAULT_CONTEXT_KEY]: legacyContext
      },
      activeContext: IMAGE_VIEWER_DEFAULT_CONTEXT_KEY
    };
  }

  const incomingContexts = next.contexts && typeof next.contexts === 'object' ? next.contexts : {};
  const sanitizedContexts = {};

  Object.entries(incomingContexts).forEach(([key, value]) => {
    if (typeof key !== 'string' || !key) {
      return;
    }
    sanitizedContexts[key] = sanitizeImageViewerContext(value);
  });

  if (!Object.keys(sanitizedContexts).length) {
    sanitizedContexts[IMAGE_VIEWER_DEFAULT_CONTEXT_KEY] = getDefaultImageViewerContext();
  } else if (!sanitizedContexts[IMAGE_VIEWER_DEFAULT_CONTEXT_KEY]) {
    sanitizedContexts[IMAGE_VIEWER_DEFAULT_CONTEXT_KEY] = getDefaultImageViewerContext();
  }

  const availableKeys = Object.keys(sanitizedContexts);
  let activeContext = typeof next.activeContext === 'string' && sanitizedContexts[next.activeContext]
    ? next.activeContext
    : null;

  if (!activeContext) {
    if (availableKeys.includes(IMAGE_VIEWER_DEFAULT_CONTEXT_KEY)) {
      activeContext = IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
    } else {
      activeContext = availableKeys[0];
    }
  }

  if (!activeContext || !sanitizedContexts[activeContext]) {
    activeContext = IMAGE_VIEWER_DEFAULT_CONTEXT_KEY;
    sanitizedContexts[activeContext] = sanitizedContexts[activeContext] || getDefaultImageViewerContext();
  }

  return {
    contexts: sanitizedContexts,
    activeContext
  };
}
