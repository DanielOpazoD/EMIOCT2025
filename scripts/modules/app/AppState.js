export class AppState {
  constructor() {
    this.isEditMode = false;
    this.isReadingMode = false;
    this.theme = 'theme-blue';
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    return this.isEditMode;
  }

  setEditMode(enabled) {
    this.isEditMode = Boolean(enabled);
    return this.isEditMode;
  }

  toggleReadingMode() {
    this.isReadingMode = !this.isReadingMode;
    return this.isReadingMode;
  }

  setTheme(theme) {
    this.theme = theme;
  }
}
