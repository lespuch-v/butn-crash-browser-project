/** Velocity for entities in motion (dash, explosion knockback, etc.) */
export interface VelocityComponent {
  vx: number; // pixels per tick
  vy: number;
  friction: number; // multiplier per tick (0.95 = slow down, 1 = no friction)
}
