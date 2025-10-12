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
      compression: false
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
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.config);

    target[lastKey] = value;
  }

  mergeDeep(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}
