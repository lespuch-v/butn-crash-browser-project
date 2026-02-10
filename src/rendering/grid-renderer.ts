import type { CanvasManager } from '@core/canvas-manager';
import { GRID_LINE_WIDTH } from '../constants';

const GRID_LINE_COLOR = 'rgba(100, 120, 180, 0.035)';
const GRID_DOT_COLOR = 'rgba(140, 160, 220, 0.12)';
const GRID_DOT_RADIUS = 1.2;

/**
 * Draws the background grid with subtle lines and dots at intersections.
 */
export function renderGrid(canvas: CanvasManager, cellSize: number): void {
  const { ctx, width, height } = canvas;
  const worldStartX = Math.floor(canvas.cameraX / cellSize) * cellSize;
  const worldEndX = canvas.cameraX + width;
  const worldStartY = Math.floor(canvas.cameraY / cellSize) * cellSize;
  const worldEndY = canvas.cameraY + height;

  // Draw subtle grid lines
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

  // Draw dots at intersections for visual polish
  ctx.fillStyle = GRID_DOT_COLOR;
  for (let x = worldStartX; x <= worldEndX; x += cellSize) {
    for (let y = worldStartY; y <= worldEndY; y += cellSize) {
      ctx.beginPath();
      ctx.arc(x, y, GRID_DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
