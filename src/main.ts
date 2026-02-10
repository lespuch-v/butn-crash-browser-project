import { Game } from './core/game';

// ── Bootstrap ─────────────────────────────────────
const game = new Game('game-canvas');
game.start();

// Expose to console for debugging
(window as any).__game = game;
