export interface ShakeOptions {
  /** 0–1, trauma added to the shake. Default: 0.4 */
  intensity?: number;
  /** Max pixel displacement at full trauma. Default: 8 */
  maxOffset?: number;
  /** Trauma lost per second. Default: 2.5 */
  decay?: number;
}

const DEFAULTS: Required<ShakeOptions> = {
  intensity: 0.6,
  maxOffset: 12,
  decay: 2.5,
};

/**
 * Trauma-based screen shake.
 *
 * Call `trigger()` to add trauma (0–1). Each frame `update(dt)` decays it
 * and writes random `offsetX`/`offsetY` values scaled by trauma².
 *
 * Multiple triggers accumulate (capped at 1), so rapid events hit harder.
 */
export class CameraShake {
  private trauma = 0;
  private cfg: Required<ShakeOptions>;

  public offsetX = 0;
  public offsetY = 0;

  constructor(defaults?: ShakeOptions) {
    this.cfg = { ...DEFAULTS, ...defaults };
  }

  /** Add trauma. Options override instance defaults for this trigger only. */
  trigger(options?: ShakeOptions): void {
    const intensity = options?.intensity ?? this.cfg.intensity;
    this.trauma = Math.min(1, this.trauma + intensity);
  }

  update(dt: number): void {
    if (this.trauma <= 0) {
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }

    const maxOffset = this.cfg.maxOffset;
    const magnitude = this.trauma * this.trauma * maxOffset;

    this.offsetX = (Math.random() * 2 - 1) * magnitude;
    this.offsetY = (Math.random() * 2 - 1) * magnitude;

    this.trauma = Math.max(0, this.trauma - this.cfg.decay * dt);
  }
}
