import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/core/event-bus';

describe('EventBus', () => {
  it('should emit and receive events', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('button:spawned', handler);
    bus.emit('button:spawned', { entityId: 1, col: 3, row: 2 });

    expect(handler).toHaveBeenCalledWith({ entityId: 1, col: 3, row: 2 });
  });

  it('should support multiple listeners', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on('button:clicked', h1);
    bus.on('button:clicked', h2);
    bus.emit('button:clicked', { entityId: 1, col: 0, row: 0, direction: 'up' as any });

    expect(h1).toHaveBeenCalled();
    expect(h2).toHaveBeenCalled();
  });

  it('should unsubscribe via returned function', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsub = bus.on('game:reset', handler);
    unsub();
    bus.emit('game:reset', {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('should fire once listener only once', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.once('game:reset', handler);
    bus.emit('game:reset', {});
    bus.emit('game:reset', {});

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should clear all listeners', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('game:reset', handler);
    bus.clear();
    bus.emit('game:reset', {});

    expect(handler).not.toHaveBeenCalled();
  });
});
