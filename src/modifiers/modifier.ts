import type { Entity } from '@ecs/entity';
import type { EntityManager } from '@ecs/entity-manager';
import type { EventBus } from '@core/event-bus';
import type { Grid } from '@grid/grid';
import type { SpawnSystem } from '@systems/spawn-system';
import type { EffectsRenderer } from '@rendering/effects-renderer';
import type { Direction } from '@models/direction';

/** Context passed to every modifier when it executes */
export interface ModifierContext {
  /** The button that was clicked */
  clickedEntity: Entity;
  /** Grid coordinates of the clicked button */
  col: number;
  row: number;
  /** Direction chosen for spawning */
  direction: Direction;
  /** Access to all game systems */
  entities: EntityManager;
  grid: Grid;
  bus: EventBus;
  spawner: SpawnSystem;
  effects: EffectsRenderer;
}

/** Every modifier implements this interface */
export interface Modifier {
  /** Display name (shown in flash text) */
  name: string;
  /** Emoji icon for UI */
  icon: string;
  /** Weight for random selection (higher = more likely) */
  weight: number;
  /** Execute the modifier's effect */
  execute(ctx: ModifierContext): void;
}
