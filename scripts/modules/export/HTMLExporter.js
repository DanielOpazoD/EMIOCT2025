import { getDownloadLink } from './exportUtils.js';

export class HTMLExporter {
  constructor({ textEditor, stylesheetHref }) {
    this.textEditor = textEditor;
    this.stylesheetHref = stylesheetHref || 'styles/main.css';
  }

  export() {
    const pages = this.textEditor.getExportData();
    const html = this.#buildDocument(pages);
    const link = getDownloadLink(html, 'text/html');
    link.download = 'documento.html';
    link.click();
    link.remove();
  }

  #buildDocument(pages) {
    const topicsHtml = pages.map((page) => `
      <article class="page ${page.theme}">
        <header><h1><span class="topic-title-text">${page.title}</span></h1></header>
        <div class="page-body">${page.html}</div>
      </article>
    `).join('\n');
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Exportación</title>
<link rel="stylesheet" href="${this.stylesheetHref}">
</head>
<body>
${topicsHtml}
</body>
</html>`;
  }
}
