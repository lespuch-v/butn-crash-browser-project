import { EventBus } from './event-bus';
import { GameLoop } from './game-loop';
import { CanvasManager } from './canvas-manager';
import { EntityManager } from '../ecs/entity-manager';
import { Grid } from '../grid/grid';
import { Renderer } from '../rendering/renderer';
import { InputSystem } from '../systems/input-system';
import { SpawnSystem } from '../systems/spawn-system';
import { AnimationSystem } from '../systems/animation-system';
import { MovementSystem } from '../systems/movement-system';
import { LifetimeSystem } from '../systems/lifetime-system';
import { ModifierRegistry, MassSpawnModifier, StyleCopyModifier } from '../modifiers';
import type { ModifierContext, Modifier } from '../modifiers';
import { randomStyle } from '../models/button-style';
import { CELL_SIZE, MODIFIER_CHANCE, DEBUG_MODE } from '../constants';

/**
 * Main game class. Creates all systems and runs the game loop.
 */
export class Game {
  // Core
  private bus: EventBus;
  private loop: GameLoop;
  private canvas: CanvasManager;

  // ECS
  private entities: EntityManager;
  private grid: Grid;

  // Systems
  private inputSystem: InputSystem;
  private spawnSystem: SpawnSystem;
  private animationSystem: AnimationSystem;
  private movementSystem: MovementSystem;
  private lifetimeSystem: LifetimeSystem;

  // Modifiers
  private modifierRegistry: ModifierRegistry;

  // Rendering
  private renderer: Renderer;

  // HUD elements
  private hudCount: HTMLElement | null;
  private hudClicks: HTMLElement | null;
  private debugFps: HTMLElement | null;
  private debugEntities: HTMLElement | null;
  private modifierFlash: HTMLElement | null;
  private panUpButton: HTMLButtonElement | null;
  private panDownButton: HTMLButtonElement | null;
  private panLeftButton: HTMLButtonElement | null;
  private panRightButton: HTMLButtonElement | null;

  constructor(canvasId: string) {
    // ── Initialize core ───────────────────────
    this.bus = new EventBus();
    this.canvas = new CanvasManager(canvasId);
    this.entities = new EntityManager();
    this.grid = new Grid(CELL_SIZE);

    // ── Initialize systems ────────────────────
    this.inputSystem = new InputSystem(this.canvas, this.bus, this.entities, this.grid);
    this.spawnSystem = new SpawnSystem(this.bus, this.entities, this.grid);
    this.animationSystem = new AnimationSystem(this.entities);
    this.movementSystem = new MovementSystem(this.entities);
    this.lifetimeSystem = new LifetimeSystem(this.bus, this.entities, this.grid);

    // ── Initialize modifiers ──────────────────
    this.modifierRegistry = new ModifierRegistry();
    this.modifierRegistry.register(MassSpawnModifier);
    this.modifierRegistry.register(StyleCopyModifier);

    // ── Initialize renderer ───────────────────
    this.renderer = new Renderer(this.canvas, this.entities, this.grid);

    // ── Game loop ─────────────────────────────
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha),
    );

    // ── HUD references ────────────────────────
    this.hudCount = document.getElementById('hud-count');
    this.hudClicks = document.getElementById('hud-clicks');
    this.debugFps = document.getElementById('debug-fps');
    this.debugEntities = document.getElementById('debug-entities');
    this.modifierFlash = document.getElementById('modifier-flash');
    this.panUpButton = document.getElementById('pan-up') as HTMLButtonElement | null;
    this.panDownButton = document.getElementById('pan-down') as HTMLButtonElement | null;
    this.panLeftButton = document.getElementById('pan-left') as HTMLButtonElement | null;
    this.panRightButton = document.getElementById('pan-right') as HTMLButtonElement | null;

    // ── Wire up events ────────────────────────
    this.setupPanControls();
    this.setupEventHandlers();

    // ── Spawn the initial button at center ────
    this.spawnInitialButton();
  }

  private setupEventHandlers(): void {
    // Listen for button clicks to try modifiers
    this.bus.on('button:clicked', (payload) => {
      const entity = this.entities.get(payload.entityId);
      if (!entity) return;

      const ctx: ModifierContext = {
        clickedEntity: entity,
        col: payload.col,
        row: payload.row,
        direction: payload.direction,
        entities: this.entities,
        grid: this.grid,
        bus: this.bus,
        spawner: this.spawnSystem,
        effects: this.renderer.effects,
      };

      const triggered = this.modifierRegistry.tryExecute(MODIFIER_CHANCE, ctx);
      if (triggered) {
        this.showModifierFlash(triggered);
        this.bus.emit('modifier:triggered', { name: triggered.name, entityId: entity.id });
      }
    });

    // Listen for particle effect requests
    this.bus.on('effect:particles', (payload) => {
      this.renderer.effects.emit(payload.x, payload.y, payload.color, payload.count);
    });
  }

  private spawnInitialButton(): void {
    const centerWorldX = this.canvas.cameraX + this.canvas.width / 2;
    const centerWorldY = this.canvas.cameraY + this.canvas.height / 2;
    const { col: centerCol, row: centerRow } = this.grid.pixelToCell(centerWorldX, centerWorldY);
    this.spawnSystem.spawnButton(centerCol, centerRow, randomStyle());
  }

  private showModifierFlash(modifier: Modifier): void {
    if (!this.modifierFlash) return;
    this.modifierFlash.textContent = `${modifier.icon} ${modifier.name}`;
    this.modifierFlash.classList.add('visible');
    setTimeout(() => {
      this.modifierFlash?.classList.remove('visible');
    }, 1200);
  }

  private setupPanControls(): void {
    this.panUpButton?.addEventListener('click', () => this.canvas.panByCells(0, -1, CELL_SIZE));
    this.panDownButton?.addEventListener('click', () => this.canvas.panByCells(0, 1, CELL_SIZE));
    this.panLeftButton?.addEventListener('click', () => this.canvas.panByCells(-1, 0, CELL_SIZE));
    this.panRightButton?.addEventListener('click', () => this.canvas.panByCells(1, 0, CELL_SIZE));
  }

  // ── Game loop callbacks ───────────────────────

  private update(dt: number): void {
    this.inputSystem.update();
    this.animationSystem.update(dt);
    this.movementSystem.update(dt);
    this.lifetimeSystem.update(dt);
    this.renderer.updateEffects(dt);

    // Flush destroyed entities
    this.entities.flush();

    // Update HUD
    this.updateHUD();
  }

  private render(alpha: number): void {
    this.renderer.render(alpha);
  }

  private updateHUD(): void {
    if (this.hudCount) this.hudCount.textContent = String(this.entities.count);
    if (this.hudClicks) this.hudClicks.textContent = String(this.spawnSystem.clickCount);

    if (DEBUG_MODE) {
      if (this.debugFps) this.debugFps.textContent = String(this.loop.fps);
      if (this.debugEntities) this.debugEntities.textContent = String(this.entities.count);
    }
  }

  // ── Public API ────────────────────────────────

  start(): void {
    this.loop.start();
    console.log(
      '%c🎮 Button Chaos started!',
      'color: #6366f1; font-size: 16px; font-weight: bold',
    );
    console.log('Registered modifiers:', this.modifierRegistry.list());
  }

  stop(): void {
    this.loop.stop();
  }

  reset(): void {
    this.loop.stop();
    this.entities.clear();
    this.grid.clear();
    this.spawnSystem.clickCount = 0;
    this.spawnInitialButton();
    this.loop.start();
    this.bus.emit('game:reset', {});
  }
}
