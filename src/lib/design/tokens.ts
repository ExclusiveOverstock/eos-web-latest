/**
 * EOS design tokens, in TypeScript.
 *
 * globals.css owns the CSS side of the system. This module exists because
 * two consumers cannot read CSS custom properties: Three.js materials and
 * lights (which need numbers at construction time, before paint) and Framer
 * Motion transition objects. Rather than let either invent its own values,
 * both import from here.
 *
 * If a colour changes, it changes in globals.css AND here. There is no
 * runtime bridge on purpose — reading computed styles during the first
 * frame of a WebGL scene is exactly the kind of layout thrash that makes a
 * cinematic opening stutter.
 */

/* ------------------------------------------------------------------ */
/* Colour                                                              */
/* ------------------------------------------------------------------ */

export const COLOR = {
  void: "#0a0909",
  charcoal: "#191717",
  charcoal2: "#211e1d",
  bone: "#f1e9dc",
  taupe: "#9c9185",
  oxblood: "#641f2a",
  oxbloodDeep: "#3a1118",
  brass: "#8b8065",
  hairline: "#242120",
  hairlineStrong: "#38342f",
} as const;

/* ------------------------------------------------------------------ */
/* Motion                                                             */
/* ------------------------------------------------------------------ */

/** Expo-out, as a Framer Motion cubic-bezier array. */
export const EASE_EOS = [0.22, 1, 0.36, 1] as const;
export const EASE_EOS_INOUT = [0.65, 0, 0.35, 1] as const;

export const DURATION = {
  fast: 0.24,
  base: 0.6,
  slow: 1.1,
  cinematic: 2.2,
} as const;

/** The house transition. Used anywhere a reveal has no reason to differ. */
export const TRANSITION = {
  duration: DURATION.base,
  ease: EASE_EOS,
} as const;

/* ------------------------------------------------------------------ */
/* 3D                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Device quality tiers.
 *
 * Resolved once per session from hardware hints rather than per frame, and
 * deliberately conservative: a low-end phone rendering a calm, slightly
 * softer scene at a steady 60fps sells the brand far better than the same
 * phone rendering the full lighting rig at 22fps.
 */
export type QualityTier = "low" | "medium" | "high";

export const QUALITY = {
  low: {
    /** Device pixel ratio clamp. Retina at 1.25 still reads as sharp. */
    dpr: [1, 1.25] as [number, number],
    shadows: false,
    shadowMapSize: 512,
    /** Contact-shadow and rim lights are the first things to go. */
    accentLights: false,
    envResolution: 64,
    antialias: false,
  },
  medium: {
    dpr: [1, 1.6] as [number, number],
    shadows: true,
    shadowMapSize: 1024,
    accentLights: true,
    envResolution: 128,
    antialias: true,
  },
  high: {
    dpr: [1, 2] as [number, number],
    shadows: true,
    shadowMapSize: 2048,
    accentLights: true,
    envResolution: 256,
    antialias: true,
  },
} as const satisfies Record<QualityTier, unknown>;

/**
 * The garment's lighting environment.
 *
 * A key/fill/rim triangle plus a warm bounce. Values are tuned against
 * void black: the garment should emerge from darkness with a readable
 * silhouette and one bright edge, never sit in an evenly lit product-shot
 * box. Colours are warm-neutral rather than white so cloth reads as cloth.
 */
export const GARMENT_LIGHTING = {
  /**
   * Warm, and higher than a dramatic rig would normally allow.
   *
   * With nothing in the scene but the garment there is no bounce light — no
   * walls close enough, no floor bright enough — so the shadow side receives
   * literally nothing and goes to pure black. Ambient is standing in for the
   * global illumination that is not being computed, which is why it carries
   * more weight here than it would in a room.
   */
  ambient: { color: "#37312b", intensity: 1.5 },
  key: {
    color: "#fff2e2",
    // Spot lights fall off with distance squared; at ~5m from the subject
    // this resolves to a moderate exposure at the cloth, not a blowout.
    intensity: 95,
    position: [2.6, 3.8, 3.0] as [number, number, number],
    angle: 0.6,
    penumbra: 0.9,
  },
  fill: {
    color: "#8fa2bd",
    intensity: 1.1,
    position: [-3.2, 1.4, 1.6] as [number, number, number],
  },
  rim: {
    color: "#ffd9c0",
    intensity: 26,
    position: [-1.3, 2.0, -3.2] as [number, number, number],
  },
  /** Faint oxblood bounce off the floor. The only accent in the scene. */
  bounce: {
    color: "#7a2733",
    intensity: 5,
    position: [0, -1.5, 1.4] as [number, number, number],
  },
} as const;
