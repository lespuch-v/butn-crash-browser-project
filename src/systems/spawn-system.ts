import type { EventBus } from '@core/event-bus';
import { createAnimation, AnimationType } from '@ecs/components/animation';
import { createDefaultInteractive } from '@ecs/components/interactive';
import { createDefaultRenderable } from '@ecs/components/renderable';
import { createSpecies } from '@ecs/components/species';
import type { GridCellOffset } from '@ecs/components/grid-cell';
import type { Entity } from '@ecs/entity';
import type { EntityManager } from '@ecs/entity-manager';
import type { Grid } from '@grid/grid';
import type { ButtonShaderPreset } from '@models/button-shader';
import { randomButtonShader } from '@models/button-shader';
import { computeSpan, randomStyle, type ButtonStyle } from '@models/button-style';
import { randomDirection, type Direction } from '@models/direction';
import { SpeciesType } from '@models/species';
import { SHADER_BUTTON_CHANCE, SPAWN_ANIM_DURATION_MS } from '../constants';

interface ShapeSpawnOptions {
  colSpan?: number;
  rowSpan?: number;
  occupiedCells?: GridCellOffset[];
  allowShaderVariant?: boolean;
  shaderPreset?: ButtonShaderPreset | null;
}

/**
 * Handles spawning button entities onto the grid.
 */
export class SpawnSystem {
  public clickCount: number = 0;

  constructor(
    private bus: EventBus,
    private entities: EntityManager,
    private grid: Grid,
  ) {
    this.bus.on('input:click', this.handleClick);
    this.bus.on('preview:click', this.handlePreviewClick);
  }

  private handleClick = (payload: { col: number; row: number; entityId: number | null }): void => {
    const { entityId } = payload;

    if (entityId === null) return;

    const entity = this.entities.get(entityId);
    if (!entity?.interactive?.clickable) return;

    this.clickCount++;

    const anchor = entity.gridCell!;
    const direction = randomDirection();
    const style = randomStyle();
    const { colSpan, rowSpan } = computeSpan(style.width, style.height);

    const target = this.grid.findFreeSpanInDirection(
      anchor.col,
      anchor.row,
      direction,
      colSpan,
      rowSpan,
    );

    if (target) {
      this.spawnButton(target.col, target.row, style);
    }

    this.bus.emit('button:clicked', {
      entityId,
      col: anchor.col,
      row: anchor.row,
      direction,
    });

    if (entity.position && entity.gridCell) {
      const center = this.grid.spanCenter(
        entity.gridCell.col,
        entity.gridCell.row,
        entity.gridCell.colSpan,
        entity.gridCell.rowSpan,
      );
      this.bus.emit('effect:particles', {
        x: center.x,
        y: center.y,
        color: entity.renderable?.style.fillColor ?? '#ffffff',
        count: 8,
      });
    }
  };

  private handlePreviewClick = (payload: {
    col: number;
    row: number;
    direction: Direction;
    sourceEntityId: number;
  }): void => {
    const { col, row, direction, sourceEntityId } = payload;

    const sourceEntity = this.entities.get(sourceEntityId);
    if (!sourceEntity) return;

    this.clickCount++;
    const style = randomStyle();
    const { colSpan, rowSpan } = computeSpan(style.width, style.height);

    let spawnCol = col;
    let spawnRow = row;

    if (!this.grid.isSpanFree(spawnCol, spawnRow, colSpan, rowSpan)) {
      const fallback = this.grid.findFreeSpanInDirection(
        sourceEntity.gridCell!.col,
        sourceEntity.gridCell!.row,
        direction,
        colSpan,
        rowSpan,
      );
      if (!fallback) return;
      spawnCol = fallback.col;
      spawnRow = fallback.row;
    }

    this.spawnButton(spawnCol, spawnRow, style);

    this.bus.emit('button:clicked', {
      entityId: sourceEntityId,
      col: sourceEntity.gridCell?.col ?? col,
      row: sourceEntity.gridCell?.row ?? row,
      direction,
    });

    if (sourceEntity.position && sourceEntity.gridCell) {
      const center = this.grid.spanCenter(
        sourceEntity.gridCell.col,
        sourceEntity.gridCell.row,
        sourceEntity.gridCell.colSpan,
        sourceEntity.gridCell.rowSpan,
      );
      this.bus.emit('effect:particles', {
        x: center.x,
        y: center.y,
        color: sourceEntity.renderable?.style.fillColor ?? '#ffffff',
        count: 8,
      });
    }
  };

  /** Spawn a button at a specific grid cell (anchor = top-left of span) */
  spawnButton(
    col: number,
    row: number,
    style?: ButtonStyle,
    options?: ShapeSpawnOptions,
  ): Entity | null {
    return this.spawnShapedButton(col, row, style, options);
  }

  /** Spawn a button with an optional irregular occupied-cell mask inside its bounding box. */
  spawnShapedButton(
    col: number,
    row: number,
    style?: ButtonStyle,
    options?: ShapeSpawnOptions,
  ): Entity | null {
    const resolvedStyle = style ?? randomStyle();
    const inferredSpan = computeSpan(resolvedStyle.width, resolvedStyle.height);
    const colSpan = options?.colSpan ?? inferredSpan.colSpan;
    const rowSpan = options?.rowSpan ?? inferredSpan.rowSpan;
    const occupiedCells = options?.occupiedCells;

    if (!this.grid.isShapeFree(col, row, colSpan, rowSpan, occupiedCells)) {
      if ((colSpan > 1 || rowSpan > 1) && !occupiedCells) {
        if (!this.grid.isFree(col, row)) return null;
        resolvedStyle.width = Math.min(resolvedStyle.width, 56);
        resolvedStyle.height = Math.min(resolvedStyle.height, 56);

        const fallbackOptions = options ? { ...options } : undefined;
        if (fallbackOptions) {
          delete fallbackOptions.colSpan;
          delete fallbackOptions.rowSpan;
        }

        return this.spawnShapedButton(col, row, resolvedStyle, fallbackOptions);
      }
      return null;
    }

    const entity = this.entities.create();
    const pixel = this.grid.cellToPixel(col, row);

    entity.position = { x: pixel.x, y: pixel.y };
    entity.gridCell = { col, row, colSpan, rowSpan, occupiedCells };
    entity.renderable = createDefaultRenderable(resolvedStyle);
    entity.interactive = createDefaultInteractive();
    entity.species = createSpecies();
    entity.animation = createAnimation(AnimationType.SpawnPop, SPAWN_ANIM_DURATION_MS);

    const shaderPreset = this.resolveShaderPreset(options);
    if (shaderPreset) {
      entity.renderable.shader = shaderPreset;
      entity.species = createSpecies(SpeciesType.Shadered);
    }

    entity.renderable.scale = 0;

    this.grid.setShape(col, row, colSpan, rowSpan, entity.id, occupiedCells);
    this.bus.emit('button:spawned', { entityId: entity.id, col, row });

    return entity;
  }

  /** Spawn multiple buttons at specific cells (span-aware, random style per button) */
  spawnMultiple(cells: { col: number; row: number }[], style?: ButtonStyle): Entity[] {
    const results: Entity[] = [];
    for (const cell of cells) {
      const nextStyle = style
        ? { ...style, content: style.content ? { ...style.content } : style.content }
        : randomStyle();
      const entity = this.spawnButton(cell.col, cell.row, nextStyle);
      if (entity) results.push(entity);
    }
    return results;
  }

  private resolveShaderPreset(options?: ShapeSpawnOptions): ButtonShaderPreset | null {
    if (options?.shaderPreset !== undefined) {
      return options.shaderPreset;
    }

    if (options?.allowShaderVariant === false) {
      return null;
    }

    if (Math.random() >= SHADER_BUTTON_CHANCE) {
      return null;
    }

    return randomButtonShader();
  }
}
