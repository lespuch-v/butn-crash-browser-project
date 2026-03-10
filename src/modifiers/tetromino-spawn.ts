import type { Modifier, ModifierContext } from './modifier';
import type { ButtonStyle } from '@models/button-style';
import type { GridCellOffset } from '@ecs/components/grid-cell';
import { ALL_DIRECTIONS, DIRECTION_VECTORS } from '@models/direction';
import { CELL_SIZE } from '../constants';

interface TetrominoDefinition {
  name: string;
  label: string;
  color: string;
  hoverColor: string;
  borderColor: string;
  contentColor: string;
  colSpan: number;
  rowSpan: number;
  occupiedCells: GridCellOffset[];
}

const TETROMINOES: readonly TetrominoDefinition[] = [
  {
    name: 'I Block',
    label: 'I',
    color: '#00c8ff',
    hoverColor: '#33d6ff',
    borderColor: '#0096bf',
    contentColor: '#053042',
    colSpan: 4,
    rowSpan: 1,
    occupiedCells: [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
    ],
  },
  {
    name: 'O Block',
    label: 'O',
    color: '#ffd500',
    hoverColor: '#ffe14d',
    borderColor: '#c9a700',
    contentColor: '#5a4300',
    colSpan: 2,
    rowSpan: 2,
    occupiedCells: [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
    ],
  },
  {
    name: 'T Block',
    label: 'T',
    color: '#b455ff',
    hoverColor: '#c57bff',
    borderColor: '#7f2fe0',
    contentColor: '#ffffff',
    colSpan: 3,
    rowSpan: 2,
    occupiedCells: [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 1, row: 1 },
    ],
  },
  {
    name: 'S Block',
    label: 'S',
    color: '#57d64d',
    hoverColor: '#76e06d',
    borderColor: '#2d9f28',
    contentColor: '#10360f',
    colSpan: 3,
    rowSpan: 2,
    occupiedCells: [
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
    ],
  },
  {
    name: 'Z Block',
    label: 'Z',
    color: '#ff5a5a',
    hoverColor: '#ff7a7a',
    borderColor: '#d93a3a',
    contentColor: '#ffffff',
    colSpan: 3,
    rowSpan: 2,
    occupiedCells: [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
    ],
  },
  {
    name: 'J Block',
    label: 'J',
    color: '#3f75ff',
    hoverColor: '#648fff',
    borderColor: '#2c54d1',
    contentColor: '#ffffff',
    colSpan: 3,
    rowSpan: 2,
    occupiedCells: [
      { col: 0, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
    ],
  },
  {
    name: 'L Block',
    label: 'L',
    color: '#ff9d33',
    hoverColor: '#ffb866',
    borderColor: '#d87917',
    contentColor: '#492300',
    colSpan: 3,
    rowSpan: 2,
    occupiedCells: [
      { col: 2, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
    ],
  },
];

function pickTetromino(): TetrominoDefinition {
  return TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
}

function createTetrominoStyle(piece: TetrominoDefinition): ButtonStyle {
  return {
    fillColor: piece.color,
    borderColor: piece.borderColor,
    borderWidth: 2,
    borderRadius: 12,
    shadowBlur: 12,
    shadowColor: `${piece.color}88`,
    icon: piece.label,
    hoverFillColor: piece.hoverColor,
    shape: 'tetromino',
    width: piece.colSpan * CELL_SIZE,
    height: piece.rowSpan * CELL_SIZE,
    content: {
      text: piece.label,
      fontSize: 0.26,
      fontFamily: '"Segoe UI", sans-serif',
      color: piece.contentColor,
      rotation: 0,
    },
  };
}

function findSpawnAnchors(
  originCol: number,
  originRow: number,
  preferredDirection: ModifierContext['direction'],
  count: number,
): { col: number; row: number }[] {
  const anchors: { col: number; row: number }[] = [];
  const seen = new Set<string>();
  const prioritizedDirections = [
    preferredDirection,
    ...ALL_DIRECTIONS.filter((direction) => direction !== preferredDirection),
  ];

  for (let ring = 1; anchors.length < count && ring <= 8; ring++) {
    for (const direction of prioritizedDirections) {
      const vector = DIRECTION_VECTORS[direction];

      for (let step = -ring; step <= ring; step++) {
        const col = originCol + vector.x * ring + (vector.x === 0 ? step : 0);
        const row = originRow + vector.y * ring + (vector.y === 0 ? step : 0);
        const key = `${col}_${row}`;

        if (seen.has(key)) continue;
        seen.add(key);
        anchors.push({ col, row });

        if (anchors.length >= count) break;
      }

      if (anchors.length >= count) break;
    }
  }

  return anchors;
}

export const TetrominoSpawnModifier: Modifier = {
  name: 'Tetromino Drop!',
  icon: '🧩',
  shader: 'glitch-reactor',
  weight: 2,

  execute(ctx: ModifierContext): void {
    const { col, row, direction, grid, spawner, effects } = ctx;
    const spawnCount = 4 + Math.floor(Math.random() * 5);
    const candidateAnchors = findSpawnAnchors(col, row, direction, spawnCount * 4);
    let spawned = 0;

    for (const anchor of candidateAnchors) {
      if (spawned >= spawnCount) break;

      const piece = pickTetromino();
      const style = createTetrominoStyle(piece);
      const target = grid.isShapeFree(
        anchor.col,
        anchor.row,
        piece.colSpan,
        piece.rowSpan,
        piece.occupiedCells,
      )
        ? anchor
        : grid.findFreeShapeInDirection(
          anchor.col,
          anchor.row,
          direction,
          piece.colSpan,
          piece.rowSpan,
          piece.occupiedCells,
          6,
        );

      if (!target) continue;

      const entity = spawner.spawnShapedButton(target.col, target.row, style, {
        colSpan: piece.colSpan,
        rowSpan: piece.rowSpan,
        occupiedCells: piece.occupiedCells,
      });

      if (!entity?.gridCell) continue;

      const center = grid.spanCenter(
        entity.gridCell.col,
        entity.gridCell.row,
        entity.gridCell.colSpan,
        entity.gridCell.rowSpan,
      );
      effects.emit(center.x, center.y, piece.color, 10);
      spawned++;
    }

    if (spawned === 0) return;

    const burstCenter = grid.cellCenter(col, row);
    effects.emit(burstCenter.x, burstCenter.y, '#ffffff', 12 + spawned * 3);
  },
};
