export class ThemeManager {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.editor = uiModule.editor;
    this.body = document.body;
  }

  initialize() {
    const theme = this.editor.config.get('ui.theme');
    if (theme) {
      this.applyTheme(theme);
    }
  }

  applyTheme(theme) {
    if (!this.body) return;

    this.body.dataset.editorTheme = theme;
  }

  updateSectionTheme() {
    const currentSection = this.editor.state.get('currentSection');
    if (!currentSection) return;

    const sectionElement = document.querySelector(`[data-section-id="${currentSection}"]`);
    if (sectionElement && sectionElement.dataset.theme) {
      this.applyTheme(sectionElement.dataset.theme);
    }
  }
}
