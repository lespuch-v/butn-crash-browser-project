import type { Modifier, ModifierContext } from './modifier';

export const EvasionModifier: Modifier = {
  name: 'Scatter Run!',
  icon: '🏃',
  shader: 'liquid-chrome',
  weight: 1.5,

  execute(ctx: ModifierContext): void {
    const { bus, grid, col, row, effects } = ctx;
    bus.emit('modifier:evasion:start', {
      durationMs: 10000 + Math.floor(Math.random() * 10001),
      radius: 4,
    });

    const center = grid.cellCenter(col, row);
    effects.emit(center.x, center.y, '#c4b5fd', 24);
  },
};
