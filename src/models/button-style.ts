// ── Shape types ──────────────────────────────────────
export type ButtonShape =
  | 'rect'
  | 'circle'
  | 'pill'
  | 'diamond'
  | 'hexagon'
  | 'star'
  | 'cross'
  | 'triangle';

const SHAPES: ButtonShape[] = [
  'rect',
  'circle',
  'pill',
  'diamond',
  'hexagon',
  'star',
  'cross',
  'triangle',
];

// ── Span computation ────────────────────────────────
export interface ButtonSpan {
  colSpan: number;
  rowSpan: number;
}

const SPAN_THRESHOLD = 58; // CELL_SIZE(64) - BUTTON_PADDING(6)

/** Determine how many grid cells a button needs based on its dimensions */
export function computeSpan(width: number, height: number): ButtonSpan {
  return {
    colSpan: width > SPAN_THRESHOLD ? 2 : 1,
    rowSpan: height > SPAN_THRESHOLD ? 2 : 1,
  };
}

// ── Content ──────────────────────────────────────────
export interface ButtonContent {
  text: string;
  fontSize: number; // relative to min(width, height), 0.3–0.7
  fontFamily: string;
  color: string;
  rotation: number; // radians
}

// ── Style ────────────────────────────────────────────
export interface ButtonStyle {
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadowBlur: number;
  shadowColor: string;
  icon: string; // legacy — prefer content
  hoverFillColor: string;
  shape: ButtonShape;
  width: number;
  height: number;
  content: ButtonContent;
}

// ── Content pools ────────────────────────────────────

const EMOJI_POOL = [
  '⚡', '🔥', '🌿', '✨', '💎', '🎯', '💀', '👾', '🤖', '🎪',
  '🦊', '🐙', '🌈', '🎸', '🚀', '🍕', '🎲', '🧊', '🌶️', '🫧',
  '🪐', '💫', '🎭', '🦑', '🧿', '🔮', '🪩', '🎠', '🦴', '🧸',
  '🫀', '🧠', '🦷', '🌸', '🍄', '🪸', '🫐', '🍊', '🥝', '🧁',
  '🍩', '🌮', '🍣', '🎃', '👻', '🐸', '🦄', '🐝', '🦋', '🐢',
  '🌵', '🎵', '🏆', '⚔️', '🛸', '🪄', '🧲', '🎰', '🃏', '🪁',
];

const TEXT_POOL = [
  'OK', 'NO', 'YES', 'LOL', 'WOW', 'BRB', 'OMG', 'GG', 'RIP', 'YOLO',
  'NOPE', 'BOOM', 'ZAP', 'POP', 'HI', 'BYE', 'MEH', 'OOF', 'UGH', 'NAH',
  'SUS', 'VIBE', 'YEET', 'BONK', 'SEND', 'HELP', 'OOPS', 'NICE', 'COOL', 'EPIC',
];

const NUMBER_POOL = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
  '42', '69', '404', '∞', 'π', 'Σ', 'Δ', '√', '±', '≈', '≠', '∅',
];

const SYMBOL_POOL = [
  '♠', '♥', '♦', '♣', '☮', '☯', '⚛', '♻', '⚠', '☠',
  '❄', '♫', '⌘', '↯', '⊕', '⊗', '★', '✦', '◈', '▲',
];

const FONT_FAMILIES = ['sans-serif', 'monospace', 'serif', 'cursive'];

// ── Helpers ──────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
}

// ── Random content ───────────────────────────────────

function randomContent(): ButtonContent {
  const roll = Math.random();
  let text: string;
  if (roll < 0.4) text = pick(EMOJI_POOL);
  else if (roll < 0.65) text = pick(TEXT_POOL);
  else if (roll < 0.80) text = pick(NUMBER_POOL);
  else text = pick(SYMBOL_POOL);

  return {
    text,
    fontSize: rand(0.3, 0.7),
    fontFamily: pick(FONT_FAMILIES),
    color: Math.random() < 0.7 ? '#ffffff' : hsl(rand(0, 360), rand(60, 100), rand(75, 95)),
    rotation: rand(-0.3, 0.3),
  };
}

// ── Random dimensions per shape ──────────────────────
// Sizes land cleanly in span categories:
//   1x1: 32-56px  |  2x1: 70-120px wide, 32-56px tall
//   1x2: 32-56px wide, 70-120px tall  |  2x2: 70-120px both

function randomDimensions(shape: ButtonShape): { width: number; height: number } {
  const roll = Math.random();

  switch (shape) {
    case 'circle': {
      // 60% small (1x1), 40% large (2x2)
      if (roll < 0.6) {
        const d = rand(32, 56);
        return { width: d, height: d };
      }
      const d = rand(70, 110);
      return { width: d, height: d };
    }
    case 'rect': {
      // 40% 1x1, 20% 2x1, 20% 1x2, 20% 2x2
      if (roll < 0.4) {
        return { width: rand(32, 56), height: rand(32, 56) };
      } else if (roll < 0.6) {
        return { width: rand(70, 120), height: rand(32, 56) };
      } else if (roll < 0.8) {
        return { width: rand(32, 56), height: rand(70, 120) };
      }
      return { width: rand(70, 120), height: rand(70, 120) };
    }
    case 'pill': {
      // 40% horizontal wide (2x1), 40% vertical tall (1x2), 20% small (1x1)
      if (roll < 0.4) {
        return { width: rand(70, 120), height: rand(28, 45) };
      } else if (roll < 0.8) {
        return { width: rand(28, 45), height: rand(70, 120) };
      }
      return { width: rand(40, 56), height: rand(24, 36) };
    }
    case 'diamond':
    case 'hexagon':
    case 'triangle': {
      // 60% small (1x1), 40% large (2x2)
      if (roll < 0.6) {
        const s = rand(32, 56);
        return { width: s, height: s };
      }
      const s = rand(70, 100);
      return { width: s, height: s };
    }
    case 'star': {
      // 50% small (1x1), 50% large (2x2)
      if (roll < 0.5) {
        const s = rand(35, 56);
        return { width: s, height: s };
      }
      const s = rand(70, 100);
      return { width: s, height: s };
    }
    case 'cross': {
      // 60% small (1x1), 40% large (2x2)
      if (roll < 0.6) {
        const s = rand(32, 56);
        return { width: s, height: s };
      }
      const s = rand(70, 90);
      return { width: s, height: s };
    }
  }
}

// ── Chaos style generator ────────────────────────────

export function generateChaosStyle(): ButtonStyle {
  const shape = pick(SHAPES);
  const { width, height } = randomDimensions(shape);

  const hue = rand(0, 360);
  const sat = rand(55, 100);
  const lit = rand(35, 65);

  const fillColor = hsl(hue, sat, lit);
  const borderColor = hsl(hue, Math.min(sat + 10, 100), Math.min(lit + 18, 92));
  const hoverFillColor = hsl(hue, sat, Math.min(lit + 12, 85));
  const shadowColor = hsla(hue, sat, lit * 0.6, 0.5);
  const shadowBlur = rand(4, 18);
  const borderWidth = rand(1, 5);
  const borderRadius = randInt(2, Math.floor(Math.min(width, height) * 0.45));

  const content = randomContent();

  return {
    fillColor,
    borderColor,
    borderWidth,
    borderRadius,
    shadowBlur,
    shadowColor,
    icon: content.text, // legacy compat
    hoverFillColor,
    shape,
    width,
    height,
    content,
  };
}

// ── Public API (same signature, now fully random) ────

export function randomStyle(): ButtonStyle {
  return generateChaosStyle();
}

export function retroInitialStyle(): ButtonStyle {
  return {
    fillColor: '#c0c0c0',
    borderColor: '#4a4a4a',
    borderWidth: 2,
    borderRadius: 2,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    icon: 'OK',
    hoverFillColor: '#d8d8d8',
    shape: 'rect',
    width: 116,
    height: 56,
    content: {
      text: 'Don"t touch!',
      fontSize: 0.35,
      fontFamily: 'serif',
      color: '#111111',
      rotation: 0,
    },
  };
}
// ── Default styles (updated with new fields) ─────────

export const DEFAULT_STYLES: ButtonStyle[] = [
  {
    fillColor: '#6366f1',
    borderColor: '#818cf8',
    borderWidth: 2,
    borderRadius: 10,
    shadowBlur: 8,
    shadowColor: 'rgba(99, 102, 241, 0.4)',
    icon: '⚡',
    hoverFillColor: '#7c7ff7',
    shape: 'rect',
    width: 52,
    height: 52,
    content: { text: '⚡', fontSize: 0.45, fontFamily: 'sans-serif', color: '#ffffff', rotation: 0 },
  },
  {
    fillColor: '#f43f5e',
    borderColor: '#fb7185',
    borderWidth: 2,
    borderRadius: 10,
    shadowBlur: 8,
    shadowColor: 'rgba(244, 63, 94, 0.4)',
    icon: '🔥',
    hoverFillColor: '#ff5a78',
    shape: 'rect',
    width: 52,
    height: 52,
    content: { text: '🔥', fontSize: 0.45, fontFamily: 'sans-serif', color: '#ffffff', rotation: 0 },
  },
  {
    fillColor: '#10b981',
    borderColor: '#34d399',
    borderWidth: 2,
    borderRadius: 10,
    shadowBlur: 8,
    shadowColor: 'rgba(16, 185, 129, 0.4)',
    icon: '🌿',
    hoverFillColor: '#22d39a',
    shape: 'rect',
    width: 52,
    height: 52,
    content: { text: '🌿', fontSize: 0.45, fontFamily: 'sans-serif', color: '#ffffff', rotation: 0 },
  },
  {
    fillColor: '#f59e0b',
    borderColor: '#fbbf24',
    borderWidth: 2,
    borderRadius: 10,
    shadowBlur: 8,
    shadowColor: 'rgba(245, 158, 11, 0.4)',
    icon: '✨',
    hoverFillColor: '#ffb829',
    shape: 'rect',
    width: 52,
    height: 52,
    content: { text: '✨', fontSize: 0.45, fontFamily: 'sans-serif', color: '#ffffff', rotation: 0 },
  },
  {
    fillColor: '#8b5cf6',
    borderColor: '#a78bfa',
    borderWidth: 2,
    borderRadius: 10,
    shadowBlur: 8,
    shadowColor: 'rgba(139, 92, 246, 0.4)',
    icon: '💎',
    hoverFillColor: '#9d75f8',
    shape: 'rect',
    width: 52,
    height: 52,
    content: { text: '💎', fontSize: 0.45, fontFamily: 'sans-serif', color: '#ffffff', rotation: 0 },
  },
];
