import { EventBus } from './event-bus';
import { GameLoop } from './game-loop';
import { CanvasManager } from './canvas-manager';
import { CameraShake } from './camera-shake';
import { EntityManager } from '../ecs/entity-manager';
import { Grid } from '../grid/grid';
import { Renderer } from '../rendering/renderer';
import { InputSystem } from '../systems/input-system';
import { SpawnSystem } from '../systems/spawn-system';
import { AnimationSystem } from '../systems/animation-system';
import { MovementSystem } from '../systems/movement-system';
import { LifetimeSystem } from '../systems/lifetime-system';
import { SoundSystem } from '../systems/sound-system';
import { SpawnPreviewState } from '../systems/spawn-preview';
import { ModifierRegistry, MassSpawnModifier, StyleCopyModifier } from '../modifiers';
import type { ModifierContext, Modifier } from '../modifiers';
import type { SoundConfig, SoundDefinition } from '@models/sound';
import {
  DEFAULT_MODIFIER_SHADER,
  MODIFIER_SHADER_CLASSES,
  shaderFromModifierName,
  toModifierShaderClass,
} from '@models/modifier-shader';
import { retroInitialStyle } from '../models/button-style';
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
  private soundSystem: SoundSystem;

  // Modifiers
  private modifierRegistry: ModifierRegistry;

  // Rendering
  private renderer: Renderer;
  private cameraShake: CameraShake;

  // HUD elements
  private hudCount: HTMLElement | null;
  private hudClicks: HTMLElement | null;
  private debugFps: HTMLElement | null;
  private debugEntities: HTMLElement | null;
  private hudSoundToggle: HTMLButtonElement | null;
  private modifierFlash: HTMLElement | null;
  private modifierFlashTimeout: ReturnType<typeof setTimeout> | null;
  private soundEnabled: boolean;

  constructor(canvasId: string) {
    // ── Initialize core ───────────────────────
    this.bus = new EventBus();
    this.canvas = new CanvasManager(canvasId);
    this.entities = new EntityManager();
    this.grid = new Grid(CELL_SIZE);

    // ── Shared state ─────────────────────────
    const previewState = new SpawnPreviewState();

    // ── Initialize systems ────────────────────
    this.inputSystem = new InputSystem(this.canvas, this.bus, this.entities, this.grid, previewState);
    this.spawnSystem = new SpawnSystem(this.bus, this.entities, this.grid);
    this.animationSystem = new AnimationSystem(this.entities);
    this.movementSystem = new MovementSystem(this.entities);
    this.lifetimeSystem = new LifetimeSystem(this.bus, this.entities, this.grid);
    this.soundSystem = new SoundSystem(this.bus);
    this.soundEnabled = false;
    this.soundSystem.setEnabled(this.soundEnabled);

    // ── Initialize modifiers ──────────────────
    this.modifierRegistry = new ModifierRegistry();
    this.modifierRegistry.register(MassSpawnModifier);
    this.modifierRegistry.register(StyleCopyModifier);

    // ── Initialize renderer ───────────────────
    this.renderer = new Renderer(this.canvas, this.entities, this.grid, previewState);
    this.cameraShake = new CameraShake();

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
    this.hudSoundToggle = document.getElementById('sound-toggle') as HTMLButtonElement | null;
    this.modifierFlash = document.getElementById('modifier-flash');
    this.modifierFlashTimeout = null;

    this.setupSoundToggle();

    // ── Wire up events ────────────────────────
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
        this.cameraShake.trigger();
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
    this.spawnSystem.spawnButton(centerCol, centerRow, retroInitialStyle());
  }

  private setupSoundToggle(): void {
    if (!this.hudSoundToggle) return;
    this.hudSoundToggle.addEventListener('click', this.handleSoundToggleClick);
    this.updateSoundToggleUI();
  }

  private handleSoundToggleClick = (): void => {
    this.setSoundEnabled(!this.soundEnabled);
  };

  private updateSoundToggleUI(): void {
    if (!this.hudSoundToggle) return;

    this.hudSoundToggle.textContent = this.soundEnabled ? '🔊' : '🔇';
    this.hudSoundToggle.setAttribute('aria-pressed', String(this.soundEnabled));
    this.hudSoundToggle.classList.toggle('is-on', this.soundEnabled);
  }

  private showModifierFlash(modifier: Modifier): void {
    if (!this.modifierFlash) return;
    this.modifierFlash.textContent = `${modifier.icon} ${modifier.name}`;

    const shader = modifier.shader ?? shaderFromModifierName(modifier.name) ?? DEFAULT_MODIFIER_SHADER;
    this.modifierFlash.classList.remove(...MODIFIER_SHADER_CLASSES);
    this.modifierFlash.classList.add(toModifierShaderClass(shader));

    // Restart animation on consecutive triggers.
    this.modifierFlash.classList.remove('visible');
    void this.modifierFlash.offsetWidth;
    this.modifierFlash.classList.add('visible');

    if (this.modifierFlashTimeout) {
      clearTimeout(this.modifierFlashTimeout);
    }

    this.modifierFlashTimeout = setTimeout(() => {
      this.modifierFlash?.classList.remove('visible');
      this.modifierFlashTimeout = null;
    }, 1800);
  }

  // ── Game loop callbacks ───────────────────────

  private update(dt: number): void {
    this.inputSystem.update();
    this.animationSystem.update(dt);
    this.movementSystem.update(dt);
    this.lifetimeSystem.update(dt);
    this.renderer.updateEffects(dt);

    this.cameraShake.update(dt);
    this.canvas.shakeOffsetX = this.cameraShake.offsetX;
    this.canvas.shakeOffsetY = this.cameraShake.offsetY;

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
    if (this.debugFps) this.debugFps.textContent = String(this.loop.fps);

    if (DEBUG_MODE) {
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

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    this.soundSystem.setEnabled(enabled);
    this.updateSoundToggleUI();
  }

  setMasterVolume(volume: number): void {
    this.soundSystem.setMasterVolume(volume);
  }

  configureSounds(config: Partial<SoundConfig>): void {
    this.soundSystem.configure(config);
    if (typeof config.enabled === 'boolean') {
      this.soundEnabled = config.enabled;
      this.updateSoundToggleUI();
    }
  }

  registerModifierSound(modifierName: string, sound: SoundDefinition): void {
    this.soundSystem.registerModifierSound(modifierName, sound);
  }

  getSoundConfig(): SoundConfig {
    return this.soundSystem.getConfig();
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
