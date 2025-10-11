import { describe, expect, it } from 'vitest';
import { createEnhancedNote } from '../../scripts/modules/notes/NoteRegistry.js';

describe('createEnhancedNote', () => {
  it('sanitiza títulos y conserva el texto legible', () => {
    const note = createEnhancedNote({
      titleHtml: '<script>alert(1)</script><font color="red" onclick="evil()">Hola&nbsp;</font>',
      pages: [{
        id: 'custom-page',
        html: '<p>Contenido seguro</p>'
      }]
    });

    expect(note.title).toBe('Hola');
    expect(note.titleHtml).toMatch(/<span[^>]*>Hola<\/span>/);
    expect(note.titleHtml).toMatch(/style="[^"]*color:\s*red/i);
    expect(note.pages).toHaveLength(1);
    expect(note.pages[0].id).toBe('custom-page');
  });

  it('normaliza las páginas y evita identificadores duplicados', () => {
    const note = createEnhancedNote({
      pages: [
        { id: 'duplicado', html: '<p>Uno</p>' },
        { id: 'duplicado', html: '<p>Dos</p>' }
      ],
      currentPageIndex: 1,
      content: 'Texto alterno'
    });

    expect(note.pages).toHaveLength(2);
    expect(note.pages[0].id).toBe('duplicado');
    expect(note.pages[1].id).not.toBe('duplicado');
    expect(note.currentPageIndex).toBe(1);
    expect(note.html).toContain('Dos');
    expect(note.content).toContain('Texto alterno');
  });
});
