import { BaseModule } from './BaseModule.js';

export class SectionsModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.sections = [];
  }

  initialize() {
    this.sections = Array.from(document.querySelectorAll('[data-section-id]')).map((section) => ({
      id: section.dataset.sectionId,
      element: section
    }));

    if (this.sections.length > 0) {
      this.state.set('currentSection', this.sections[0].id, { addToHistory: false });
    }
  }

  create(name) {
    const id = `section-${Date.now()}`;
    const section = {
      id,
      name: name || 'Nueva sección'
    };
    this.sections.push(section);
    this.state.set('currentSection', id);
    this.emit('section:created', section);
    return section;
  }
}
