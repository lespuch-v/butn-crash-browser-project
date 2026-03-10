export interface GridCellOffset {
  col: number;
  row: number;
}

/** Logical grid position and span */
export interface GridCellComponent {
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  occupiedCells?: GridCellOffset[];
}
