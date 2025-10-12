import { BaseModule } from './BaseModule.js';
import { ToolbarController } from '../controllers/ToolbarController.js';
import { PanelController } from '../controllers/PanelController.js';
import { ModalController } from '../controllers/ModalController.js';

class ThemeManager {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.currentTheme = null;
  }

  initialize() {
    this.currentTheme = this.uiModule.config.get('ui.theme');
    this.applyTheme(this.currentTheme);
  }

  applyTheme(theme) {
    const body = document.body;
    if (!body) return;

    body.dataset.editorTheme = theme;
    this.currentTheme = theme;
  }

  updateSectionTheme() {
    const section = this.uiModule.state.get('currentSection');
    if (section?.element?.dataset?.theme) {
      this.applyTheme(section.element.dataset.theme);
    }
  }
}

class LayoutManager {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.zoomDisplay = document.getElementById('zoomValue');
  }

  initialize() {
    this.updateZoom(this.uiModule.state.get('zoom'));
  }

  updateZoom(value) {
    if (this.zoomDisplay) {
      const percentage = Math.round((value || 1) * 100);
      this.zoomDisplay.textContent = `${percentage}%`;
    }

    const root = document.querySelector('[data-editor-root]') || document.body;
    if (root) {
      root.style.setProperty('--editor-zoom', value || 1);
      root.style.transform = `scale(${value || 1})`;
      root.style.transformOrigin = 'top left';
    }
  }

  toggleReadingMode(active) {
    document.body.classList.toggle('is-reading-mode', active);
  }

  handleResize() {
    this.uiModule.emit('layout:resize');
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
    Object.values(this.controllers).forEach(controller => {
      controller.initialize();
    });
  }

  setupGlobalEventListeners() {
    this.addDomListener(document, 'keydown', event => {
      this.handleGlobalKeydown(event);
    });

    this.addDomListener(window, 'resize', () => {
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
