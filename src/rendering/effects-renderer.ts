import { ObjectPool } from '@utils/pool';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0-1, decreases over time
  decay: number; // how fast life decreases per tick
  size: number;
  color: string;
  active: boolean;
}

/**
 * Simple particle system rendered on canvas.
 * Uses object pooling to avoid GC pressure.
 */
export class EffectsRenderer {
  private particles: Particle[] = [];
  private pool: ObjectPool<Particle>;

  constructor() {
    this.pool = new ObjectPool<Particle>(
      () => ({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 1,
        decay: 0.02,
        size: 4,
        color: '#ffffff',
        active: false,
      }),
      (p) => {
        p.active = false;
        p.life = 1;
      },
      100, // pre-allocate 100 particles
    );
  }

  /** Emit particles from a point */
  emit(x: number, y: number, color: string, count: number = 12): void {
    for (let i = 0; i < count; i++) {
      const particle = this.pool.acquire();
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 1 + Math.random() * 3;

      particle.x = x;
      particle.y = y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 1;
      particle.decay = 0.015 + Math.random() * 0.02;
      particle.size = 2 + Math.random() * 4;
      particle.color = color;
      particle.active = true;

      this.particles.push(particle);
    }
  }

  /** Update all particles */
  update(_dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97; // friction
      p.vy *= 0.97;
      p.vy += 0.03; // slight gravity
      p.life -= p.decay;

      if (p.life <= 0) {
        p.active = false;
        this.particles.splice(i, 1);
        this.pool.release(p);
      }
    }
  }

  /** Render all active particles */
  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (!p.active) continue;

      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Number of active particles */
  get count(): number {
    return this.particles.length;
  }
}
