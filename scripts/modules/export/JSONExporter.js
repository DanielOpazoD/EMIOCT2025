import { getDownloadLink } from './exportUtils.js';

export class JSONExporter {
  constructor({ textEditor }) {
    this.textEditor = textEditor;
  }

  export() {
    const data = {
      createdAt: new Date().toISOString(),
      pages: this.textEditor.getExportData()
    };
    const link = getDownloadLink(JSON.stringify(data, null, 2), 'application/json');
    link.download = 'documento.json';
    link.click();
    link.remove();
  }
}
