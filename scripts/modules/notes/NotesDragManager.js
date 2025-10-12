export class NotesDragManager {
  constructor(notesModule) {
    this.notesModule = notesModule;
    this.activeDrag = null;
  }

  attach() {
    const layer = this.notesModule.container;
    if (!layer) return;

    this.notesModule.addDomListener(layer, 'pointerdown', event => {
      const target = event.target.closest('[data-note-id]');
      if (!target) return;

      event.preventDefault();
      target.setPointerCapture?.(event.pointerId);

      const noteId = target.dataset.noteId;
      const note = this.notesModule.registry.get(noteId);
      if (!note) return;

      const rect = target.getBoundingClientRect();
      const containerRect = layer.getBoundingClientRect();
      this.activeDrag = {
        note,
        element: target,
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        containerRect
      };

      target.classList.add('is-dragging');
    });
  }

  handleMove(event) {
    if (!this.activeDrag || event.pointerId !== this.activeDrag.pointerId) {
      return;
    }

    event.preventDefault();

    const containerRect = this.activeDrag.containerRect || this.notesModule.container.getBoundingClientRect();
    const left = event.clientX - this.activeDrag.offsetX - containerRect.left;
    const top = event.clientY - this.activeDrag.offsetY - containerRect.top;

    this.activeDrag.element.style.left = `${left}px`;
    this.activeDrag.element.style.top = `${top}px`;
  }

  handleEnd(event) {
    if (!this.activeDrag || event.pointerId !== this.activeDrag.pointerId) {
      return;
    }

    const { note, element } = this.activeDrag;
    element.classList.remove('is-dragging');

    const containerRect = this.activeDrag.containerRect || this.notesModule.container.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;

    this.notesModule.update(note.id, {
      left,
      top,
      position: { left, top }
    });

    this.activeDrag = null;
  }
}
