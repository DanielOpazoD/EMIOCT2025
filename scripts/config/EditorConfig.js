export class EditorConfig {
  static DEFAULTS = {
    modules: {
      notes: {
        enabled: true,
        defaultWidth: 240,
        minWidth: 160,
        minHeight: 140,
        maxVisible: 50,
        autosave: true
      },
      sections: {
        enabled: true,
        defaultTheme: 'theme-blue',
        allowNesting: false
      },
      toolbar: {
        enabled: true,
        position: 'top',
        customButtons: []
      }
    },
    ui: {
      theme: 'default',
      animations: true,
      shortcuts: true
    },
    persistence: {
      autosave: true,
      interval: 30000,
      storage: 'localStorage',
      compression: false,
      storageKey: 'emi-editor-cache-v1'
    },
    performance: {
      debounceDelay: 300,
      throttleLimit: 100,
      virtualScrolling: false,
      lazyLoading: true
    }
  };

  constructor(userConfig = {}) {
    this.config = this.mergeDeep(EditorConfig.DEFAULTS, userConfig);
  }

  get(path) {
    if (!path) {
      return undefined;
    }

    return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), this.config);
  }

  set(path, value) {
    if (!path) {
      return;
    }

    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((acc, key) => {
      if (!acc[key] || typeof acc[key] !== 'object') {
        acc[key] = {};
      }
      return acc[key];
    }, this.config);

    target[lastKey] = value;
  }

  mergeDeep(target, source) {
    const result = Array.isArray(target) ? [...target] : { ...target };

    Object.keys(source || {}).forEach((key) => {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue)
      ) {
        result[key] = this.mergeDeep(
          targetValue && typeof targetValue === 'object' ? targetValue : {},
          sourceValue
        );
      } else {
        result[key] = sourceValue;
      }
    });

    return result;
  }
}
