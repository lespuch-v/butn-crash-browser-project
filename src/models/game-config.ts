export interface GameConfig {
  /** Grid cell size in pixels */
  cellSize: number;
  /** Probability of a modifier on each click (0-1) */
  modifierChance: number;
  /** Whether to show debug overlay */
  debug: boolean;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  cellSize: 64,
  modifierChance: 0.25,
  debug: true,
};
