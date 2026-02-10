import type { EntityManager } from '@ecs/entity-manager';
import { AnimationType } from '@ecs/components/animation';
import { easeOutBack, easeOutCubic } from '@utils/math';

/**
 * Processes animations on entities.
 * Updates progress, applies easing, removes completed animations.
 */
export class AnimationSystem {
  constructor(private entities: EntityManager) {}

  update(dt: number): void {
    const animated = this.entities.query('animation', 'renderable');

    for (const entity of animated) {
      const anim = entity.animation!;
      const renderable = entity.renderable!;

      // Advance time
      anim.elapsed += dt;
      anim.progress = Math.min(anim.elapsed / anim.duration, 1);

      // Apply animation based on type
      switch (anim.type) {
        case AnimationType.SpawnPop: {
          // Scale from 0 to 1 with overshoot
          renderable.scale = easeOutBack(anim.progress);
          break;
        }
        case AnimationType.ClickShrink: {
          // Quick shrink and bounce back
          const t = anim.progress;
          if (t < 0.4) {
            renderable.scale = 1 - 0.15 * (t / 0.4);
          } else {
            renderable.scale = 0.85 + 0.15 * easeOutCubic((t - 0.4) / 0.6);
          }
          break;
        }
        case AnimationType.FadeOut: {
          renderable.opacity = 1 - easeOutCubic(anim.progress);
          break;
        }
        case AnimationType.SlideIn: {
          // Handled by movement system
          break;
        }
      }

      // Remove animation when complete
      if (anim.progress >= 1) {
        renderable.scale = 1;
        renderable.opacity = 1;
        entity.animation = undefined;
      }
    }
  }
}
