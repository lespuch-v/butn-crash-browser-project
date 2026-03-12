import type { ButtonStyle } from '@models/button-style';
import type { Modifier, ModifierContext } from './modifier';

const TNT_PALETTES = [
  {
    fillColor: '#ef4444',
    hoverFillColor: '#f87171',
    borderColor: '#b91c1c',
    shadowColor: 'rgba(239, 68, 68, 0.45)',
    contentColor: '#fff7ed',
  },
  {
    fillColor: '#f97316',
    hoverFillColor: '#fb923c',
    borderColor: '#c2410c',
    shadowColor: 'rgba(249, 115, 22, 0.42)',
    contentColor: '#fff7ed',
  },
  {
    fillColor: '#dc2626',
    hoverFillColor: '#ef4444',
    borderColor: '#7f1d1d',
    shadowColor: 'rgba(220, 38, 38, 0.42)',
    contentColor: '#fef2f2',
  },
];

function pickPalette() {
  return TNT_PALETTES[Math.floor(Math.random() * TNT_PALETTES.length)];
}

function createDynamiteStyle(): ButtonStyle {
  const palette = pickPalette();
  const useEmoji = Math.random() < 0.35;

  return {
    fillColor: palette.fillColor,
    borderColor: palette.borderColor,
    borderWidth: 2,
    borderRadius: 10,
    shadowBlur: 14,
    shadowColor: palette.shadowColor,
    icon: useEmoji ? '🧨' : 'TNT',
    hoverFillColor: palette.hoverFillColor,
    shape: Math.random() < 0.5 ? 'rect' : 'pill',
    width: 54,
    height: 40,
    content: {
      text: useEmoji ? '🧨' : 'TNT',
      fontSize: useEmoji ? 0.48 : 0.32,
      fontFamily: useEmoji ? '"Segoe UI Emoji", "Segoe UI", sans-serif' : '"Segoe UI", sans-serif',
      color: palette.contentColor,
      rotation: 0,
    },
  };
}

function findBlastZoneCells(
  originCol: number,
  originRow: number,
  grid: ModifierContext['grid'],
  targetCount: number,
): { col: number; row: number }[] {
  const candidates = new Map<string, { col: number; row: number; score: number }>();

  for (let radius = 1; radius <= 4; radius++) {
    for (let dc = -radius; dc <= radius; dc++) {
      for (let dr = -radius; dr <= radius; dr++) {
        if (dc === 0 && dr === 0) continue;

        const col = originCol + dc;
        const row = originRow + dr;
        const key = `${col}_${row}`;
        if (candidates.has(key) || !grid.isFree(col, row)) continue;

        const distance = Math.max(Math.abs(dc), Math.abs(dr));
        candidates.set(key, {
          col,
          row,
          score: distance + Math.random() * 0.8,
        });
      }
    }

    if (candidates.size >= targetCount * 2) break;
  }

  return [...candidates.values()]
    .sort((left, right) => left.score - right.score)
    .slice(0, targetCount)
    .map(({ col, row }) => ({ col, row }));
}

export const ExplosionClusterModifier: Modifier = {
  name: 'Blast Zone!',
  icon: '🧨',
  shader: 'energy-core-pulse',
  weight: 1.5,

  execute(ctx: ModifierContext): void {
    const { col, row, grid, spawner, effects } = ctx;
    const targetCount = 5 + Math.floor(Math.random() * 2);
    const cells = findBlastZoneCells(col, row, grid, targetCount);

    let spawned = 0;
    for (const cell of cells) {
      const entity = spawner.spawnButton(cell.col, cell.row, createDynamiteStyle());
      if (!entity) continue;

      if (entity.interactive) {
        entity.interactive.clickable = false;
        entity.interactive.hovered = false;
      }

      entity.explosive = {
        fuseMs: 2400 + Math.random() * 3800,
        elapsedMs: 0,
        blastRadius: Math.random() < 0.2 ? 2 : 1,
        detonated: false,
      };

      spawned++;
    }

    if (spawned === 0) return;

    const center = grid.cellCenter(col, row);
    effects.emit(center.x, center.y, '#ff9f43', 16 + spawned * 3);
  },
};
