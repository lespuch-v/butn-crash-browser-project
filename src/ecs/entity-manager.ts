import type { Entity } from './entity';

/**
 * Manages the lifecycle of all entities.
 * Provides creation, destruction, and querying.
 */
export class EntityManager {
  private nextId: number = 1;
  private entities: Map<number, Entity> = new Map();
  private pendingDestroy: number[] = [];

  /** Create a new entity with just an ID */
  create(): Entity {
    const entity: Entity = {
      id: this.nextId++,
      active: true,
    };
    this.entities.set(entity.id, entity);
    return entity;
  }

  /** Get entity by ID */
  get(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  /** Mark entity for destruction (actual removal happens in flush) */
  destroy(id: number): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.active = false;
      this.pendingDestroy.push(id);
    }
  }

  /** Actually remove destroyed entities — call once per frame after update */
  flush(): Entity[] {
    const destroyed: Entity[] = [];
    for (const id of this.pendingDestroy) {
      const entity = this.entities.get(id);
      if (entity) {
        destroyed.push(entity);
        this.entities.delete(id);
      }
    }
    this.pendingDestroy = [];
    return destroyed;
  }

  /** Get all active entities */
  all(): Entity[] {
    return Array.from(this.entities.values()).filter((e) => e.active);
  }

  /** Query entities that have specific components */
  query(...components: (keyof Entity)[]): Entity[] {
    return this.all().filter((entity) => components.every((comp) => entity[comp] !== undefined));
  }

  /** Count of active entities */
  get count(): number {
    return this.entities.size;
  }

  /** Remove all entities */
  clear(): void {
    this.entities.clear();
    this.pendingDestroy = [];
    this.nextId = 1;
  }
}
