import type { Direction } from '@models/direction';

export interface SpawnPreview {
  col: number;
  row: number;
  direction: Direction;
}

/**
 * Shared state for spawn preview indicators.
 * Written by InputSystem (on hover), read by Renderer (to draw "+" indicators).
 */
export class SpawnPreviewState {
  public previews: SpawnPreview[] = [];
  public sourceEntityId: number | null = null;
  public hoveredIndex: number | null = null;

  update(previews: SpawnPreview[], sourceEntityId: number): void {
    this.previews = previews;
    this.sourceEntityId = sourceEntityId;
    this.hoveredIndex = null;
  }

  clear(): void {
    this.previews = [];
    this.sourceEntityId = null;
    this.hoveredIndex = null;
  }

  getAt(col: number, row: number): { preview: SpawnPreview; index: number } | null {
    for (let i = 0; i < this.previews.length; i++) {
      const p = this.previews[i];
      if (p.col === col && p.row === row) {
        return { preview: p, index: i };
      }
    }
    return null;
  }

  get active(): boolean {
    return this.previews.length > 0;
  }
}
