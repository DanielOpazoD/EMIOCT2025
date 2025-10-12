import { BaseModule } from './BaseModule.js';
import { generateUniqueId } from '../utils/id.js';
import { clamp } from '../utils/math.js';

const DEFAULT_SECTION_NAME = 'Sección';
const DEFAULT_TOPIC_NAME = 'Tema';
const DEFAULT_SECTION_THEME = 'theme-blue';
const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';
const DOCUMENT_SHIFT_MIN = -1500;
const DOCUMENT_SHIFT_MAX = 1500;

const SECTION_COLLECTION_KEYS = [
  'sections',
  'secciones',
  'tematicas',
  'chapters',
  'capitulos',
  'groups',
  'grupos',
  'items',
  'lista',
  'list',
  'data',
  'values',
  'collection',
  'entries',
  'children',
  'pages',
  'paginas'
];

const TOPIC_COLLECTION_KEYS = [
  'temas',
  'topics',
  'temasAgrupados',
  'temasSeccion',
  'children',
  'pages',
  'paginas',
  'items',
  'lista',
  'list',
  'data',
  'values',
  'collection',
  'entries',
  'contenido'
];

const KNOWN_THEME_CLASSES = [
  'theme-blue',
  'theme-green',
  'theme-purple',
  'theme-orange',
  'theme-teal',
  'theme-rose',
  'theme-sand',
  'theme-slate'
];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function filterObjectEntries(collection) {
  return collection
    .filter((item) => item !== null && item !== undefined)
    .map((item) => {
      if (isPlainObject(item)) {
        return item;
      }
      if (typeof item === 'string') {
        return { html: item };
      }
      return null;
    })
    .filter((item) => item !== null);
}

function extractThemeFromClassList(element) {
  const themeClass = Array.from(element.classList).find((cls) => cls.startsWith('theme-'));
  return themeClass || '';
}

function normalizeTheme(theme) {
  if (typeof theme !== 'string' || !theme.trim()) {
    return DEFAULT_SECTION_THEME;
  }
  const trimmed = theme.trim();
  if (KNOWN_THEME_CLASSES.includes(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('theme-')) {
    return trimmed;
  }
  return DEFAULT_SECTION_THEME;
}

function extractTopicHtml(topicData) {
  const candidates = [
    topicData?.html,
    topicData?.contenido,
    topicData?.body,
    topicData?.content,
    topicData?.texto,
    topicData?.text,
    topicData?.htmlContent,
    topicData?.descripcion
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      return candidate;
    }
  }

  if (Array.isArray(topicData?.paragraphs)) {
    return topicData.paragraphs
      .filter((paragraph) => typeof paragraph === 'string')
      .map((paragraph) => `<p>${paragraph}</p>`)
      .join('');
  }

  if (Array.isArray(topicData?.contenido)) {
    return topicData.contenido
      .filter((entry) => typeof entry === 'string')
      .map((entry) => `<p>${entry}</p>`)
      .join('');
  }

  if (Array.isArray(topicData?.blocks)) {
    return topicData.blocks
      .map((block) => {
        if (typeof block === 'string') {
          return `<p>${block}</p>`;
        }
        if (isPlainObject(block) && typeof block.html === 'string') {
          return block.html;
        }
        if (isPlainObject(block) && typeof block.text === 'string') {
          return `<p>${block.text}</p>`;
        }
        return '';
      })
      .join('');
  }

  return '';
}

function toArrayFromCollection(source, candidateKeys) {
  if (!source) {
    return [];
  }

  if (Array.isArray(source)) {
    return source;
  }

  if (source instanceof Map) {
    return Array.from(source.values());
  }

  if (!isPlainObject(source)) {
    return [];
  }

  for (const key of candidateKeys) {
    if (Array.isArray(source[key])) {
      return source[key];
    }
    if (isPlainObject(source[key])) {
      const nested = toArrayFromCollection(source[key], candidateKeys);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  if (Array.isArray(source.items)) {
    return source.items;
  }

  if (Array.isArray(source.list)) {
    return source.list;
  }

  if (Array.isArray(source.data)) {
    return source.data;
  }

  if (Array.isArray(source.values)) {
    return source.values;
  }

  const numericKeys = Object.keys(source).filter((key) => /^\d+$/.test(key));
  if (numericKeys.length > 0) {
    return numericKeys
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => source[key])
      .filter((item) => item !== undefined && item !== null);
  }

  return Object.values(source).filter((item) => item !== undefined && item !== null);
}

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
      const sectionName = page.dataset.sectionName || page.dataset.sectionNombre || DEFAULT_SECTION_NAME;
      const topicId = page.dataset.topicId || page.id || generateUniqueId('topic');
      const title = page.dataset.topicTitle
        || page.dataset.topicNombre
        || this.extractHeadingTitle(page)
        || `${DEFAULT_TOPIC_NAME} ${this.pageElements.size + 1}`;
      const theme = normalizeTheme(page.dataset.theme || extractThemeFromClassList(page));

      page.dataset.sectionId = sectionId;
      page.dataset.sectionName = sectionName;
      page.dataset.topicId = topicId;
      page.dataset.topicTitle = title;
      page.dataset.theme = theme;
      page.id = page.id || topicId;
      this.applyThemeToPage(page, theme);

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
      const initialTheme = firstTopic?.theme || firstSection?.theme || DEFAULT_SECTION_THEME;
      this.applyThemeToBody(initialTheme);
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
    if (firstTopic || firstSection) {
      const initialTheme = firstTopic?.theme || firstSection?.theme || DEFAULT_SECTION_THEME;
      this.applyThemeToBody(initialTheme);
    }

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
        sections: filterObjectEntries(payload),
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
      const normalized = filterObjectEntries(toArrayFromCollection(candidate, SECTION_COLLECTION_KEYS));
      if (normalized.length > 0) {
        resolvedSections = normalized;
        break;
      }
    }

    if (resolvedSections.length === 0 && isPlainObject(payload)) {
      resolvedSections = filterObjectEntries(toArrayFromCollection(payload, SECTION_COLLECTION_KEYS));
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
    const rawName = sectionData?.nombre
      ?? sectionData?.name
      ?? sectionData?.title
      ?? sectionData?.titulo
      ?? sectionData?.heading;
    const name = rawName ? String(rawName).trim() : `${DEFAULT_SECTION_NAME} ${index + 1}`;
    const collapsed = typeof sectionData?.collapsed === 'boolean'
      ? sectionData.collapsed
      : !!sectionData?.colapsado;
    const theme = normalizeTheme(sectionData?.theme || sectionData?.tema || sectionData?.colorTema);

    const topicsSource = this.resolveTopicsCollection(sectionData);

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
    const rawTitle = topicData?.titulo
      ?? topicData?.title
      ?? topicData?.nombre
      ?? topicData?.heading
      ?? topicData?.tema
      ?? topicData?.tituloTema;
    const title = rawTitle ? String(rawTitle).trim() : `${DEFAULT_TOPIC_NAME} ${context.index + 1}`;

    const theme = normalizeTheme(topicData?.theme || topicData?.tema || context.sectionTheme);

    const sectionName = topicData?.sectionName
      ? String(topicData.sectionName).trim()
      : context.sectionName;

    const htmlSource = extractTopicHtml(topicData);

    return {
      id,
      title,
      html: htmlSource,
      theme,
      sectionId: context.sectionId,
      sectionName: sectionName
    };
  }

  resolveTopicsCollection(sectionData) {
    if (!sectionData) {
      return [];
    }

    const directCandidates = [
      sectionData.temas,
      sectionData.topics,
      sectionData.temasAgrupados,
      sectionData.temasSeccion,
      sectionData.children,
      sectionData.pages,
      sectionData.paginas,
      sectionData.temas?.items,
      sectionData.topics?.items,
      sectionData.children?.items
    ];

    for (const candidate of directCandidates) {
      const normalized = filterObjectEntries(toArrayFromCollection(candidate, TOPIC_COLLECTION_KEYS));
      if (normalized.length > 0) {
        return normalized;
      }
    }

    const fallback = filterObjectEntries(toArrayFromCollection(sectionData, TOPIC_COLLECTION_KEYS));
    if (fallback.length > 0) {
      return fallback;
    }

    return [];
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
        const pageTheme = normalizeTheme(topic.theme || section.theme || DEFAULT_SECTION_THEME);
        page.dataset.topicId = topic.id;
        page.dataset.topicTitle = topic.title;
        page.dataset.theme = pageTheme;
        page.id = topic.id;
        page.innerHTML = topic.html || '';

        this.applyThemeToPage(page, pageTheme);

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

  applyThemeToBody(theme) {
    if (typeof document === 'undefined' || !document.body) {
      return;
    }
    const normalized = normalizeTheme(theme);
    const classes = Array.from(document.body.classList);
    classes
      .filter((cls) => cls.startsWith('theme-'))
      .forEach((cls) => document.body.classList.remove(cls));
    if (normalized) {
      document.body.classList.add(normalized);
    }
  }

  applyThemeToPage(page, theme) {
    if (!page) {
      return;
    }
    const normalized = normalizeTheme(theme);
    Array.from(page.classList)
      .filter((cls) => cls.startsWith('theme-'))
      .forEach((cls) => page.classList.remove(cls));
    if (normalized) {
      page.classList.add(normalized);
    }
    page.dataset.theme = normalized;
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

    const pageElement = this.pageElements.get(topic.id);
    if (pageElement) {
      this.applyThemeToPage(pageElement, topic.theme || section.theme);
    }

    this.applyThemeToBody(topic.theme || section.theme);

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

  getActiveTopicContext() {
    const currentPage = this.state.get('currentPage');
    const topicId = currentPage?.dataset?.topicId || currentPage?.topicId;
    if (!topicId) {
      return null;
    }

    let targetSection = null;
    let targetTopic = null;
    for (const section of this.sections) {
      const candidate = section.topics.find((item) => item.id === topicId);
      if (candidate) {
        targetSection = section;
        targetTopic = candidate;
        break;
      }
    }

    if (!targetSection || !targetTopic) {
      return null;
    }

    const fallbackElement = typeof document !== 'undefined'
      ? document.getElementById(topicId)
      : null;
    const pageElement = this.pageElements.get(topicId) || fallbackElement || null;

    return {
      section: targetSection,
      topic: targetTopic,
      pageElement
    };
  }

  applyThemeToActiveTopic(theme, { updateSection = false } = {}) {
    const context = this.getActiveTopicContext();
    if (!context) {
      return false;
    }

    const normalized = normalizeTheme(theme);
    context.topic.theme = normalized;

    if (updateSection) {
      context.section.theme = normalized;
    }

    if (context.pageElement) {
      this.applyThemeToPage(context.pageElement, normalized);
    }

    this.applyThemeToBody(normalized);
    this.emitSectionsUpdate();
    return true;
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

  exportActiveTopic() {
    const context = this.getActiveTopicContext();
    if (!context) {
      return null;
    }

    const { section, topic, pageElement } = context;
    const html = pageElement?.innerHTML ?? topic.html ?? '';

    return {
      specialty: this.specialty,
      documentShift: this.state.get('documentShift') ?? 0,
      section: {
        id: section.id,
        name: section.name,
        theme: section.theme
      },
      topic: {
        id: topic.id,
        title: topic.title,
        theme: topic.theme,
        sectionId: topic.sectionId,
        html
      }
    };
  }
}
