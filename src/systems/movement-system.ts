import type { EntityManager } from '@ecs/entity-manager';

/**
 * Applies velocity to position for moving entities.
 * Handles friction/damping.
 */
export class MovementSystem {
  constructor(private entities: EntityManager) {}

  update(_dt: number): void {
    const moving = this.entities.query('position', 'velocity');

    for (const entity of moving) {
      const pos = entity.position!;
      const vel = entity.velocity!;

      // Apply velocity
      pos.x += vel.vx;
      pos.y += vel.vy;

      // Apply friction
      vel.vx *= vel.friction;
      vel.vy *= vel.friction;

      // Stop if velocity is negligible
      if (Math.abs(vel.vx) < 0.01 && Math.abs(vel.vy) < 0.01) {
        entity.velocity = undefined;
      }
    }
  }
}
