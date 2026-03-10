import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid/grid';
import { Direction } from '../src/models/direction';
import type { GridCellOffset } from '../src/ecs/components/grid-cell';

const teeShape: GridCellOffset[] = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 2, row: 0 },
  { col: 1, row: 1 },
];

describe('Grid', () => {
  it('should set and get entities', () => {
    const grid = new Grid(64);
    grid.set(3, 5, 42);
    expect(grid.get(3, 5)).toBe(42);
    expect(grid.get(0, 0)).toBeNull();
  });

  it('should check occupied/free cells', () => {
    const grid = new Grid(64);
    grid.set(1, 1, 1);
    expect(grid.isOccupied(1, 1)).toBe(true);
    expect(grid.isFree(1, 1)).toBe(false);
    expect(grid.isFree(2, 2)).toBe(true);
  });

  it('should remove entities', () => {
    const grid = new Grid(64);
    grid.set(1, 1, 1);
    grid.remove(1, 1);
    expect(grid.isFree(1, 1)).toBe(true);
  });

  it('should convert cell to pixel coords', () => {
    const grid = new Grid(64);
    const pixel = grid.cellToPixel(3, 2);
    expect(pixel.x).toBe(192);
    expect(pixel.y).toBe(128);
  });

  it('should convert pixel to cell coords', () => {
    const grid = new Grid(64);
    const cell = grid.pixelToCell(200, 130);
    expect(cell.col).toBe(3);
    expect(cell.row).toBe(2);
  });

  it('should find neighbor cells', () => {
    const grid = new Grid(64);
    const n = grid.neighbor(5, 5, Direction.Up);
    expect(n.col).toBe(5);
    expect(n.row).toBe(4);
  });

  it('should find free neighbors', () => {
    const grid = new Grid(64);
    grid.set(5, 5, 1);
    grid.set(5, 4, 2); // block up

    const free = grid.freeNeighbors(5, 5);
    expect(free.length).toBe(3);
    expect(free.find((n) => n.direction === Direction.Up)).toBeUndefined();
  });

  it('should find first free cell in direction', () => {
    const grid = new Grid(64);
    grid.set(5, 5, 1);
    grid.set(6, 5, 2); // block immediate right

    const free = grid.findFreeInDirection(5, 5, Direction.Right);
    expect(free).toEqual({ col: 7, row: 5 });
  });

  it('should place and remove irregular shapes', () => {
    const grid = new Grid(64);
    grid.setShape(10, 4, 3, 2, 99, teeShape);

    expect(grid.get(10, 4)).toBe(99);
    expect(grid.get(11, 4)).toBe(99);
    expect(grid.get(12, 4)).toBe(99);
    expect(grid.get(11, 5)).toBe(99);
    expect(grid.get(10, 5)).toBeNull();

    grid.removeShape(10, 4, 3, 2, teeShape);
    expect(grid.get(11, 4)).toBeNull();
    expect(grid.get(11, 5)).toBeNull();
  });

  it('should check free status for irregular shapes', () => {
    const grid = new Grid(64);
    grid.set(6, 6, 7);

    expect(grid.isShapeFree(5, 5, 3, 2, teeShape)).toBe(false);
    expect(grid.isShapeFree(1, 1, 3, 2, teeShape)).toBe(true);
  });

  it('should find free neighbors around irregular shapes', () => {
    const grid = new Grid(64);
    grid.setShape(4, 4, 3, 2, 12, teeShape);

    const neighbors = grid.freeNeighborsAroundShape(4, 4, 3, 2, teeShape);

    expect(neighbors).toContainEqual({ col: 4, row: 3, direction: Direction.Up });
    expect(neighbors).toContainEqual({ col: 5, row: 6, direction: Direction.Down });
    expect(neighbors).toContainEqual({ col: 3, row: 4, direction: Direction.Left });
    expect(neighbors).toContainEqual({ col: 7, row: 4, direction: Direction.Right });
  });
});
