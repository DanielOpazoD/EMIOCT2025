export class PanelController {
  constructor(uiModule) {
    this.uiModule = uiModule;
    this.editor = uiModule.editor;
    this.state = this.editor.state;

    this.topbarElement = document.querySelector('[data-topbar]');
    this.panelElement = document.getElementById('topic-panel');
    this.backdropElement = document.getElementById('panel-backdrop');

    this.menuButton = this.topbarElement?.querySelector('.topbar-plus') ?? null;
    this.sectionsModule = this.editor.modules?.sections ?? null;
    this.sectionsContainer = document.getElementById('sectionsContainer');
    this.toggleAllButton = document.getElementById('toggleAllBtn');
    this.sectionsUnsubscribe = null;
  }

  initialize() {
    if (!this.panelElement) {
      return;
    }

    if (this.menuButton) {
      this.menuButton.setAttribute('aria-expanded', 'false');
      this.menuButton.setAttribute('aria-controls', this.panelElement.id);
      this.menuButton.setAttribute('aria-haspopup', 'true');

      this.uiModule.addDomListener(this.menuButton, 'click', () => {
        this.toggle();
      });
    }

    const closeButtons = Array.from(this.panelElement.querySelectorAll('.panel-close'));
    closeButtons.forEach((button) => {
      this.uiModule.addDomListener(button, 'click', () => this.toggle(false));
    });

    if (this.backdropElement) {
      this.uiModule.addDomListener(this.backdropElement, 'click', () => this.toggle(false));
    }

    if (this.sectionsContainer) {
      this.uiModule.addDomListener(this.sectionsContainer, 'click', (event) => this.handleSectionsClick(event));
      this.uiModule.addDomListener(this.sectionsContainer, 'keydown', (event) => this.handleSectionsKeydown(event));
    }

    if (this.toggleAllButton) {
      this.uiModule.addDomListener(this.toggleAllButton, 'click', () => this.handleToggleAll());
    }

    if (this.sectionsModule?.on) {
      this.sectionsUnsubscribe = this.sectionsModule.on('sections:updated', (snapshot) => {
        this.renderSections(snapshot);
      });
      if (this.sectionsUnsubscribe) {
        this.uiModule.subscriptions.add(this.sectionsUnsubscribe);
      }
      const initialSnapshot = this.sectionsModule.getSnapshot?.();
      if (initialSnapshot) {
        this.renderSections(initialSnapshot);
      }
    }

    this.uiModule.subscribeToState('ui.panelOpen', ({ value }) => {
      this.reflectPanelState(value);
    });

    this.reflectPanelState(!!this.state.get('ui.panelOpen'));
  }

  close() {
    this.toggle(false);
  }

  toggle(forceValue) {
    const current = !!this.state.get('ui.panelOpen');
    const next = typeof forceValue === 'boolean' ? forceValue : !current;
    if (next !== current) {
      this.state.set('ui.panelOpen', next);
    } else {
      // Even if state is unchanged we ensure UI reflects the desired value
      this.reflectPanelState(next);
    }
  }

  reflectPanelState(isOpen) {
    const active = !!isOpen;

    if (this.panelElement) {
      this.panelElement.classList.toggle('open', active);
      this.panelElement.setAttribute('aria-hidden', active ? 'false' : 'true');
    }

    if (this.backdropElement) {
      this.backdropElement.classList.toggle('show', active);
    }

    if (this.menuButton) {
      this.menuButton.classList.toggle('active', active);
      this.menuButton.setAttribute('aria-expanded', active ? 'true' : 'false');
    }

    if (this.topbarElement) {
      this.topbarElement.classList.toggle('topbar--panel-open', active);
    }

    if (document.body) {
      document.body.classList.toggle('panel-open', active);
    }
  }

  renderSections(snapshot) {
    if (!this.sectionsContainer) {
      return;
    }

    const sections = snapshot?.sections || [];
    const activeSectionId = snapshot?.activeSectionId || null;
    const activeTopicId = snapshot?.activeTopicId || null;

    this.sectionsContainer.innerHTML = '';

    if (sections.length === 0) {
      this.sectionsContainer.appendChild(this.createEmptyState());
      return;
    }

    const fragment = document.createDocumentFragment();

    sections.forEach((section) => {
      const item = document.createElement('div');
      item.className = 'section-item';
      item.dataset.sectionId = section.id;
      if (section.collapsed) {
        item.classList.add('collapsed');
      }
      if (section.id === activeSectionId) {
        item.classList.add('active');
      }

      const header = document.createElement('div');
      header.className = 'section-header';

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'section-toggle';
      toggle.dataset.action = 'toggle-section';
      toggle.dataset.sectionId = section.id;
      toggle.setAttribute('aria-expanded', section.collapsed ? 'false' : 'true');
      toggle.setAttribute('aria-label', section.collapsed ? 'Expandir sección' : 'Colapsar sección');
      toggle.textContent = '▾';

      const nameButton = document.createElement('button');
      nameButton.type = 'button';
      nameButton.className = 'section-name';
      nameButton.dataset.action = 'select-section';
      nameButton.dataset.sectionId = section.id;
      nameButton.textContent = section.name;
      nameButton.title = section.name;

      const count = document.createElement('span');
      count.className = 'section-count';
      const topicsLength = section.topics.length;
      count.textContent = `${topicsLength} ${topicsLength === 1 ? 'tema' : 'temas'}`;

      header.appendChild(toggle);
      header.appendChild(nameButton);
      header.appendChild(count);

      const list = document.createElement('ul');
      list.className = 'topic-list';

      section.topics.forEach((topic) => {
        const itemElement = document.createElement('li');
        itemElement.dataset.sectionId = section.id;
        itemElement.dataset.topicId = topic.id;
        itemElement.dataset.action = 'select-topic';

        if (topic.id === activeTopicId) {
          itemElement.classList.add('active');
        }

        const number = document.createElement('span');
        number.className = 'topic-number';
        number.textContent = `${topic.index + 1}.`;

        const title = document.createElement('span');
        title.className = 'topic-title';
        title.textContent = topic.title;
        title.title = topic.title;
        title.setAttribute('role', 'button');
        title.setAttribute('tabindex', '0');

        itemElement.appendChild(number);
        itemElement.appendChild(title);
        list.appendChild(itemElement);
      });

      item.appendChild(header);
      item.appendChild(list);
      fragment.appendChild(item);
    });

    this.sectionsContainer.appendChild(fragment);
  }

  createEmptyState() {
    const wrapper = document.createElement('div');
    wrapper.className = 'panel-empty';

    const icon = document.createElement('div');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '📂';

    const message = document.createElement('p');
    message.innerHTML = '<strong>No hay secciones disponibles</strong><br>Importa un archivo JSON compatible para ver el índice.';

    wrapper.appendChild(icon);
    wrapper.appendChild(message);
    return wrapper;
  }

  handleSectionsClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target || !this.sectionsContainer?.contains(target)) {
      return;
    }

    event.preventDefault();
    this.performSectionsAction(target);
  }

  handleSectionsKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
      return;
    }

    const target = event.target.closest('[data-action]');
    if (!target || !this.sectionsContainer?.contains(target)) {
      return;
    }

    event.preventDefault();
    this.performSectionsAction(target);
  }

  performSectionsAction(element) {
    const action = element.dataset.action;
    switch (action) {
      case 'toggle-section': {
        const sectionId = element.dataset.sectionId;
        if (sectionId) {
          this.sectionsModule?.toggleSection(sectionId);
        }
        break;
      }
      case 'select-section': {
        const sectionId = element.dataset.sectionId;
        if (!sectionId) {
          break;
        }
        const snapshot = this.sectionsModule?.getSnapshot?.();
        const targetSection = snapshot?.sections.find((section) => section.id === sectionId);
        if (targetSection?.topics?.length) {
          const firstTopic = targetSection.topics[0];
          this.sectionsModule?.toggleSection(sectionId, true);
          this.sectionsModule?.setActiveTopic(sectionId, firstTopic.id);
          this.closeIfNarrow();
        } else {
          this.sectionsModule?.toggleSection(sectionId);
        }
        break;
      }
      case 'select-topic': {
        const sectionId = element.dataset.sectionId;
        const topicId = element.dataset.topicId;
        if (sectionId && topicId) {
          this.sectionsModule?.setActiveTopic(sectionId, topicId);
          this.closeIfNarrow();
        }
        break;
      }
      default:
        break;
    }
  }

  handleToggleAll() {
    this.sectionsModule?.toggleAllSections();
  }

  closeIfNarrow() {
    if (window.matchMedia && window.matchMedia('(max-width: 960px)').matches) {
      this.toggle(false);
    }
  }
}
