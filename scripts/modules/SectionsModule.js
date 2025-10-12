import { BaseModule } from './BaseModule.js';
import { generateUniqueId } from '../utils/id.js';

export class SectionsModule extends BaseModule {
  constructor(editor) {
    super(editor);
    this.sections = [];
  }

  initialize(initialSections = []) {
    const sectionsArray = Array.isArray(initialSections) ? initialSections : [];
    this.sections = sectionsArray.map((section) => ({
      id: section.id || generateUniqueId('section'),
      name: section.name || 'Nueva sección',
      createdAt: section.createdAt || new Date().toISOString(),
      ...section
    }));

    this.state.set('sections.all', [...this.sections], { silent: true, addToHistory: false });

    const current = this.sections[0] || null;
    this.state.set('sections.current', current?.id ?? null, { silent: true, addToHistory: false });
    if (current) {
      this.editor.emit('section:changed', current);
    }
  }

  create(name) {
    const section = {
      id: generateUniqueId('section'),
      name: name || `Sección ${this.sections.length + 1}`,
      createdAt: new Date().toISOString()
    };

    this.sections.push(section);
    this.state.set('sections.all', [...this.sections], { addToHistory: true });
    this.select(section.id);
    this.editor.emit('section:created', section);
    return section;
  }

  select(sectionId) {
    const section = this.sections.find((item) => item.id === sectionId) || null;
    this.state.set('sections.current', section ? section.id : null, { addToHistory: false });
    if (section) {
      this.editor.emit('section:changed', section);
    }
    return section;
  }

  exportData() {
    return [...this.sections];
  }
}
