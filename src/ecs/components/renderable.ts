import type { ButtonStyle } from '@models/button-style';

/** How this entity should be drawn */
export interface RenderableComponent {
  style: ButtonStyle;
  scale: number; // 1 = normal, used for animations
  opacity: number; // 0-1
  rotation: number; // radians, for spin effects
  visible: boolean;
}

export function createDefaultRenderable(style: ButtonStyle): RenderableComponent {
  return {
    style,
    scale: 1,
    opacity: 1,
    rotation: 0,
    visible: true,
  };
}
