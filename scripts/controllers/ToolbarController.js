export class ToolbarController {
  constructor(uiModule) {
    this.ui = uiModule;
    this.dropdown = null;
    this.toggleButton = null;
  }

  initialize() {
    this.toggleButton = document.getElementById('topbarToolsToggle');
    this.dropdown = document.getElementById('topbarToolsDropdown');

    if (this.toggleButton) {
      this.ui.listen(this.toggleButton, 'click', () => {
        this.toggleDropdown();
      });
    }

    if (this.dropdown) {
      this.ui.listen(document, 'click', (event) => {
        if (!this.dropdown.contains(event.target) && event.target !== this.toggleButton) {
          this.close();
        }
      });
    }
  }

  toggleDropdown() {
    if (!this.dropdown) {
      return;
    }

    const expanded = this.toggleButton?.getAttribute('aria-expanded') === 'true';
    const nextExpanded = !expanded;

    this.toggleButton?.setAttribute('aria-expanded', String(nextExpanded));
    this.dropdown.hidden = !nextExpanded;
  }

  close() {
    if (!this.dropdown) {
      return;
    }
    this.dropdown.hidden = true;
    this.toggleButton?.setAttribute('aria-expanded', 'false');
  }
}
