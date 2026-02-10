import type { PositionComponent } from './components/position';
import type { GridCellComponent } from './components/grid-cell';
import type { RenderableComponent } from './components/renderable';
import type { VelocityComponent } from './components/velocity';
import type { SpeciesComponent } from './components/species';
import type { LifetimeComponent } from './components/lifetime';
import type { InteractiveComponent } from './components/interactive';
import type { AnimationComponent } from './components/animation';

/**
 * An entity is just an ID + optional components.
 * This is a simple "struct of optional" approach rather than a full ECS bitmasking system.
 * Good enough for our scale (hundreds to low thousands of entities).
 */
export interface Entity {
  id: number;
  active: boolean; // false = marked for removal

  // Components (all optional — presence defines capabilities)
  position?: PositionComponent;
  gridCell?: GridCellComponent;
  renderable?: RenderableComponent;
  velocity?: VelocityComponent;
  species?: SpeciesComponent;
  lifetime?: LifetimeComponent;
  interactive?: InteractiveComponent;
  animation?: AnimationComponent;
}
