import { BaseModule } from './BaseModule.js';

export class SectionsModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.sections = new Map();
  }

  initialize(snapshot) {
    this.scanSections();

    if (snapshot?.currentSectionId) {
      const section = this.sections.get(snapshot.currentSectionId);
      if (section) {
        this.state.set('currentSection', section, { addToHistory: false });
      }
    } else if (!this.state.get('currentSection')) {
      const firstSection = this.sections.values().next().value || null;
      if (firstSection) {
        this.state.set('currentSection', firstSection, { addToHistory: false });
      }
    }
  }

  scanSections() {
    this.sections.clear();
    const sectionNodes = document.querySelectorAll('[data-section], .page');
    let index = 1;

    sectionNodes.forEach(node => {
      const id = node.id || node.dataset.sectionId || `section-${index++}`;
      const name = node.dataset.sectionName || node.querySelector('h2, h3, h4')?.textContent?.trim() || `Sección ${index}`;
      const section = { id, name, element: node };
      this.sections.set(id, section);
      node.dataset.sectionId = id;
    });
  }

  create(name) {
    const sectionName = name?.trim() || `Sección ${this.sections.size + 1}`;
    const sectionId = `section-${Date.now()}`;

    const sectionElement = document.createElement('section');
    sectionElement.className = 'page';
    sectionElement.dataset.sectionId = sectionId;
    sectionElement.innerHTML = `\n      <header class="page__header">\n        <h2>${sectionName}</h2>\n      </header>\n      <div class="page__content"></div>\n    `;

    this.editor.container.appendChild(sectionElement);

    const section = { id: sectionId, name: sectionName, element: sectionElement };
    this.sections.set(sectionId, section);
    this.state.set('currentSection', section);

    return section;
  }

  exportData() {
    return {
      sections: Array.from(this.sections.values()).map(section => ({
        id: section.id,
        name: section.name
      })),
      currentSectionId: this.state.get('currentSection')?.id || null
    };
  }

  destroy() {
    super.destroy();
    this.sections.clear();
  }
}
