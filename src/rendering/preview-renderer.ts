import type { SpawnPreviewState } from '@systems/spawn-preview';
import type { Grid } from '@grid/grid';
import { BUTTON_PADDING } from '../constants';

/**
 * Draws "+" spawn preview indicators in free adjacent cells.
 */
export function renderPreviews(
  ctx: CanvasRenderingContext2D,
  previewState: SpawnPreviewState,
  grid: Grid,
): void {
  if (!previewState.active) return;

  const cellSize = grid.cellSize;
  const inset = BUTTON_PADDING * 2.5;
  const size = cellSize - inset * 2;
  const radius = 8;

  for (let i = 0; i < previewState.previews.length; i++) {
    const preview = previewState.previews[i];
    const isHovered = previewState.hoveredIndex === i;
    const pixel = grid.cellToPixel(preview.col, preview.row);
    const centerX = pixel.x + cellSize / 2;
    const centerY = pixel.y + cellSize / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    const halfSize = size / 2;
    const x = -halfSize;
    const y = -halfSize;

    // Background fill
    ctx.globalAlpha = isHovered ? 0.18 : 0.06;
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.fill();

    // Dashed border
    ctx.globalAlpha = isHovered ? 0.5 : 0.2;
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // "+" symbol
    ctx.globalAlpha = isHovered ? 0.9 : 0.4;
    ctx.fillStyle = '#bae6fd';
    ctx.font = `${size * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', 0, 1);

    ctx.restore();
  }
}
