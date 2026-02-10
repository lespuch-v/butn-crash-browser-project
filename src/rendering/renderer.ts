import type { CanvasManager } from '@core/canvas-manager';
import type { EntityManager } from '@ecs/entity-manager';
import type { Grid } from '@grid/grid';
import { renderGrid } from './grid-renderer';
import { renderButton } from './button-renderer';
import { EffectsRenderer } from './effects-renderer';

/**
 * Main renderer — orchestrates grid, buttons, effects in correct order.
 */
export class Renderer {
  public effects: EffectsRenderer;

  constructor(
    private canvas: CanvasManager,
    private entities: EntityManager,
    private grid: Grid,
  ) {
    this.effects = new EffectsRenderer();
  }

  /** Called once per frame */
  render(_alpha: number): void {
    const { ctx } = this.canvas;

    // 1. Clear & background
    this.canvas.fill('#0a0a0f');

    // 2. Grid lines
    renderGrid(this.canvas, this.grid.cellSize);

    // 3. All button entities
    const buttons = this.entities.query('position', 'renderable');
    for (const entity of buttons) {
      renderButton(ctx, entity, this.grid.cellSize);
    }

    // 4. Particle effects on top
    this.effects.render(ctx);
  }

  /** Update effects (particles, etc.) */
  updateEffects(dt: number): void {
    this.effects.update(dt);
  }
}
