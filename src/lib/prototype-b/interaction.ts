/**
 * Prototype B — interaction state.
 *
 * One mutable object, written by DOM event handlers and read once per frame
 * inside the render loop. Nothing here lives in React state: pointer moves
 * and scroll fire far faster than a component should re-render, and routing
 * them through `useState` is what turns a cinematic camera move into a
 * stutter. The object's identity never changes, so passing it down costs
 * nothing and it can never fall out of step with the frame it is read on.
 */

export type GarmentInput = {
  /** Page scroll, 0 at the top to 1 at the end of the story. */
  progress: number;

  /** Accumulated drag, in radians. Yaw is unbounded; pitch is clamped. */
  dragYaw: number;
  dragPitch: number;
  /** Carries the throw after release, damped to rest. */
  spinVelocity: number;
  /** True while a pointer is down, so idle motion yields to the hand. */
  dragging: boolean;

  /** Extra dolly from wheel or pinch, 0 (framed) to 1 (close). */
  zoom: number;

  /** Normalised pointer, -1 to 1, for a few degrees of parallax. */
  pointerX: number;
  pointerY: number;
  hovering: boolean;

  /** Set when the visitor has turned the piece, to retire the hint. */
  hasInteracted: boolean;
};

export function createGarmentInput(): GarmentInput {
  return {
    progress: 0,
    dragYaw: 0,
    dragPitch: 0,
    spinVelocity: 0,
    dragging: false,
    zoom: 0,
    pointerX: 0,
    pointerY: 0,
    hovering: false,
    hasInteracted: false,
  };
}

/** Keeps the garment from being tipped past a flattering angle. */
export const PITCH_LIMIT = 0.34;

export const DRAG_SENSITIVITY = 0.0062;
/** Touch gets slightly less, so a scroll-adjacent swipe doesn't spin it. */
export const TOUCH_SENSITIVITY = 0.0044;

export function clampPitch(value: number) {
  return Math.min(PITCH_LIMIT, Math.max(-PITCH_LIMIT, value));
}

/* ------------------------------------------------------------------ */
/* Keyframes                                                          */
/* ------------------------------------------------------------------ */

/**
 * A value that changes at named points along the scroll, interpolated
 * smoothly between them.
 *
 * The scroll story has seven beats and the camera has to be somewhere
 * specific at each one. Expressing that as a keyframe track keeps the
 * choreography readable in one place, instead of scattered across a chain of
 * conditionals that nobody can picture as a camera move.
 */
export type Track = [at: number, value: number][];

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function sampleTrack(track: Track, at: number): number {
  if (at <= track[0][0]) return track[0][1];
  const last = track[track.length - 1];
  if (at >= last[0]) return last[1];

  for (let i = 0; i < track.length - 1; i += 1) {
    const [a, av] = track[i];
    const [b, bv] = track[i + 1];
    if (at >= a && at <= b) {
      const t = b === a ? 0 : (at - a) / (b - a);
      return av + (bv - av) * smoothstep(t);
    }
  }
  return last[1];
}

/**
 * The camera choreography, as distance/height/orbit tracks over the seven
 * sections. Read together, these are the shot list:
 *
 *   .00 REVEAL      wide, slightly low, the piece small in a lot of void
 *   .14 PRESENCE    settles to a full-length framing, gentle orbit begins
 *   .30 INSPECTION  pushes in on the hood and shoulder, well off-axis
 *   .46 PHILOSOPHY  pulls back and lets the garment sink, type takes over
 *   .60 LOT         returns to a centred, formal, catalogue framing
 *   .78 PRODUCT     three-quarter, held to one side for the spec column
 *   .94 PURCHASE    square to camera, close, the piece as the last word
 */
export const CAMERA = {
  /** Metres from the garment. */
  distance: [
    [0.0, 3.5],
    [0.14, 2.55],
    [0.3, 1.42],
    [0.46, 3.1],
    [0.6, 2.5],
    [0.78, 2.25],
    [0.94, 2.0],
  ] as Track,
  /** Camera height relative to the garment's centre. */
  height: [
    [0.0, -0.18],
    [0.14, 0.06],
    [0.3, 0.36],
    [0.46, 0.1],
    [0.6, 0.04],
    [0.78, 0.02],
    [0.94, 0.0],
  ] as Track,
  /** Where the camera looks, as a height on the garment. */
  target: [
    [0.0, 0.02],
    [0.14, 0.0],
    [0.3, 0.3],
    [0.46, -0.04],
    [0.6, 0.0],
    [0.78, 0.0],
    [0.94, 0.0],
  ] as Track,
  /** Baseline orbit in radians, before any drag is added. */
  orbit: [
    [0.0, -0.16],
    [0.14, 0.1],
    [0.3, 0.72],
    [0.46, 0.26],
    [0.6, -0.05],
    [0.78, 0.5],
    [0.94, 0.06],
  ] as Track,
  /** Horizontal offset of the garment in frame, to clear the type column. */
  offsetX: [
    [0.0, 0.0],
    [0.14, 0.0],
    [0.3, -0.24],
    [0.46, 0.3],
    [0.6, 0.0],
    [0.78, -0.42],
    [0.94, 0.0],
  ] as Track,
} as const;

/**
 * Exposure across the story. The reveal is underlit on purpose — the piece
 * emerges from the dark rather than being presented in it — and the
 * philosophy beat dims again so the type is unambiguously the subject.
 */
export const EXPOSURE: Track = [
  [0.0, 0.9],
  [0.12, 1.35],
  [0.3, 1.5],
  [0.44, 0.72],
  [0.56, 1.35],
  [0.78, 1.35],
  [1.0, 1.3],
];
