import { BaseModule } from './BaseModule.js';
import { generateUniqueId } from '../utils/id.js';
import { clamp } from '../utils/math.js';

const DEFAULT_SECTION_NAME = 'Sección';
const DEFAULT_TOPIC_NAME = 'Tema';
const DEFAULT_SECTION_THEME = 'theme-blue';
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';
const DOCUMENT_SHIFT_MIN = -1500;
const DOCUMENT_SHIFT_MAX = 1500;

export class SectionsModule extends BaseModule {
  constructor(editor) {
    super(editor);

    this.sections = [];
    this.specialty = '';
    this.pageElements = new Map();

    this.sectionsContainer = null;
    this.topicCountElement = null;
    this.specialtyTitleElement = null;
    this.scriptAnchor = null;
  }

  initialize() {
    this.cacheDom();
    this.loadExistingSections();
    this.updateSpecialtyTitle();
    this.emitSectionsUpdate();

    this.subscribeToState('currentSection', () => this.emitSectionsUpdate());
    this.subscribeToState('currentPage', () => this.emitSectionsUpdate());
    this.subscribeToState('editMode', ({ value }) => this.reflectEditMode(value));

    this.reflectEditMode(this.state.get('editMode'));
  }

  cacheDom() {
    this.sectionsContainer = document.getElementById('sectionsContainer');
    this.topicCountElement = document.getElementById('panelTopicCount');
    this.specialtyTitleElement = document.getElementById('specialtyTitle');
    this.scriptAnchor = document.querySelector('script[type="module"][src="scripts/app.js"]')
      || document.querySelector('script[type="module"]')
      || document.querySelector('script[src="scripts/app.js"]');
  }

  loadExistingSections() {
    this.pageElements.clear();

    const pages = Array.from(document.querySelectorAll('.page'));
    if (pages.length === 0) {
      this.sections = [];
      return;
    }

    const sectionMap = new Map();

    const isEditing = !!this.state.get('editMode');

    pages.forEach((page) => {
      const sectionId = page.dataset.sectionId || generateUniqueId('section');
      const sectionName = page.dataset.sectionName || DEFAULT_SECTION_NAME;
      const topicId = page.dataset.topicId || page.id || generateUniqueId('topic');
      const title = page.dataset.topicTitle
        || this.extractHeadingTitle(page)
        || `${DEFAULT_TOPIC_NAME} ${this.pageElements.size + 1}`;
      const theme = page.dataset.theme || DEFAULT_SECTION_THEME;

      page.dataset.sectionId = sectionId;
      page.dataset.sectionName = sectionName;
      page.dataset.topicId = topicId;
      page.dataset.topicTitle = title;
      page.dataset.theme = theme;
      page.id = page.id || topicId;

      this.applyPageEditability(page, isEditing);

      if (!sectionMap.has(sectionId)) {
        sectionMap.set(sectionId, {
          id: sectionId,
          name: sectionName,
          collapsed: false,
          theme,
          topics: []
        });
      }

      sectionMap.get(sectionId).topics.push({
        id: topicId,
        title,
        html: page.innerHTML,
        theme,
        sectionId,
        element: page
      });

      this.pageElements.set(topicId, page);
    });

    this.sections = Array.from(sectionMap.values());

    if (this.sections.length > 0) {
      const firstSection = this.sections[0];
      const firstTopic = firstSection.topics[0];
      this.state.set('currentSection', firstSection.id, { addToHistory: false, silent: true });
      this.state.set('currentPage', this.createStatePagePayload(firstTopic), { addToHistory: false, silent: true });
    }

    if (!this.specialty && this.specialtyTitleElement?.textContent) {
      this.specialty = this.specialtyTitleElement.textContent.trim();
    }
  }

  extractHeadingTitle(element) {
    const heading = element.querySelector(HEADING_SELECTOR);
    return heading?.textContent?.trim() || '';
  }

  importData(payload = {}) {
    const normalized = this.normalizeImportPayload(payload);
    const sections = normalized.sections;

    this.specialty = normalized.specialty || this.specialty;

    this.clearDocumentPages();

    this.sections = sections.map((sectionData, sectionIndex) => this.normalizeSection(sectionData, sectionIndex));

    this.renderPages();
    this.updateSpecialtyTitle();

    if (typeof normalized.documentShift === 'number') {
      this.state.set('documentShift', normalized.documentShift, { addToHistory: false });
    }

    const firstSection = this.sections[0] || null;
    const firstTopic = firstSection?.topics[0] || null;
    this.state.set('currentSection', firstSection?.id || null, { addToHistory: false });
    this.state.set('currentPage', this.createStatePagePayload(firstTopic), { addToHistory: false });

    this.emitSectionsUpdate();
    this.reflectEditMode(this.state.get('editMode'));

    return {
      sections: this.getSnapshot().sections,
      specialty: this.specialty,
      documentShift: normalized.documentShift
    };
  }

  normalizeImportPayload(payload) {
    if (Array.isArray(payload)) {
      return {
        sections: payload,
        specialty: '',
        documentShift: null
      };
    }

    const sectionCandidates = [
      payload?.sections,
      payload?.secciones,
      payload?.sections?.sections,
      payload?.sections?.secciones,
      payload?.secciones?.sections,
      payload?.secciones?.secciones
    ];

    let resolvedSections = [];
    for (const candidate of sectionCandidates) {
      if (Array.isArray(candidate)) {
        resolvedSections = candidate;
        break;
      }
      if (candidate && Array.isArray(candidate.sections)) {
        resolvedSections = candidate.sections;
        break;
      }
    }

    const specialtyCandidates = [
      payload?.specialty,
      payload?.especialidad,
      payload?.sections?.specialty,
      payload?.sections?.especialidad,
      payload?.secciones?.specialty,
      payload?.secciones?.especialidad
    ];

    const specialty = specialtyCandidates.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

    const rawShift = payload?.documentShift
      ?? payload?.sections?.documentShift
      ?? payload?.secciones?.documentShift;
    const documentShift = Number.isFinite(Number(rawShift))
      ? clamp(Number(rawShift), DOCUMENT_SHIFT_MIN, DOCUMENT_SHIFT_MAX)
      : null;

    return {
      sections: resolvedSections,
      specialty,
      documentShift
    };
  }

  normalizeSection(sectionData, index) {
    const id = sectionData?.id ? String(sectionData.id).trim() : generateUniqueId('section');
    const rawName = sectionData?.nombre ?? sectionData?.name ?? sectionData?.title;
    const name = rawName ? String(rawName).trim() : `${DEFAULT_SECTION_NAME} ${index + 1}`;
    const collapsed = typeof sectionData?.collapsed === 'boolean'
      ? sectionData.collapsed
      : !!sectionData?.colapsado;
    const theme = sectionData?.theme ? String(sectionData.theme).trim() : DEFAULT_SECTION_THEME;

    const topicsSource = Array.isArray(sectionData?.temas)
      ? sectionData.temas
      : Array.isArray(sectionData?.topics)
        ? sectionData.topics
        : [];

    const normalizedTopics = topicsSource.map((topicData, topicIndex) => this.normalizeTopic(topicData, {
      sectionId: id,
      sectionName: name,
      sectionTheme: theme,
      index: topicIndex
    }));

    return {
      id,
      name,
      collapsed,
      theme,
      topics: normalizedTopics
    };
  }

  normalizeTopic(topicData, context) {
    const id = topicData?.id ? String(topicData.id).trim() : generateUniqueId('topic');
    const rawTitle = topicData?.titulo ?? topicData?.title ?? topicData?.nombre;
    const title = rawTitle ? String(rawTitle).trim() : `${DEFAULT_TOPIC_NAME} ${context.index + 1}`;

    const theme = topicData?.theme
      ? String(topicData.theme).trim()
      : context.sectionTheme;

    const sectionName = topicData?.sectionName
      ? String(topicData.sectionName).trim()
      : context.sectionName;

    const htmlSource = typeof topicData?.html === 'string'
      ? topicData.html
      : typeof topicData?.contenido === 'string'
        ? topicData.contenido
        : '';

    return {
      id,
      title,
      html: htmlSource,
      theme,
      sectionId: context.sectionId,
      sectionName: sectionName
    };
  }

  renderPages() {
    this.clearDocumentPages();

    const fragment = document.createDocumentFragment();

    const isEditing = !!this.state.get('editMode');

    this.sections.forEach((section) => {
      section.topics.forEach((topic) => {
        const page = document.createElement('section');
        page.className = 'page';
        page.dataset.sectionId = section.id;
        page.dataset.sectionName = section.name;
        page.dataset.topicId = topic.id;
        page.dataset.topicTitle = topic.title;
        page.dataset.theme = topic.theme || section.theme || DEFAULT_SECTION_THEME;
        page.id = topic.id;
        page.innerHTML = topic.html || '';

        this.applyPageEditability(page, isEditing);

        fragment.appendChild(page);
        this.pageElements.set(topic.id, page);
      });
    });

    if (fragment.childNodes.length === 0) {
      return;
    }

    const anchor = this.scriptAnchor || document.body.lastElementChild;
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(fragment, anchor);
    } else {
      document.body.appendChild(fragment);
    }
  }

  clearDocumentPages() {
    this.pageElements.forEach((page) => {
      if (page?.parentNode) {
        page.parentNode.removeChild(page);
      }
    });
    this.pageElements.clear();

    const residualPages = document.querySelectorAll('.page');
    residualPages.forEach((page) => {
      page.parentNode?.removeChild(page);
    });
  }

  updateSpecialtyTitle() {
    if (!this.specialtyTitleElement) {
      return;
    }

    const title = this.specialty?.trim() || '';
    this.specialtyTitleElement.textContent = title;
    if (title) {
      this.specialtyTitleElement.setAttribute('title', title);
      document.title = title;
    }
  }

  applyPageEditability(page, isEditing) {
    if (!page) {
      return;
    }
    const editable = !!isEditing;
    page.contentEditable = editable ? 'true' : 'false';
    page.spellcheck = editable;
    page.classList.toggle('page--editing', editable);
    if (editable) {
      page.setAttribute('role', 'textbox');
      page.setAttribute('aria-multiline', 'true');
      if (!page.dataset.editListenersBound) {
        const handleInput = () => this.updateTopicFromPage(page, { updateTitle: false });
        const handleBlur = () => this.updateTopicFromPage(page, { updateTitle: true });
        this.addDomListener(page, 'input', handleInput);
        this.addDomListener(page, 'blur', handleBlur);
        page.dataset.editListenersBound = 'true';
      }
    } else {
      page.removeAttribute('role');
      page.removeAttribute('aria-multiline');
    }
  }

  createStatePagePayload(topic) {
    if (!topic) {
      return null;
    }

    return {
      topicId: topic.id,
      sectionId: topic.sectionId,
      title: topic.title,
      dataset: {
        topicId: topic.id,
        sectionId: topic.sectionId,
        sectionName: topic.sectionName
      }
    };
  }

  toggleSection(sectionId, forceValue) {
    const section = this.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const next = typeof forceValue === 'boolean' ? !forceValue : !section.collapsed;
    section.collapsed = next;
    this.emitSectionsUpdate();
  }

  toggleAllSections(expand) {
    if (this.sections.length === 0) {
      return;
    }

    let shouldExpand = typeof expand === 'boolean' ? expand : null;
    if (shouldExpand === null) {
      shouldExpand = this.sections.some((section) => section.collapsed);
    }

    this.sections.forEach((section) => {
      section.collapsed = !shouldExpand;
    });

    this.emitSectionsUpdate();
  }

  setActiveTopic(sectionId, topicId, { scrollIntoView = true } = {}) {
    const section = this.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const topic = section.topics.find((item) => item.id === topicId);
    if (!topic) {
      return;
    }

    const currentSection = this.state.get('currentSection');
    const currentTopicState = this.state.get('currentPage');
    const currentTopicId = currentTopicState?.dataset?.topicId || currentTopicState?.topicId || null;

    if (currentSection === sectionId && currentTopicId === topicId) {
      if (scrollIntoView) {
        this.scrollTopicIntoView(topicId);
      }
      return;
    }

    this.state.set('currentSection', section.id, { addToHistory: false });
    this.state.set('currentPage', this.createStatePagePayload(topic), { addToHistory: false });

    section.collapsed = false;

    if (scrollIntoView) {
      this.scrollTopicIntoView(topicId);
    }

    this.emitSectionsUpdate();
    this.editor.emit('sections:topic-selected', { section, topic });
  }

  scrollTopicIntoView(topicId) {
    const page = this.pageElements.get(topicId);
    if (!page) {
      return;
    }

    page.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getSnapshot() {
    const currentSection = this.state.get('currentSection');
    const currentPage = this.state.get('currentPage');
    const activeTopicId = currentPage?.dataset?.topicId || currentPage?.topicId || null;

    let totalTopics = 0;

    const sections = this.sections.map((section) => {
      const topics = section.topics.map((topic, index) => ({
        id: topic.id,
        title: topic.title,
        index,
        sectionId: section.id
      }));
      totalTopics += topics.length;
      return {
        id: section.id,
        name: section.name,
        collapsed: section.collapsed,
        theme: section.theme,
        topics
      };
    });

    return {
      sections,
      specialty: this.specialty,
      totalTopics,
      activeSectionId: currentSection,
      activeTopicId: activeTopicId || null
    };
  }

  emitSectionsUpdate() {
    const snapshot = this.getSnapshot();
    this.emit('sections:updated', snapshot);
    this.editor.emit('sections:updated', snapshot);

    if (this.topicCountElement) {
      const count = snapshot.totalTopics;
      const label = count === 1 ? 'tema' : 'temas';
      this.topicCountElement.textContent = `${count} ${label}`;
    }
  }

  reflectEditMode(isEditing) {
    const editable = !!isEditing;
    this.pageElements.forEach((page) => {
      this.applyPageEditability(page, editable);
    });
  }

  updateTopicFromPage(page, { updateTitle = false } = {}) {
    if (!page) {
      return;
    }

    const topicId = page.dataset.topicId;
    const sectionId = page.dataset.sectionId;
    if (!topicId || !sectionId) {
      return;
    }

    const section = this.sections.find((item) => item.id === sectionId);
    if (!section) {
      return;
    }

    const topic = section.topics.find((item) => item.id === topicId);
    if (!topic) {
      return;
    }

    topic.html = page.innerHTML;

    if (updateTitle) {
      const newTitle = this.extractHeadingTitle(page) || page.dataset.topicTitle || topic.title;
      if (newTitle && newTitle !== topic.title) {
        topic.title = newTitle;
        page.dataset.topicTitle = newTitle;

        const currentPage = this.state.get('currentPage');
        const currentTopicId = currentPage?.dataset?.topicId || currentPage?.topicId;
        if (currentTopicId === topicId) {
          this.state.set('currentPage', this.createStatePagePayload(topic), { addToHistory: false });
        } else {
          this.emitSectionsUpdate();
        }
      }
    }
  }

  exportData() {
    return {
      specialty: this.specialty,
      sections: this.sections.map((section) => ({
        id: section.id,
        nombre: section.name,
        collapsed: section.collapsed,
        theme: section.theme,
        temas: section.topics.map((topic) => ({
          id: topic.id,
          titulo: topic.title,
          html: topic.html,
          theme: topic.theme,
          sectionName: topic.sectionName
        }))
      })),
      documentShift: this.state.get('documentShift') ?? 0
    };
  }
}
