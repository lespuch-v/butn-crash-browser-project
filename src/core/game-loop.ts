import { TICK_MS } from '../constants';

export type UpdateFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

/**
 * Fixed timestep game loop.
 *
 * - update() runs at a fixed rate (60Hz) regardless of monitor refresh
 * - render() runs once per frame with interpolation alpha
 * - This ensures deterministic game logic even on 30fps or 144fps screens
 */
export class GameLoop {
  private running = false;
  private rafId: number = 0;
  private lastTime: number = 0;
  private accumulator: number = 0;

  // FPS tracking
  private frameCount: number = 0;
  private fpsTimer: number = 0;
  public fps: number = 0;

  constructor(
    private updateFn: UpdateFn,
    private renderFn: RenderFn,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.frameCount = 0;
    this.fpsTimer = 0;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return;

    const delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Prevent spiral of death — cap accumulated time
    this.accumulator += Math.min(delta, 200);

    // FPS tracking
    this.frameCount++;
    this.fpsTimer += delta;
    if (this.fpsTimer >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer -= 1000;
    }

    // Fixed timestep updates
    while (this.accumulator >= TICK_MS) {
      this.updateFn(TICK_MS);
      this.accumulator -= TICK_MS;
    }

    // Render with interpolation alpha
    const alpha = this.accumulator / TICK_MS;
    this.renderFn(alpha);

    this.rafId = requestAnimationFrame(this.loop);
  };
}
