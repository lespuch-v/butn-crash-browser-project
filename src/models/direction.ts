export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

export interface Vec2 {
  x: number;
  y: number;
}

/** Grid offset for each direction */
export const DIRECTION_VECTORS: Record<Direction, Vec2> = {
  [Direction.Up]: { x: 0, y: -1 },
  [Direction.Down]: { x: 0, y: 1 },
  [Direction.Left]: { x: -1, y: 0 },
  [Direction.Right]: { x: 1, y: 0 },
};

export const ALL_DIRECTIONS: Direction[] = [
  Direction.Up,
  Direction.Down,
  Direction.Left,
  Direction.Right,
];

/** Get a random direction */
export function randomDirection(): Direction {
  return ALL_DIRECTIONS[Math.floor(Math.random() * ALL_DIRECTIONS.length)];
}
