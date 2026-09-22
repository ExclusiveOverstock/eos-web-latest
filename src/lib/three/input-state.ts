/**
 * Movement/look input, read once per frame inside useFrame. Deliberately
 * NOT React state — updating this on every touchmove/mousemove would
 * trigger a re-render per event. Instead, UI writes into these mutable
 * fields directly, and PlayerControls reads + resets them each frame.
 */
export type InputState = {
  forward: number; // -1..1, from WASD or the joystick's vertical axis
  strafe: number; // -1..1, from WASD or the joystick's horizontal axis
  lookDeltaX: number; // accumulated look-drag since the last frame
  lookDeltaY: number;
  keys: Set<string>;
};

export function createInputState(): InputState {
  return {
    forward: 0,
    strafe: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    keys: new Set(),
  };
}
