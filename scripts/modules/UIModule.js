import { BaseModule } from './BaseModule.js';
import { ToolbarController } from '../controllers/ToolbarController.js';
import { PanelController } from '../controllers/PanelController.js';
import { ModalController } from '../controllers/ModalController.js';

class ThemeManager {
  constructor(uiModule) {
    this.ui = uiModule;
    this.currentTheme = null;
  }

  initialize() {
    const preferredTheme = this.ui.config.get('ui.theme') || 'default';
    this.applyTheme(preferredTheme);
    this.bindTopbarThemeControls();
    this.bindBodyThemeControls();
  }

  bindTopbarThemeControls() {
    const dropdown = document.getElementById('topbarThemeDropdown');
    if (!dropdown) {
      return;
    }

    this.ui.listen(dropdown, 'click', (event) => {
      const button = event.target.closest('[data-theme]');
      if (!button) {
        return;
      }
      const themeClass = button.getAttribute('data-theme');
      this.applyTopbarTheme(themeClass);
    });
  }

  bindBodyThemeControls() {
    const themeSelect = document.getElementById('themeSelect');
    if (!themeSelect) {
      return;
    }

    this.ui.listen(themeSelect, 'change', () => {
      this.applyTheme(themeSelect.value);
    });
  }

  applyTheme(themeName) {
    this.currentTheme = themeName;
    document.body.setAttribute('data-editor-theme', themeName);
  }

  applyTopbarTheme(themeClass) {
    const topbar = document.querySelector('[data-topbar]');
    if (!topbar) {
      return;
    }

    topbar.classList.forEach((className) => {
      if (className.startsWith('topbar-color-')) {
        topbar.classList.remove(className);
      }
    });
    if (themeClass) {
      topbar.classList.add(themeClass);
    }
  }

  updateSectionTheme() {
    const currentSectionId = this.ui.state.get('sections.current');
    if (currentSectionId) {
      document.body.setAttribute('data-current-section', currentSectionId);
    } else {
      document.body.removeAttribute('data-current-section');
    }
  }
}

class LayoutManager {
  constructor(uiModule) {
    this.ui = uiModule;
    this.root = document.documentElement;
    this.content =
      document.querySelector('[data-pages-wrapper]') ||
      document.querySelector('.pages-wrapper') ||
      document.querySelector('.pages-container') ||
      document.querySelector('.pages') ||
      null;
  }

  initialize() {
    this.updateZoom(this.ui.state.get('zoom'));
    this.toggleReadingMode(this.ui.state.get('ui.readingMode'));
  }

  updateZoom(value) {
    const zoomValue = Number(value) || 1;
    this.root.style.setProperty('--editor-zoom', zoomValue);
    if (this.content) {
      this.content.style.setProperty('transform', `scale(${zoomValue})`);
      this.content.style.setProperty('transform-origin', 'top center');
    }
  }

  toggleReadingMode(enabled) {
    document.body.classList.toggle('reading-mode', !!enabled);
  }

  handleResize() {
    this.ui.emit('layout:resized');
  }
}

export class UIModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.controllers = {
      toolbar: new ToolbarController(this),
      panel: new PanelController(this),
      modal: new ModalController(this)
    };

    this.theme = new ThemeManager(this);
    this.layout = new LayoutManager(this);
  }

  render() {
    this.setupTheme();
    this.setupLayout();
    this.setupControllers();
    this.setupGlobalEventListeners();
  }

  setupTheme() {
    this.subscribeToState('currentSection', () => {
      this.theme.updateSectionTheme();
    });

    this.theme.initialize();
  }

  setupLayout() {
    this.layout.initialize();

    this.subscribeToState('zoom', ({ value }) => {
      this.layout.updateZoom(value);
    });

    this.subscribeToState('ui.readingMode', ({ value }) => {
      this.layout.toggleReadingMode(value);
    });
  }

  setupControllers() {
    Object.values(this.controllers).forEach((controller) => {
      if (typeof controller.initialize === 'function') {
        controller.initialize();
      }
    });
  }

  setupGlobalEventListeners() {
    this.listen(document, 'keydown', (event) => {
      this.handleGlobalKeydown(event);
    });

    this.listen(window, 'resize', () => {
      this.layout.handleResize();
    });
  }

  handleGlobalKeydown(event) {
    if (event.key === 'Escape') {
      this.closeAllDialogs();
    }

    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          this.editor.save();
          break;
        case 'z':
          event.preventDefault();
          if (event.shiftKey) {
            this.editor.state.redo();
          } else {
            this.editor.state.undo();
          }
          break;
      }
    }
  }

  closeAllDialogs() {
    this.controllers.modal.closeAll();
    this.controllers.panel.close();
    this.emit('ui:dialogs:closed');
  }

  showMessage(message, type = 'info', duration = 3000) {
    const notification = this.createNotification(message, type);
    document.body.appendChild(notification);

    this.setTimeout(() => {
      notification.remove();
    }, duration);
  }

  createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    return notification;
  }
}
