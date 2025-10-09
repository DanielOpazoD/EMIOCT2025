import { getDownloadLink } from './exportUtils.js';

function stripHtml(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

export class MarkdownExporter {
  constructor({ textEditor }) {
    this.textEditor = textEditor;
  }

  export() {
    const pages = this.textEditor.getExportData();
    const content = pages.map((page) => {
      const body = stripHtml(page.html).replace(/\n{3,}/g, '\n\n');
      return `# ${page.title}\n\n${body}`;
    }).join('\n\n---\n\n');
    const link = getDownloadLink(content, 'text/markdown');
    link.download = 'documento.md';
    link.click();
    link.remove();
  }
}
