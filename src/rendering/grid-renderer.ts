import type { CanvasManager } from '@core/canvas-manager';
import { GRID_LINE_COLOR, GRID_LINE_WIDTH } from '../constants';

/**
 * Draws the background grid lines.
 */
export function renderGrid(canvas: CanvasManager, cellSize: number): void {
  const { ctx, width, height } = canvas;
  const worldStartX = Math.floor(canvas.cameraX / cellSize) * cellSize;
  const worldEndX = canvas.cameraX + width;
  const worldStartY = Math.floor(canvas.cameraY / cellSize) * cellSize;
  const worldEndY = canvas.cameraY + height;

  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.lineWidth = GRID_LINE_WIDTH;

  // Vertical lines
  for (let x = worldStartX; x <= worldEndX; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, worldStartY);
    ctx.lineTo(x, worldEndY);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = worldStartY; y <= worldEndY; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(worldStartX, y);
    ctx.lineTo(worldEndX, y);
    ctx.stroke();
  }
}
