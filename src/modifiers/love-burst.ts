import type { Modifier, ModifierContext } from './modifier';
import type { ButtonStyle } from '@models/button-style';

const LOVE_PALETTES = [
  {
    fillColor: '#ff5c8a',
    hoverFillColor: '#ff7aa2',
    borderColor: '#e63e72',
    shadowColor: 'rgba(255, 92, 138, 0.45)',
    contentColor: '#fff5f8',
  },
  {
    fillColor: '#ff7eb6',
    hoverFillColor: '#ff98c5',
    borderColor: '#eb5f9c',
    shadowColor: 'rgba(255, 126, 182, 0.42)',
    contentColor: '#fff8fb',
  },
  {
    fillColor: '#ff4d6d',
    hoverFillColor: '#ff6b86',
    borderColor: '#dc3c5d',
    shadowColor: 'rgba(255, 77, 109, 0.42)',
    contentColor: '#fff7f8',
  },
  {
    fillColor: '#ff9ec4',
    hoverFillColor: '#ffb1d1',
    borderColor: '#e97ea9',
    shadowColor: 'rgba(255, 158, 196, 0.38)',
    contentColor: '#fff7fb',
  },
];

function pickPalette() {
  return LOVE_PALETTES[Math.floor(Math.random() * LOVE_PALETTES.length)];
}

function createHeartStyle(): ButtonStyle {
  const palette = pickPalette();
  const size = 42 + Math.floor(Math.random() * 12);

  return {
    fillColor: palette.fillColor,
    borderColor: palette.borderColor,
    borderWidth: 2,
    borderRadius: 12,
    shadowBlur: 12,
    shadowColor: palette.shadowColor,
    icon: '♥',
    hoverFillColor: palette.hoverFillColor,
    shape: 'heart',
    width: size,
    height: size,
    content: {
      text: Math.random() < 0.35 ? '♥' : '',
      fontSize: 0.4,
      fontFamily: '"Segoe UI", sans-serif',
      color: palette.contentColor,
      rotation: 0,
    },
  };
}

function heartScore(col: number, row: number, radius: number): number {
  const x = col / radius;
  const y = row / radius;
  return (x * x + y * y - 1) ** 3 - x * x * y * y * y;
}

function findLoveCells(
  originCol: number,
  originRow: number,
  grid: ModifierContext['grid'],
  targetCount: number,
): { col: number; row: number }[] {
  const cells: { col: number; row: number }[] = [];

  for (let radius = 2; cells.length < targetCount && radius <= 7; radius++) {
    for (let row = -radius; row <= radius; row++) {
      for (let col = -radius; col <= radius; col++) {
        const worldCol = originCol + col;
        const worldRow = originRow + row;
        if (!grid.isFree(worldCol, worldRow)) continue;

        if (heartScore(col, -row, radius) > 0.08) continue;
        cells.push({ col: worldCol, row: worldRow });
        if (cells.length >= targetCount) break;
      }
      if (cells.length >= targetCount) break;
    }
  }

  return cells;
}

export const LoveBurstModifier: Modifier = {
  name: 'Love Burst!',
  icon: '💖',
  shader: 'prismatic-hologram',
  weight: 2,

  execute(ctx: ModifierContext): void {
    const { col, row, grid, spawner, effects } = ctx;
    const targetCount = 10 + Math.floor(Math.random() * 9);
    const cells = findLoveCells(col, row, grid, targetCount);

    let spawned = 0;
    for (const cell of cells) {
      const entity = spawner.spawnButton(cell.col, cell.row, createHeartStyle());
      if (!entity) continue;
      spawned++;
    }

    const center = grid.cellCenter(col, row);
    effects.emit(center.x, center.y, '#ff79b0', 18 + spawned * 2);
  },
};
