# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Button Chaos — a chain-reaction button spawning game built with vanilla TypeScript and Canvas 2D. Zero runtime dependencies. Bundled with Vite.

## Commands

```bash
npm run dev        # Vite dev server (port 3000, auto-open)
npm run build      # tsc + vite build → dist/
npm run test       # Vitest
npm run lint       # ESLint on src/**/*.ts
npm run format     # Prettier on src/**/*.ts
```

## Path Aliases

Defined in both `tsconfig.json` and `vite.config.ts`. Always use these for imports:

```
@core/*  @ecs/*  @systems/*  @grid/*  @modifiers/*  @rendering/*  @models/*  @utils/*
```

Each subdirectory has an `index.ts` barrel file, so `import { EventBus } from '@core'` works.

## Architecture

**ECS (Entity Component System)** — Entities are plain objects with an `id` and optional component fields (`position`, `renderable`, `velocity`, `gridCell`, `interactive`, `animation`, `lifetime`, `species`). Presence of a component = entity has that capability. `EntityManager` handles creation, querying, and deferred destruction (soft-delete via `active = false`, hard-delete in `flush()` once per frame).

**Event Bus** — Typed pub/sub (`@core/event-bus.ts`). All cross-system communication goes through events defined in `@models/events.ts`. Systems never reference each other directly.

**Game Loop** — Fixed timestep at 60Hz with accumulator pattern (`@core/game-loop.ts`). Logic updates are deterministic; rendering receives an interpolation alpha.

**Spatial Grid** — `@grid/grid.ts` stores entity IDs by `"col_row"` key for O(1) cell lookups. Cell size is 64px (`CELL_SIZE` constant).

**Canvas & Camera** — `CanvasManager` handles DPI-aware sizing and stores camera offset (`cameraX`, `cameraY`). Rendering applies `ctx.translate(-cameraX, -cameraY)` for world-space drawing. `screenToWorld()` converts mouse coords.

**Modifier System** — Modifiers implement `{ name, icon, weight, execute(ctx) }`. Registered in `ModifierRegistry`, triggered randomly on click (25% chance). To add a new modifier: create file in `src/modifiers/`, implement the interface, register in `Game` constructor.

## Update Order

In `Game.update(dt)`: InputSystem → AnimationSystem → MovementSystem → LifetimeSystem → EffectsRenderer → EntityManager.flush() → HUD update.

## Key Constants (`src/constants.ts`)

`CELL_SIZE = 64`, `TICK_RATE = 60`, `BUTTON_PADDING = 6`, `MODIFIER_CHANCE = 0.25`, `DEBUG_MODE = true`.

## Conventions

- Arrow functions for event handlers (correct `this` binding)
- `import type` for type-only imports
- Components have factory functions (e.g., `createDefaultRenderable()`)
- All styles inline in `index.html` `<style>` block (no external CSS files)
- `window.__game` exposes the Game instance for console debugging

## Extending

- **New component**: add to `ecs/components/`, update `Entity` interface in `ecs/entity.ts`, export from barrel
- **New system**: add to `systems/`, wire into `Game` constructor and `update()` loop
- **New modifier**: add to `modifiers/`, implement `Modifier` interface, register in `Game` constructor
- **New renderer**: add to `rendering/`, call from `Renderer.render()`
