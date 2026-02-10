import type { GameEvents, GameEventName } from '@models/events';

type EventCallback<T extends GameEventName> = (payload: GameEvents[T]) => void;

/**
 * Typed pub/sub event bus.
 * All game systems communicate through this — no direct dependencies.
 *
 * Usage:
 *   bus.on('button:clicked', (payload) => { ... });
 *   bus.emit('button:clicked', { entityId: 1, col: 3, row: 2, direction: 'up' });
 */
export class EventBus {
  private listeners = new Map<string, Set<EventCallback<any>>>();

  /** Subscribe to an event */
  on<T extends GameEventName>(event: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /** Subscribe to an event, but only fire once */
  once<T extends GameEventName>(event: T, callback: EventCallback<T>): () => void {
    const wrapper: EventCallback<T> = (payload) => {
      callback(payload);
      unsub();
    };
    const unsub = this.on(event, wrapper);
    return unsub;
  }

  /** Emit an event to all subscribers */
  emit<T extends GameEventName>(event: T, payload: GameEvents[T]): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    for (const cb of callbacks) {
      cb(payload);
    }
  }

  /** Remove all listeners (used on game reset) */
  clear(): void {
    this.listeners.clear();
  }

  /** Debug: list all registered events and listener counts */
  debug(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [event, callbacks] of this.listeners) {
      result[event] = callbacks.size;
    }
    return result;
  }
}
