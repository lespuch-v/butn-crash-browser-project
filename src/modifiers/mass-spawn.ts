import type { Modifier, ModifierContext } from './modifier';
import { ALL_DIRECTIONS, DIRECTION_VECTORS } from '@models/direction';

/**
 * 💥 MASS SPAWN — Spawns a burst of buttons in all directions!
 */
export const MassSpawnModifier: Modifier = {
  name: 'Mass Spawn!',
  icon: '💥',
  weight: 3,

  execute(ctx: ModifierContext): void {
    const { col, row, spawner, grid, effects } = ctx;
    const count = 8 + Math.floor(Math.random() * 12); // 8-20 buttons

    const cellsToSpawn: { col: number; row: number }[] = [];

    // Spiral outward from clicked position
    for (let ring = 1; cellsToSpawn.length < count && ring <= 20; ring++) {
      for (const dir of ALL_DIRECTIONS) {
        const vec = DIRECTION_VECTORS[dir];
        // Walk along each direction for this ring distance
        for (let step = -ring; step <= ring; step++) {
          const newCol = col + vec.x * ring + (vec.x === 0 ? step : 0);
          const newRow = row + vec.y * ring + (vec.y === 0 ? step : 0);

          if (grid.isFree(newCol, newRow)) {
            cellsToSpawn.push({ col: newCol, row: newRow });
            if (cellsToSpawn.length >= count) break;
          }
        }
        if (cellsToSpawn.length >= count) break;
      }
    }

    // Spawn them all
    spawner.spawnMultiple(cellsToSpawn);

    // Big particle burst from center
    const center = grid.cellCenter(col, row);
    effects.emit(center.x, center.y, '#ffd700', 30);
  },
};
