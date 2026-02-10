import type { CanvasManager } from '@core/canvas-manager';
import { GRID_LINE_COLOR, GRID_LINE_WIDTH } from '../constants';

/**
 * Draws the background grid lines.
 */
export function renderGrid(canvas: CanvasManager, cellSize: number): void {
  const { ctx, width, height } = canvas;

  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = GRID_LINE_WIDTH;

  // Vertical lines
  for (let x = 0; x <= width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}
