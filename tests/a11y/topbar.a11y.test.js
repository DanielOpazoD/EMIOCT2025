import * as axeCore from 'axe-core';
import { describe, expect, it } from 'vitest';

const axe = axeCore.default ?? axeCore;

describe('topbar accesible', () => {
  it('no presenta violaciones críticas de accesibilidad', async () => {
    document.body.innerHTML = `
      <nav class="topbar" aria-label="Barra de herramientas principal">
        <div class="topbar-left">
          <button type="button" id="menuBtn" aria-label="Abrir panel de navegación">☰</button>
        </div>
        <div class="topbar-center">
          <span id="specialtyTitle" role="heading" aria-level="1">Endocrinología</span>
          <div class="zoom-controls" role="group" aria-label="Controles de zoom">
            <button type="button" aria-label="Reducir zoom">-</button>
            <output id="zoomValue" aria-live="polite">100%</output>
            <button type="button" aria-label="Aumentar zoom">+</button>
          </div>
        </div>
        <div class="topbar-right">
          <button
            class="topbar-btn"
            type="button"
            id="topbarThemeToggle"
            aria-haspopup="true"
            aria-expanded="false"
            aria-controls="topbarThemeDropdown"
            aria-label="Cambiar estilo de la barra"
          >🎨</button>
        </div>
        <div id="topbarThemeDropdown" role="menu">
          <button role="menuitem" type="button">Clásico</button>
          <button role="menuitem" type="button">Verde</button>
        </div>
      </nav>
    `;

    const results = await axe.run(document.body, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });

    expect(results.violations).toHaveLength(0);
  });
});
