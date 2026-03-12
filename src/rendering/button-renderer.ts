import type { GridCellOffset } from '@ecs/components/grid-cell';
import type { Entity } from '@ecs/entity';
import type { ButtonShaderPreset } from '@models/button-shader';
import { getButtonShader } from '@models/button-shader';
import type { ButtonContent, ButtonShape, ButtonStyle } from '@models/button-style';
import { buttonShaderRenderer } from './button-shader-renderer';
import { BUTTON_PADDING } from '../constants';

const TAU = Math.PI * 2;

function shaderAccent(shader: ButtonShaderPreset): string {
  return getButtonShader(shader).accentColor;
}

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
  occupiedCells?: GridCellOffset[],
  cellSize?: number,
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
      const r = Math.min(hw, hh);
      ctx.moveTo(0, -r);
      ctx.lineTo(r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
      ctx.lineTo(-r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6));
      ctx.closePath();
      break;
    }

    case 'heart': {
      const s = Math.min(hw, hh) * 0.9;
      ctx.moveTo(0, s * 0.8);
      ctx.bezierCurveTo(-s * 0.8, s * 0.2, -s, -s * 0.2, -s * 0.8, -s * 0.5);
      ctx.bezierCurveTo(-s * 0.6, -s * 0.8, -s * 0.2, -s * 0.8, 0, -s * 0.5);
      ctx.bezierCurveTo(s * 0.2, -s * 0.8, s * 0.6, -s * 0.8, s * 0.8, -s * 0.5);
      ctx.bezierCurveTo(s, -s * 0.2, s * 0.8, s * 0.2, 0, s * 0.8);
      ctx.closePath();
      break;
    }

    case 'tetromino': {
      if (!occupiedCells?.length || !cellSize) {
        ctx.roundRect(-hw, -hh, w, h, borderRadius);
        break;
      }

      const localCellSize = cellSize - BUTTON_PADDING * 2;
      const originX = -hw;
      const originY = -hh;

      for (const cell of occupiedCells) {
        const x = originX + cell.col * cellSize + BUTTON_PADDING;
        const y = originY + cell.row * cellSize + BUTTON_PADDING;
        ctx.roundRect(x, y, localCellSize, localCellSize, borderRadius);
      }
      break;
    }
  }
}

function drawContent(
  ctx: CanvasRenderingContext2D,
  style: ButtonStyle,
  w: number,
  h: number,
  opacity: number,
  shader?: ButtonShaderPreset,
): void {
  const content: ButtonContent | undefined = style.content;
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

  ctx.globalAlpha = opacity * 0.92;
  if (shader) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = shaderAccent(shader);
  }
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 0, 1);

  ctx.restore();
}

/**
 * Draws a single button entity on the canvas.
 * Supports variable shapes, sizes, content, and optional WebGL shader overlays.
 */
export function renderButton(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  cellSize: number,
): void {
  const { position, renderable, interactive, gridCell } = entity;
  if (!position || !renderable || !renderable.visible) return;

  const { style, scale, opacity, rotation, shader } = renderable;
  const isHovered = interactive?.hovered ?? false;

  const fallbackSize = cellSize - BUTTON_PADDING * 2;
  const w = style.width ?? fallbackSize;
  const h = style.height ?? fallbackSize;
  const shape: ButtonShape = style.shape ?? 'rect';

  const colSpan = gridCell?.colSpan ?? 1;
  const rowSpan = gridCell?.rowSpan ?? 1;
  const centerX = position.x + (colSpan * cellSize) / 2;
  const centerY = position.y + (rowSpan * cellSize) / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.globalAlpha = opacity;

  ctx.shadowBlur = style.shadowBlur + (shader ? 10 : 4);
  ctx.shadowColor = shader ? shaderAccent(shader) : style.shadowColor;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = isHovered ? style.hoverFillColor : style.fillColor;
  buildShapePath(ctx, shape, w, h, style.borderRadius, gridCell?.occupiedCells, cellSize);
  ctx.fill();

  if (shader) {
    ctx.save();
    buildShapePath(ctx, shape, w, h, style.borderRadius, gridCell?.occupiedCells, cellSize);
    ctx.clip();
    buttonShaderRenderer.render(ctx, shader, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = shader ? shaderAccent(shader) : style.borderColor;
  ctx.lineWidth = shader ? style.borderWidth + 0.6 : style.borderWidth;
  ctx.lineJoin = 'round';
  buildShapePath(ctx, shape, w, h, style.borderRadius, gridCell?.occupiedCells, cellSize);
  if (style.borderWidth > 0) {
    ctx.stroke();
  }

  drawContent(ctx, style, w, h, opacity, shader);
  ctx.restore();
}
