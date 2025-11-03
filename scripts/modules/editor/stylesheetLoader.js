export function createStylesheetLoader() {
  let cachedStylesheetForExport = null;

  async function getStylesheetTextForExport() {
    if (cachedStylesheetForExport !== null) {
      return cachedStylesheetForExport;
    }

    const linkEl = document.querySelector('link[rel="stylesheet"][href]');
    if (!linkEl) {
      cachedStylesheetForExport = '';
      return cachedStylesheetForExport;
    }

    const href = linkEl.href || linkEl.getAttribute('href');

    try {
      const response = await fetch(href);
      if (!response.ok) {
        throw new Error(`No se pudo cargar estilos: ${response.status}`);
      }
      cachedStylesheetForExport = await response.text();
      return cachedStylesheetForExport;
    } catch (error) {
      console.error('Error cargando estilos para exportación:', error);
      try {
        const targetSheet = Array.from(document.styleSheets || []).find((sheet) => sheet.ownerNode === linkEl);
        if (targetSheet?.cssRules) {
          cachedStylesheetForExport = Array.from(targetSheet.cssRules).map((rule) => rule.cssText).join('\n');
          return cachedStylesheetForExport;
        }
      } catch (cssError) {
        console.warn('No se pudo leer reglas CSS para exportación:', cssError);
      }
      cachedStylesheetForExport = '';
      return cachedStylesheetForExport;
    }
  }

  function resetStylesheetCache() {
    cachedStylesheetForExport = null;
  }

  return {
    getStylesheetTextForExport,
    resetStylesheetCache
  };
}
