export class NotesDragManager {
  constructor(notesModule) {
    this.notesModule = notesModule;
    this.dragState = null;

    this.handleMove = this.handleMove.bind(this);
    this.handleEnd = this.handleEnd.bind(this);
    this.notesModule.addDomListener(document, 'pointermove', this.handleMove);
    this.notesModule.addDomListener(document, 'pointerup', this.handleEnd);
    this.notesModule.addDomListener(document, 'pointercancel', this.handleEnd);
  }

  startDrag(noteComponent, event) {
    if (!noteComponent || !event) return;

    const rect = noteComponent.element.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    this.dragState = {
      noteComponent,
      pointerId: event.pointerId,
      offsetX,
      offsetY
    };

    if (typeof noteComponent.element.setPointerCapture === 'function') {
      try {
        noteComponent.element.setPointerCapture(event.pointerId);
      } catch (error) {
        // Ignore capture errors
      }
    }
  }

  handleMove(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) {
      return;
    }

    event.preventDefault();
    const { noteComponent, offsetX, offsetY } = this.dragState;
    const containerRect = this.notesModule.container.getBoundingClientRect();

    const left = event.clientX - containerRect.left - offsetX;
    const top = event.clientY - containerRect.top - offsetY;
    noteComponent.setPosition(Math.round(left), Math.round(top));
  }

  handleEnd(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) {
      return;
    }

    const { noteComponent } = this.dragState;
    if (typeof noteComponent.element.releasePointerCapture === 'function') {
      try {
        noteComponent.element.releasePointerCapture(event.pointerId);
      } catch (error) {
        // ignore
      }
    }

    this.dragState = null;
  }

  destroy() {
    this.dragState = null;
  }
}
