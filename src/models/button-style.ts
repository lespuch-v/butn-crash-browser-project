export interface ButtonStyle {
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadowBlur: number;
  shadowColor: string;
  icon: string; // emoji or text drawn on top
  hoverFillColor: string;
}

/** Default button style palette */
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
  },
];

export function randomStyle(): ButtonStyle {
  return { ...DEFAULT_STYLES[Math.floor(Math.random() * DEFAULT_STYLES.length)] };
}
