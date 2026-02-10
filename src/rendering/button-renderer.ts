import type { Entity } from '@ecs/entity';
import { BUTTON_PADDING } from '../constants';

/**
 * Draws a single button entity on the canvas.
 * Respects renderable component (scale, opacity, rotation).
 */
export function renderButton(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  cellSize: number,
): void {
  const { position, renderable, interactive } = entity;
  if (!position || !renderable || !renderable.visible) return;

  const { style, scale, opacity, rotation } = renderable;
  const isHovered = interactive?.hovered ?? false;

  const padding = BUTTON_PADDING;
  const size = cellSize - padding * 2;
  const centerX = position.x + cellSize / 2;
  const centerY = position.y + cellSize / 2;

  ctx.save();

  // Transform from center
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity;

  const halfSize = size / 2;
  const x = -halfSize;
  const y = -halfSize;

  // Shadow
  ctx.shadowBlur = style.shadowBlur;
  ctx.shadowColor = style.shadowColor;

  // Fill
  ctx.fillStyle = isHovered ? style.hoverFillColor : style.fillColor;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, style.borderRadius);
  ctx.fill();

  // Border
  ctx.shadowBlur = 0;
  ctx.strokeStyle = style.borderColor;
  ctx.lineWidth = style.borderWidth;
  ctx.stroke();

  // Icon (emoji)
  if (style.icon) {
    ctx.globalAlpha = opacity * 0.9;
    ctx.font = `${size * 0.45}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(style.icon, 0, 1); // slight y offset for visual centering
  }

  ctx.restore();
}
