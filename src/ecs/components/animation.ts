/** Active animation on an entity */
export interface AnimationComponent {
  type: AnimationType;
  elapsed: number; // ms
  duration: number; // ms
  /** 0 → 1 normalized progress */
  progress: number;
}

export enum AnimationType {
  SpawnPop = 'spawn_pop', // scale from 0 → 1 with overshoot
  ClickShrink = 'click_shrink', // scale to 0.9 and back
  FadeOut = 'fade_out', // opacity 1 → 0
  SlideIn = 'slide_in', // position tween from direction
}

export function createAnimation(type: AnimationType, durationMs: number): AnimationComponent {
  return {
    type,
    elapsed: 0,
    duration: durationMs,
    progress: 0,
  };
}
