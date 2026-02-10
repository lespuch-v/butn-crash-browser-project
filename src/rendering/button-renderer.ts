import type { Entity } from '@ecs/entity';
import type { ButtonStyle, ButtonShape, ButtonContent } from '@models/button-style';
import { BUTTON_PADDING } from '../constants';

const TAU = Math.PI * 2;

/**
 * Builds a canvas path for the given shape, centered at (0, 0).
 * Caller is responsible for beginPath(), fill(), and stroke().
 */
function buildShapePath(
  ctx: CanvasRenderingContext2D,
  shape: ButtonShape,
  w: number,
  h: number,
  borderRadius: number,
): void {
  const hw = w / 2;
  const hh = h / 2;

  ctx.beginPath();

  switch (shape) {
    case 'rect':
      ctx.roundRect(-hw, -hh, w, h, borderRadius);
      break;

    case 'circle':
      ctx.arc(0, 0, Math.min(hw, hh), 0, TAU);
      break;

    case 'pill':
      ctx.roundRect(-hw, -hh, w, h, Math.min(hw, hh));
      break;

    case 'diamond':
      ctx.moveTo(0, -hh);
      ctx.lineTo(hw, 0);
      ctx.lineTo(0, hh);
      ctx.lineTo(-hw, 0);
      ctx.closePath();
      break;

    case 'hexagon': {
      const r = Math.min(hw, hh);
      for (let i = 0; i < 6; i++) {
        const angle = (TAU / 6) * i - Math.PI / 2;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }

    case 'star': {
      const outerR = Math.min(hw, hh);
      const innerR = outerR * 0.4;
      for (let i = 0; i < 10; i++) {
        const angle = (TAU / 10) * i - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }

    case 'cross': {
      // Plus shape: the arm thickness is 1/3 of the dimension
      const ax = hw;
      const ay = hh;
      const tx = hw * 0.35;
      const ty = hh * 0.35;
      ctx.moveTo(-tx, -ay);
      ctx.lineTo(tx, -ay);
      ctx.lineTo(tx, -ty);
      ctx.lineTo(ax, -ty);
      ctx.lineTo(ax, ty);
      ctx.lineTo(tx, ty);
      ctx.lineTo(tx, ay);
      ctx.lineTo(-tx, ay);
      ctx.lineTo(-tx, ty);
      ctx.lineTo(-ax, ty);
      ctx.lineTo(-ax, -ty);
      ctx.lineTo(-tx, -ty);
      ctx.closePath();
      break;
    }

    case 'triangle': {
      // Equilateral-ish triangle pointing up
      const r = Math.min(hw, hh);
      ctx.moveTo(0, -r);
      ctx.lineTo(r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
      ctx.lineTo(-r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
      ctx.closePath();
      break;
    }
  }
}

/**
 * Draws the content (text/emoji/symbol) on top of a button.
 */
function drawContent(
  ctx: CanvasRenderingContext2D,
  style: ButtonStyle,
  w: number,
  h: number,
  opacity: number,
): void {
  const content: ButtonContent | undefined = style.content;

  // Legacy fallback: use icon field if no content object
  const text = content?.text ?? style.icon;
  if (!text) return;

  const minDim = Math.min(w, h);
  const fontSize = content ? minDim * content.fontSize : minDim * 0.45;
  const fontFamily = content?.fontFamily ?? 'sans-serif';
  const color = content?.color ?? '#ffffff';
  const contentRotation = content?.rotation ?? 0;

  ctx.save();

  if (contentRotation !== 0) {
    ctx.rotate(contentRotation);
  }

  ctx.globalAlpha = opacity * 0.9;
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 1);

  ctx.restore();
}

/**
 * Draws a single button entity on the canvas.
 * Supports variable shapes, sizes, and content.
 */
export function renderButton(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  cellSize: number,
): void {
  const { position, renderable, interactive, gridCell } = entity;
  if (!position || !renderable || !renderable.visible) return;

  const { style, scale, opacity, rotation } = renderable;
  const isHovered = interactive?.hovered ?? false;

  // Use per-button dimensions, falling back to legacy grid-sized square
  const fallbackSize = cellSize - BUTTON_PADDING * 2;
  const w = style.width ?? fallbackSize;
  const h = style.height ?? fallbackSize;
  const shape: ButtonShape = style.shape ?? 'rect';

  // Center within the entity's span area (multi-cell support)
  const colSpan = gridCell?.colSpan ?? 1;
  const rowSpan = gridCell?.rowSpan ?? 1;
  const centerX = position.x + (colSpan * cellSize) / 2;
  const centerY = position.y + (rowSpan * cellSize) / 2;

  ctx.save();

  // Transform from center
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity;

  // Shadow with depth
  ctx.shadowBlur = style.shadowBlur + 4;
  ctx.shadowColor = style.shadowColor;
  ctx.shadowOffsetY = 2;

  // Fill
  ctx.fillStyle = isHovered ? style.hoverFillColor : style.fillColor;
  buildShapePath(ctx, shape, w, h, style.borderRadius);
  ctx.fill();

  // Border
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = style.borderColor;
  ctx.lineWidth = style.borderWidth;
  ctx.lineJoin = 'round';
  if (style.borderWidth > 0) {
    ctx.stroke();
  }

  // Content
  drawContent(ctx, style, w, h, opacity);

  ctx.restore();
}
