import { clamp } from '../../utils/dom.js';

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;
const STEP = 0.1;

export class ZoomController {
  constructor({ valueLabel, zoomInButton, zoomOutButton, target }) {
    this.label = valueLabel;
    this.zoomInButton = zoomInButton;
    this.zoomOutButton = zoomOutButton;
    this.target = target || document.body;
    this.value = 1;
  }

  init() {
    if (!this.label) return;
    this.updateLabel();
    if (this.zoomInButton) {
      this.zoomInButton.addEventListener('click', () => this.setZoom(this.value + STEP));
    }
    if (this.zoomOutButton) {
      this.zoomOutButton.addEventListener('click', () => this.setZoom(this.value - STEP));
    }
  }

  setZoom(value) {
    this.value = clamp(Number(value), MIN_ZOOM, MAX_ZOOM);
    this.target.style.setProperty('--zoom-scale', this.value);
    this.target.style.transformOrigin = 'top center';
    this.target.style.transform = `scale(${this.value})`;
    this.updateLabel();
  }

  updateLabel() {
    if (this.label) {
      this.label.textContent = `${Math.round(this.value * 100)}%`;
    }
  }
}
