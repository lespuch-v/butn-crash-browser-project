import type { Direction } from './direction';

/** All game events with their payloads */
export interface GameEvents {
  // Input events
  'input:click': { col: number; row: number; entityId: number | null };
  'input:hover': { col: number; row: number; entityId: number | null };
  'input:hover:exit': {};

  // Game state events
  'button:spawned': { entityId: number; col: number; row: number };
  'button:destroyed': { entityId: number; col: number; row: number };
  'button:clicked': { entityId: number; col: number; row: number; direction: Direction };

  // Modifier events
  'modifier:triggered': { name: string; entityId: number };
  'modifier:complete': { name: string };

  // Preview events
  'preview:click': { col: number; row: number; direction: Direction; sourceEntityId: number };

  // Effect events
  'effect:spawn_anim': { entityId: number; col: number; row: number };
  'effect:explosion': { col: number; row: number; radius: number };
  'effect:particles': { x: number; y: number; color: string; count: number };

  // System events
  'game:reset': {};
  'game:pause': {};
  'game:resume': {};
}

export type GameEventName = keyof GameEvents;
