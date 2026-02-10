// Shape types
export type ButtonShape =
  | 'rect'
  | 'circle'
  | 'pill'
  | 'diamond'
  | 'hexagon'
  | 'star'
  | 'cross'
  | 'triangle';

// Span computation
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

// Content
export interface ButtonContent {
  text: string;
  fontSize: number; // relative to min(width, height)
  fontFamily: string;
  color: string;
  rotation: number; // radians
}

// Style
export interface ButtonStyle {
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadowBlur: number;
  shadowColor: string;
  icon: string; // legacy fallback for older render paths
  hoverFillColor: string;
  shape: ButtonShape;
  width: number;
  height: number;
  content: ButtonContent;
}

interface WeightedShape {
  shape: ButtonShape;
  weight: number;
}

type SizeProfile = 'chip' | 'standard' | 'cta' | 'hero' | 'icon';
type RadiusMode = 'sharp' | 'soft' | 'pill' | 'round';

interface StylePalette {
  fillColor: string;
  borderColor: string;
  hoverFillColor: string;
  textColor: string;
  shadowColor: string;
  borderWidth: number;
  shadowBlur: number;
}

interface ButtonVariant {
  id: string;
  weight: number;
  sizeProfile: SizeProfile;
  radiusMode: RadiusMode;
  shapes: readonly WeightedShape[];
  palettes: readonly StylePalette[];
  labels: readonly string[];
  shortLabels: readonly string[];
  iconChance: number;
  rotationChance: number;
}

const FONT_FAMILIES = [
  '"Segoe UI", sans-serif',
  'Arial, sans-serif',
  'Tahoma, sans-serif',
  'Verdana, sans-serif',
];

const ICON_LABELS = ['+', '-', 'x', '?', '!', 'i', '>', '<', '=', '...'];
const SHORT_LABELS = ['OK', 'Go', 'Yes', 'No', 'Edit', 'Send', 'Done', 'More'];

const PRODUCT_LABELS = [
  'Save',
  'Save Draft',
  'Publish',
  'Apply',
  'Close',
  'Continue',
  'Reset',
  'Retry',
  'Settings',
  'Update',
  'Search',
  'Refresh',
  'Enable',
  'Disable',
  'Export',
  'Import',
  'Duplicate',
  'Manage',
];

const CTA_LABELS = [
  'Get Started',
  'Try It Free',
  'Start Trial',
  'Watch Demo',
  'Book a Call',
  'Join Waitlist',
  'Learn More',
  'See Pricing',
  'Open Dashboard',
  'Create Account',
  'Continue',
  'Start Now',
];

const COMMERCE_LABELS = [
  'Add to Cart',
  'Buy Now',
  'Checkout',
  'Claim Offer',
  'View Deal',
  'Preorder',
  'Subscribe',
  'Upgrade Plan',
  'Get Discount',
  'View Details',
  'Reserve Spot',
];

const SOCIAL_LABELS = [
  'Share Post',
  'Follow',
  'Connect',
  'Send Message',
  'Invite',
  'Join Room',
  'Start Chat',
  'Add Friend',
  'View Profile',
];

const DANGER_LABELS = ['Delete', 'Remove', 'Discard', 'Stop', 'Sign Out', 'Archive', 'Clear Data', 'Block'];

const RETRO_TEXT = ['Do not touch', 'Nope', 'Hands off', 'Not this one', 'Nice try', 'Absolutely not', 'BOOM'];

const SOLID_PALETTES: readonly StylePalette[] = [
  {
    fillColor: '#2563eb',
    borderColor: '#1d4ed8',
    hoverFillColor: '#1e40af',
    textColor: '#ffffff',
    shadowColor: 'rgba(37, 99, 235, 0.35)',
    borderWidth: 1.5,
    shadowBlur: 10,
  },
  {
    fillColor: '#16a34a',
    borderColor: '#15803d',
    hoverFillColor: '#166534',
    textColor: '#ffffff',
    shadowColor: 'rgba(22, 163, 74, 0.35)',
    borderWidth: 1.5,
    shadowBlur: 10,
  },
  {
    fillColor: '#0f766e',
    borderColor: '#115e59',
    hoverFillColor: '#134e4a',
    textColor: '#f0fdfa',
    shadowColor: 'rgba(15, 118, 110, 0.34)',
    borderWidth: 1.5,
    shadowBlur: 10,
  },
];

const OUTLINE_PALETTES: readonly StylePalette[] = [
  {
    fillColor: '#ffffff',
    borderColor: '#94a3b8',
    hoverFillColor: '#f1f5f9',
    textColor: '#1e293b',
    shadowColor: 'rgba(100, 116, 139, 0.2)',
    borderWidth: 2,
    shadowBlur: 4,
  },
  {
    fillColor: '#f8fafc',
    borderColor: '#64748b',
    hoverFillColor: '#e2e8f0',
    textColor: '#0f172a',
    shadowColor: 'rgba(51, 65, 85, 0.2)',
    borderWidth: 2,
    shadowBlur: 4,
  },
];

const GLASS_PALETTES: readonly StylePalette[] = [
  {
    fillColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: 'rgba(148, 163, 184, 0.6)',
    hoverFillColor: 'rgba(15, 23, 42, 0.85)',
    textColor: '#f8fafc',
    shadowColor: 'rgba(15, 23, 42, 0.44)',
    borderWidth: 1.5,
    shadowBlur: 12,
  },
  {
    fillColor: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(148, 163, 184, 0.55)',
    hoverFillColor: 'rgba(15, 23, 42, 0.82)',
    textColor: '#e2e8f0',
    shadowColor: 'rgba(15, 23, 42, 0.42)',
    borderWidth: 1.5,
    shadowBlur: 12,
  },
];

const SOFT_PALETTES: readonly StylePalette[] = [
  {
    fillColor: '#e2e8f0',
    borderColor: '#cbd5e1',
    hoverFillColor: '#dbe6f4',
    textColor: '#0f172a',
    shadowColor: 'rgba(71, 85, 105, 0.18)',
    borderWidth: 1.5,
    shadowBlur: 4,
  },
  {
    fillColor: '#e0f2fe',
    borderColor: '#bae6fd',
    hoverFillColor: '#bae6fd',
    textColor: '#0c4a6e',
    shadowColor: 'rgba(12, 74, 110, 0.2)',
    borderWidth: 1.5,
    shadowBlur: 4,
  },
  {
    fillColor: '#dcfce7',
    borderColor: '#bbf7d0',
    hoverFillColor: '#bbf7d0',
    textColor: '#14532d',
    shadowColor: 'rgba(20, 83, 45, 0.18)',
    borderWidth: 1.5,
    shadowBlur: 4,
  },
];

const NEON_PALETTES: readonly StylePalette[] = [
  {
    fillColor: '#0f172a',
    borderColor: '#22d3ee',
    hoverFillColor: '#111827',
    textColor: '#67e8f9',
    shadowColor: 'rgba(34, 211, 238, 0.5)',
    borderWidth: 2,
    shadowBlur: 14,
  },
  {
    fillColor: '#111827',
    borderColor: '#4ade80',
    hoverFillColor: '#0f172a',
    textColor: '#86efac',
    shadowColor: 'rgba(74, 222, 128, 0.48)',
    borderWidth: 2,
    shadowBlur: 14,
  },
  {
    fillColor: '#172554',
    borderColor: '#60a5fa',
    hoverFillColor: '#1e3a8a',
    textColor: '#bfdbfe',
    shadowColor: 'rgba(96, 165, 250, 0.5)',
    borderWidth: 2,
    shadowBlur: 14,
  },
];

const DANGER_PALETTES: readonly StylePalette[] = [
  {
    fillColor: '#dc2626',
    borderColor: '#b91c1c',
    hoverFillColor: '#991b1b',
    textColor: '#ffffff',
    shadowColor: 'rgba(220, 38, 38, 0.32)',
    borderWidth: 1.5,
    shadowBlur: 9,
  },
  {
    fillColor: '#fef2f2',
    borderColor: '#f87171',
    hoverFillColor: '#fee2e2',
    textColor: '#991b1b',
    shadowColor: 'rgba(153, 27, 27, 0.22)',
    borderWidth: 2,
    shadowBlur: 5,
  },
];

const VARIANTS: readonly ButtonVariant[] = [
  {
    id: 'solid',
    weight: 23,
    sizeProfile: 'standard',
    radiusMode: 'soft',
    shapes: [
      { shape: 'rect', weight: 68 },
      { shape: 'pill', weight: 28 },
      { shape: 'circle', weight: 4 },
    ],
    palettes: SOLID_PALETTES,
    labels: PRODUCT_LABELS,
    shortLabels: SHORT_LABELS,
    iconChance: 0.08,
    rotationChance: 0.02,
  },
  {
    id: 'outline',
    weight: 17,
    sizeProfile: 'standard',
    radiusMode: 'soft',
    shapes: [
      { shape: 'rect', weight: 70 },
      { shape: 'pill', weight: 26 },
      { shape: 'circle', weight: 4 },
    ],
    palettes: OUTLINE_PALETTES,
    labels: [...PRODUCT_LABELS, ...SOCIAL_LABELS],
    shortLabels: SHORT_LABELS,
    iconChance: 0.1,
    rotationChance: 0.02,
  },
  {
    id: 'soft-chip',
    weight: 13,
    sizeProfile: 'chip',
    radiusMode: 'pill',
    shapes: [
      { shape: 'pill', weight: 62 },
      { shape: 'rect', weight: 34 },
      { shape: 'circle', weight: 4 },
    ],
    palettes: SOFT_PALETTES,
    labels: [...SOCIAL_LABELS, ...PRODUCT_LABELS],
    shortLabels: SHORT_LABELS,
    iconChance: 0.12,
    rotationChance: 0.01,
  },
  {
    id: 'cta',
    weight: 14,
    sizeProfile: 'cta',
    radiusMode: 'pill',
    shapes: [
      { shape: 'pill', weight: 56 },
      { shape: 'rect', weight: 40 },
      { shape: 'circle', weight: 4 },
    ],
    palettes: SOLID_PALETTES,
    labels: [...CTA_LABELS, ...COMMERCE_LABELS],
    shortLabels: ['Start', 'Join', 'Buy', 'Demo', 'Try', 'Open'],
    iconChance: 0.08,
    rotationChance: 0.02,
  },
  {
    id: 'glass',
    weight: 12,
    sizeProfile: 'standard',
    radiusMode: 'soft',
    shapes: [
      { shape: 'rect', weight: 60 },
      { shape: 'pill', weight: 32 },
      { shape: 'circle', weight: 8 },
    ],
    palettes: GLASS_PALETTES,
    labels: [...CTA_LABELS, ...PRODUCT_LABELS],
    shortLabels: ['Open', 'View', 'Next', 'More', 'Play'],
    iconChance: 0.13,
    rotationChance: 0.03,
  },
  {
    id: 'neon',
    weight: 8,
    sizeProfile: 'cta',
    radiusMode: 'round',
    shapes: [
      { shape: 'rect', weight: 50 },
      { shape: 'pill', weight: 35 },
      { shape: 'circle', weight: 15 },
    ],
    palettes: NEON_PALETTES,
    labels: [...CTA_LABELS, ...SOCIAL_LABELS],
    shortLabels: ['Live', 'Join', 'Play', 'Demo', 'Watch'],
    iconChance: 0.18,
    rotationChance: 0.04,
  },
  {
    id: 'danger',
    weight: 7,
    sizeProfile: 'standard',
    radiusMode: 'soft',
    shapes: [
      { shape: 'rect', weight: 72 },
      { shape: 'pill', weight: 24 },
      { shape: 'circle', weight: 4 },
    ],
    palettes: DANGER_PALETTES,
    labels: DANGER_LABELS,
    shortLabels: ['Stop', 'Quit', 'Exit', 'Block', 'Remove'],
    iconChance: 0.09,
    rotationChance: 0.01,
  },
  {
    id: 'icon-utility',
    weight: 4,
    sizeProfile: 'icon',
    radiusMode: 'round',
    shapes: [
      { shape: 'circle', weight: 52 },
      { shape: 'rect', weight: 34 },
      { shape: 'pill', weight: 14 },
    ],
    palettes: [...OUTLINE_PALETTES, ...GLASS_PALETTES],
    labels: ['Menu', 'Help', 'Info', 'Tools', 'More'],
    shortLabels: ['OK', 'Go', 'New', 'Add', 'Edit'],
    iconChance: 0.5,
    rotationChance: 0.05,
  },
  {
    id: 'hero',
    weight: 1.5,
    sizeProfile: 'hero',
    radiusMode: 'pill',
    shapes: [
      { shape: 'pill', weight: 68 },
      { shape: 'rect', weight: 30 },
      { shape: 'circle', weight: 2 },
    ],
    palettes: [...SOLID_PALETTES, ...NEON_PALETTES],
    labels: CTA_LABELS,
    shortLabels: ['Start', 'Try', 'Join'],
    iconChance: 0.06,
    rotationChance: 0.01,
  },
  {
    id: 'experimental',
    weight: 0.5,
    sizeProfile: 'chip',
    radiusMode: 'round',
    shapes: [
      { shape: 'rect', weight: 42 },
      { shape: 'pill', weight: 32 },
      { shape: 'diamond', weight: 9 },
      { shape: 'hexagon', weight: 8 },
      { shape: 'triangle', weight: 6 },
      { shape: 'circle', weight: 3 },
    ],
    palettes: [...SOFT_PALETTES, ...NEON_PALETTES],
    labels: ['Beta', 'Labs', 'Try', 'Preview', 'New', 'Explore'],
    shortLabels: ['Try', 'New', 'Go', 'Beta'],
    iconChance: 0.2,
    rotationChance: 0.06,
  },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function weightedPick<T extends { weight: number }>(items: readonly T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function pickShape(shapes: readonly WeightedShape[]): ButtonShape {
  return weightedPick(shapes).shape;
}

function pickVariant(): ButtonVariant {
  return weightedPick(VARIANTS);
}

function profileHeight(profile: SizeProfile): number {
  switch (profile) {
    case 'chip':
      return rand(28, 34);
    case 'standard':
      return rand(34, 44);
    case 'cta':
      return rand(38, 50);
    case 'hero':
      return rand(44, 56);
    case 'icon':
      return rand(34, 46);
  }
}

function profileWidthBounds(profile: SizeProfile): { min: number; max: number } {
  switch (profile) {
    case 'chip':
      return { min: 52, max: 120 };
    case 'standard':
      return { min: 64, max: 136 };
    case 'cta':
      return { min: 84, max: 156 };
    case 'hero':
      return { min: 110, max: 188 };
    case 'icon':
      return { min: 36, max: 92 };
  }
}

function decorateLabel(label: string, variantId: string): string {
  if ((variantId === 'cta' || variantId === 'hero') && Math.random() < 0.14) {
    return `${label} ->`;
  }
  if (variantId === 'neon' && Math.random() < 0.12) {
    return `[${label}]`;
  }
  return label;
}

function pickLabel(variant: ButtonVariant, shape: ButtonShape): string {
  if (shape === 'circle') {
    return Math.random() < 0.72 ? pick(ICON_LABELS) : pick(variant.shortLabels);
  }

  const compactMode = variant.sizeProfile === 'chip' || variant.sizeProfile === 'icon';
  const roll = Math.random();

  if (roll < variant.iconChance) return pick(ICON_LABELS);
  if (compactMode && roll < variant.iconChance + 0.52) return pick(variant.shortLabels);
  if (!compactMode && roll < variant.iconChance + 0.24) return pick(variant.shortLabels);

  return decorateLabel(pick(variant.labels), variant.id);
}

function randomDimensions(shape: ButtonShape, profile: SizeProfile, label: string): { width: number; height: number } {
  const h = profileHeight(profile);
  const bounds = profileWidthBounds(profile);

  if (shape === 'circle') {
    const d = clamp(rand(h - 2, h + 12), bounds.min, Math.min(bounds.max, 64));
    return { width: d, height: d };
  }

  if (shape === 'diamond' || shape === 'hexagon' || shape === 'star' || shape === 'cross' || shape === 'triangle') {
    const s = rand(36, 62);
    return { width: s, height: s };
  }

  const padding = rand(22, profile === 'hero' ? 56 : 44);
  const charUnit = label.length <= 3 ? 8 : 7.6;
  const baseWidth = label.length * charUnit + padding;
  const maybeExtended = Math.random() < 0.2 ? baseWidth + rand(8, 24) : baseWidth;
  const w = clamp(maybeExtended, bounds.min, bounds.max);
  return { width: w, height: h };
}

function borderRadiusForShape(
  shape: ButtonShape,
  radiusMode: RadiusMode,
  width: number,
  height: number,
): number {
  if (shape === 'circle' || shape === 'pill') {
    return Math.floor(Math.min(width, height) / 2);
  }

  switch (radiusMode) {
    case 'sharp':
      return randInt(4, 8);
    case 'soft':
      return randInt(8, 14);
    case 'pill':
      return randInt(12, 18);
    case 'round':
      return randInt(10, 16);
  }
}

function randomPalette(variant: ButtonVariant): StylePalette {
  return pick(variant.palettes);
}

function contentFontSize(label: string): number {
  if (label.length >= 14) return rand(0.22, 0.27);
  if (label.length >= 11) return rand(0.25, 0.31);
  if (label.length >= 8) return rand(0.29, 0.35);
  if (label.length >= 6) return rand(0.32, 0.39);
  if (label.length >= 4) return rand(0.35, 0.43);
  return rand(0.39, 0.5);
}

function randomContent(
  variant: ButtonVariant,
  shape: ButtonShape,
  width: number,
  height: number,
  textColor: string,
  preferredLabel?: string,
): ButtonContent {
  const label = preferredLabel ?? pickLabel(variant, shape);
  const compact = shape === 'circle' || width < 60 || height < 34;

  let text = label;
  if (compact && text.length > 6) {
    text = pick([...variant.shortLabels, ...SHORT_LABELS, ...ICON_LABELS]);
  }

  return {
    text,
    fontSize: contentFontSize(text),
    fontFamily: pick(FONT_FAMILIES),
    color: textColor,
    rotation: Math.random() < 1 - variant.rotationChance ? 0 : rand(-0.06, 0.06),
  };
}

// Public style generator used by spawning logic.
export function generateChaosStyle(): ButtonStyle {
  const variant = pickVariant();
  const shape = pickShape(variant.shapes);

  // Pick label once so dimensions can adapt to likely text length.
  const provisionalLabel = pickLabel(variant, shape);
  const { width, height } = randomDimensions(shape, variant.sizeProfile, provisionalLabel);

  const palette = randomPalette(variant);
  const content = randomContent(variant, shape, width, height, palette.textColor, provisionalLabel);

  const borderWidth = Math.max(1, palette.borderWidth + rand(-0.2, 0.8));
  const shadowBlur = Math.max(0, palette.shadowBlur + rand(-2, 3));

  return {
    fillColor: palette.fillColor,
    borderColor: palette.borderColor,
    borderWidth,
    borderRadius: borderRadiusForShape(shape, variant.radiusMode, width, height),
    shadowBlur,
    shadowColor: palette.shadowColor,
    icon: content.text,
    hoverFillColor: palette.hoverFillColor,
    shape,
    width,
    height,
    content,
  };
}

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
      text: pick(RETRO_TEXT),
      fontSize: 0.35,
      fontFamily: 'serif',
      color: '#111111',
      rotation: 0,
    },
  };
}

export const DEFAULT_STYLES: ButtonStyle[] = [
  {
    fillColor: '#2563eb',
    borderColor: '#1d4ed8',
    borderWidth: 2,
    borderRadius: 12,
    shadowBlur: 10,
    shadowColor: 'rgba(37, 99, 235, 0.35)',
    icon: 'Get Started',
    hoverFillColor: '#1e40af',
    shape: 'pill',
    width: 138,
    height: 44,
    content: {
      text: 'Get Started',
      fontSize: 0.3,
      fontFamily: '"Segoe UI", sans-serif',
      color: '#ffffff',
      rotation: 0,
    },
  },
  {
    fillColor: '#ffffff',
    borderColor: '#94a3b8',
    borderWidth: 2,
    borderRadius: 10,
    shadowBlur: 4,
    shadowColor: 'rgba(100, 116, 139, 0.2)',
    icon: 'Settings',
    hoverFillColor: '#f1f5f9',
    shape: 'rect',
    width: 112,
    height: 40,
    content: {
      text: 'Settings',
      fontSize: 0.32,
      fontFamily: '"Segoe UI", sans-serif',
      color: '#1e293b',
      rotation: 0,
    },
  },
  {
    fillColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: 'rgba(148, 163, 184, 0.6)',
    borderWidth: 1.6,
    borderRadius: 12,
    shadowBlur: 12,
    shadowColor: 'rgba(15, 23, 42, 0.44)',
    icon: 'Open Dashboard',
    hoverFillColor: 'rgba(15, 23, 42, 0.85)',
    shape: 'rect',
    width: 146,
    height: 44,
    content: {
      text: 'Open Dashboard',
      fontSize: 0.26,
      fontFamily: 'Arial, sans-serif',
      color: '#f8fafc',
      rotation: 0,
    },
  },
  {
    fillColor: '#0f172a',
    borderColor: '#22d3ee',
    borderWidth: 2,
    borderRadius: 14,
    shadowBlur: 14,
    shadowColor: 'rgba(34, 211, 238, 0.5)',
    icon: 'Watch Demo',
    hoverFillColor: '#111827',
    shape: 'pill',
    width: 128,
    height: 42,
    content: {
      text: 'Watch Demo',
      fontSize: 0.31,
      fontFamily: 'Verdana, sans-serif',
      color: '#67e8f9',
      rotation: 0,
    },
  },
  {
    fillColor: '#dc2626',
    borderColor: '#b91c1c',
    borderWidth: 2,
    borderRadius: 10,
    shadowBlur: 9,
    shadowColor: 'rgba(220, 38, 38, 0.32)',
    icon: 'Delete',
    hoverFillColor: '#991b1b',
    shape: 'rect',
    width: 104,
    height: 40,
    content: {
      text: 'Delete',
      fontSize: 0.34,
      fontFamily: 'Tahoma, sans-serif',
      color: '#ffffff',
      rotation: 0,
    },
  },
];
