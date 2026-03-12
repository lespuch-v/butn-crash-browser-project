import { describe, expect, it } from 'vitest';
import { EventBus } from '@core/event-bus';
import { createDefaultInteractive } from '@ecs/components/interactive';
import { createDefaultRenderable } from '@ecs/components/renderable';
import { EntityManager } from '@ecs/entity-manager';
import type { Entity } from '@ecs/entity';
import { Grid } from '@grid/grid';
import { retroInitialStyle } from '@models/button-style';
import { ExplosionSystem } from '@systems/explosion-system';

function spawnTestEntity(
  entities: EntityManager,
  grid: Grid,
  col: number,
  row: number,
  explosive?: Entity['explosive'],
): Entity {
  const entity = entities.create();
  entity.position = grid.cellToPixel(col, row);
  entity.gridCell = { col, row, colSpan: 1, rowSpan: 1 };
  entity.renderable = createDefaultRenderable(retroInitialStyle());
  entity.interactive = createDefaultInteractive();
  entity.explosive = explosive;

  grid.setShape(col, row, 1, 1, entity.id);
  return entity;
}

describe('ExplosionSystem', () => {
  it('detonates armed TNT and destroys nearby buttons', () => {
    const bus = new EventBus();
    const entities = new EntityManager();
    const grid = new Grid(64);
    const system = new ExplosionSystem(bus, entities, grid);
    const destroyed: number[] = [];
    let explosions = 0;

    bus.on('button:destroyed', ({ entityId }) => destroyed.push(entityId));
    bus.on('effect:explosion', () => {
      explosions++;
    });

    const tnt = spawnTestEntity(entities, grid, 0, 0, {
      fuseMs: 100,
      elapsedMs: 0,
      blastRadius: 1,
      detonated: false,
    });
    const nearby = spawnTestEntity(entities, grid, 1, 0);

    system.update(120);

    expect(explosions).toBe(1);
    expect(destroyed).toEqual(expect.arrayContaining([tnt.id, nearby.id]));
    expect(grid.get(0, 0)).toBeNull();
    expect(grid.get(1, 0)).toBeNull();
  });

  it('chains explosions through neighboring TNT buttons', () => {
    const bus = new EventBus();
    const entities = new EntityManager();
    const grid = new Grid(64);
    const system = new ExplosionSystem(bus, entities, grid);
    let explosions = 0;

    bus.on('effect:explosion', () => {
      explosions++;
    });

    spawnTestEntity(entities, grid, 0, 0, {
      fuseMs: 100,
      elapsedMs: 0,
      blastRadius: 1,
      detonated: false,
    });
    spawnTestEntity(entities, grid, 1, 0, {
      fuseMs: 1000,
      elapsedMs: 0,
      blastRadius: 1,
      detonated: false,
    });
    spawnTestEntity(entities, grid, 2, 0);

    system.update(120);

    expect(explosions).toBe(2);
    expect(grid.get(0, 0)).toBeNull();
    expect(grid.get(1, 0)).toBeNull();
    expect(grid.get(2, 0)).toBeNull();
  });
});
