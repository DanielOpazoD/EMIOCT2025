export class TableMenu {
  constructor({ textEditor }) {
    this.textEditor = textEditor;
  }

  open() {
    const rows = Number.parseInt(window.prompt('Número de filas', '2'), 10);
    const cols = Number.parseInt(window.prompt('Número de columnas', '2'), 10);
    if (Number.isNaN(rows) || Number.isNaN(cols)) {
      return;
    }
    this.textEditor.insertTable({ rows, cols });
  }
}
