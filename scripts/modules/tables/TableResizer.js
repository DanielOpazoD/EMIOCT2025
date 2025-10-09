export class TableResizer {
  constructor() {
    this.activeTable = null;
  }

  attach(table) {
    if (!(table instanceof HTMLTableElement)) return;
    table.classList.add('table-resizable');
  }
}
