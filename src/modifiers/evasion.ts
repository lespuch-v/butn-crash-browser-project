import type { Modifier, ModifierContext } from './modifier';

const EVASION_DURATION_MS = 3000;
const EVASION_RADIUS = 4;

export const EvasionModifier: Modifier = {
  name: 'Scatter Run!',
  icon: '🏃',
  shader: 'liquid-chrome',
  weight: 1.5,

  execute(ctx: ModifierContext): void {
    const { bus, grid, col, row, effects } = ctx;
    bus.emit('modifier:evasion:start', {
      durationMs: EVASION_DURATION_MS,
      radius: EVASION_RADIUS,
    });

    const center = grid.cellCenter(col, row);
    effects.emit(center.x, center.y, '#c4b5fd', 24);
  },
};
