/** Interactivity state for clickable entities */
export interface InteractiveComponent {
  clickable: boolean;
  hovered: boolean;
  /** Timestamp of last click (for cooldown) */
  lastClickTime: number;
}

export function createDefaultInteractive(): InteractiveComponent {
  return {
    clickable: true,
    hovered: false,
    lastClickTime: 0,
  };
}
