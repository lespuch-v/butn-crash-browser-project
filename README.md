# 🎮 Button Chaos

A chain-reaction button spawning game with random modifiers built with vanilla TypeScript and Canvas.

## Quick Start

```bash
npm install
npm run dev
```

## Architecture

- **Vanilla TypeScript + Canvas** — zero runtime dependencies
- **ECS-inspired** entity system for scalable game objects
- **Event Bus** for decoupled system communication
- **Fixed timestep game loop** for deterministic physics
- **Object pooling** for particle effects (no GC pressure)

## Project Structure

```
src/
├── core/         # Engine: game loop, event bus, canvas manager
├── ecs/          # Entity Component System
├── systems/      # Game logic: input, spawning, animation, movement
├── grid/         # Logical grid with O(1) spatial lookups
├── modifiers/    # Modifier effects (mass spawn, style copy, etc.)
├── rendering/    # Canvas drawing: buttons, grid, particles
├── effects/      # Visual effect definitions
├── models/       # Type definitions
└── utils/        # Math, color, object pool helpers
```

## Modifiers

| Modifier | Effect |
|----------|--------|
| 💥 Mass Spawn | Spawns 8-20 buttons in a burst |
| 🎨 Style Copy | All buttons adopt clicked button's style |
| _More coming..._ | Tetris shapes, explosions, dash, species |

## Scripts

- `npm run dev` — Start dev server with HMR
- `npm run build` — Production build
- `npm run test` — Run tests
