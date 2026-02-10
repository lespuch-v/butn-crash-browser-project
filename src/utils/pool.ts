/**
 * Generic object pool to reduce garbage collection pressure.
 * Used for particles, temporary effects, etc.
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize: number = 0) {
    this.createFn = createFn;
    this.resetFn = resetFn;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /** Get an object from the pool (or create a new one) */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  /** Return an object to the pool */
  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }

  /** Current number of available objects in the pool */
  get available(): number {
    return this.pool.length;
  }
}
