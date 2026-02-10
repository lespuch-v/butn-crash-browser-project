import { describe, it, expect } from 'vitest';
import { Grid } from '../src/grid/grid';
import { Direction } from '../src/models/direction';

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
});
