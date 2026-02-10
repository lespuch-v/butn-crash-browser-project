import type { Modifier, ModifierContext } from './modifier';

/**
 * Registry of all available modifiers.
 * Uses weighted random selection.
 */
export class ModifierRegistry {
  private modifiers: Modifier[] = [];
  private totalWeight: number = 0;

  /** Register a modifier */
  register(modifier: Modifier): void {
    this.modifiers.push(modifier);
    this.totalWeight += modifier.weight;
  }

  /** Pick a random modifier based on weights */
  roll(): Modifier | null {
    if (this.modifiers.length === 0) return null;

    let random = Math.random() * this.totalWeight;
    for (const mod of this.modifiers) {
      random -= mod.weight;
      if (random <= 0) return mod;
    }

    return this.modifiers[this.modifiers.length - 1];
  }

  /** Roll and execute if successful */
  tryExecute(chance: number, ctx: ModifierContext): Modifier | null {
    if (Math.random() > chance) return null;

    const modifier = this.roll();
    if (!modifier) return null;

    modifier.execute(ctx);
    return modifier;
  }

  /** Get all registered modifier names */
  list(): string[] {
    return this.modifiers.map((m) => `${m.icon} ${m.name} (weight: ${m.weight})`);
  }
}
