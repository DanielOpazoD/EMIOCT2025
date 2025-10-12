import { BaseModule } from './BaseModule.js';
import { ToolbarController } from '../controllers/ToolbarController.js';
import { PanelController } from '../controllers/PanelController.js';
import { ModalController } from '../controllers/ModalController.js';
import { ThemeManager } from '../managers/ThemeManager.js';
import { LayoutManager } from '../managers/LayoutManager.js';

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
      controller.initialize?.();
    });
  }

  setupGlobalEventListeners() {
    this.addDomListener(document, 'keydown', (event) => {
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
        default:
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
