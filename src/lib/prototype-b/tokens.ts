/**
 * Prototype B — design tokens.
 *
 * Deliberately its own module rather than an import from `lib/design/tokens`.
 * B shares the brand palette because the palette is the brand, but it shares
 * nothing else: its own type scale, its own motion curves, its own lighting
 * rig. Pointing both experiences at one token file is how two prototypes
 * quietly converge into one, which would defeat the point of running them
 * side by side.
 *
 * The CSS half lives in `app/(prototype-b)/prototype-b.css`. Values are
 * duplicated across the two on purpose: Three.js needs numbers at material
 * construction time, before first paint, and reading custom properties off
 * the document at that moment is exactly the layout thrash that makes a
 * cinematic opening stutter.
 */

/* ------------------------------------------------------------------ */
/* Colour — fixed by the brand, ~60/25/10/5 void/bone/charcoal/oxblood */
/* ------------------------------------------------------------------ */

export const B_COLOR = {
  void: "#0a0909",
  charcoal: "#191717",
  bone: "#f1e9dc",
  taupe: "#9c9185",
  oxblood: "#641f2a",
  oxbloodDeep: "#3a1118",
  brass: "#8b8065",
} as const;

/* ------------------------------------------------------------------ */
/* Motion                                                             */
/* ------------------------------------------------------------------ */

/**
 * A long, weighted settle. Everything in B decelerates for most of its
 * duration — a camera coming to rest, a rule drawing itself. Nothing
 * overshoots: there is no spring anywhere in this prototype.
 */
export const B_EASE = [0.16, 1, 0.3, 1] as const;
export const B_EASE_INOUT = [0.76, 0, 0.24, 1] as const;

export const B_DURATION = {
  fast: 0.28,
  base: 0.72,
  slow: 1.4,
} as const;

/* ------------------------------------------------------------------ */
/* Quality tiers                                                      */
/* ------------------------------------------------------------------ */

export type BQuality = "low" | "medium" | "high";

/**
 * Resolved once per session from hardware hints. The scene is one object
 * against black, so the tiers trade shadow and surface fidelity rather than
 * scene complexity — there is nothing to cull.
 */
export const B_QUALITY = {
  low: {
    dpr: [1, 1.2] as [number, number],
    shadows: false,
    shadowMapSize: 512,
    /** Sheen is a second specular lobe; the first thing to drop. */
    sheen: false,
    segments: { around: 64, along: 48 },
    envResolution: 64,
    antialias: false,
  },
  medium: {
    dpr: [1, 1.5] as [number, number],
    shadows: true,
    shadowMapSize: 1024,
    sheen: true,
    segments: { around: 96, along: 72 },
    envResolution: 128,
    antialias: true,
  },
  high: {
    dpr: [1, 1.85] as [number, number],
    shadows: true,
    shadowMapSize: 2048,
    sheen: true,
    segments: { around: 128, along: 96 },
    envResolution: 256,
    antialias: true,
  },
} as const satisfies Record<BQuality, unknown>;

export function resolveQuality(): BQuality {
  if (typeof window === "undefined") return "medium";

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.matchMedia("(max-width: 820px)").matches;

  if (coarse && narrow && (cores <= 4 || memory <= 4)) return "low";
  if (cores >= 8 && memory >= 8 && !coarse) return "high";
  return "medium";
}

/* ------------------------------------------------------------------ */
/* Lighting                                                           */
/* ------------------------------------------------------------------ */

/**
 * A fashion-photography rig, not a Three.js starter setup.
 *
 * One hard key high and to the camera's right carves the silhouette and
 * rakes across the folds. A cool fill at a quarter of its strength keeps the
 * shadow side from going to pure black without flattening it — cool against
 * warm is what stops cloth reading as grey plastic. A tight rim behind and
 * left separates the garment from the void, and is the single most important
 * light here: against a black ground, the edge is the subject.
 *
 * Ambient is doing the job of the bounce light that a real studio gets from
 * its walls. There are no walls, so it is carrying global illumination that
 * is not being computed — hence more of it than a dramatic rig would allow.
 */
export const B_LIGHTING = {
  ambient: { color: "#2b2b2e", intensity: 1.55 },
  key: {
    color: "#fff6ee",
    intensity: 165,
    position: [3.1, 4.4, 3.4] as [number, number, number],
    angle: 0.55,
    penumbra: 0.95,
  },
  fill: {
    color: "#8ea4c4",
    intensity: 1.05,
    position: [-3.6, 1.2, 2.2] as [number, number, number],
  },
  rim: {
    color: "#ffe8d8",
    intensity: 58,
    position: [-2.0, 2.6, -3.6] as [number, number, number],
  },
  /** The only accent in the scene: a low oxblood kick off the floor plane. */
  kick: {
    color: "#7c2b36",
    intensity: 7,
    position: [0.6, -1.8, 1.2] as [number, number, number],
  },
} as const;

/* ------------------------------------------------------------------ */
/* The lot on show                                                    */
/* ------------------------------------------------------------------ */

/**
 * The lot Prototype B presents.
 *
 * This was a hard-coded object, and the cost showed the moment the
 * storefront had real data: B claimed four of six at £240 while the product
 * page said six remaining at $285 — two sources of truth for one garment,
 * in two currencies. It is now mapped from the catalog in
 * lib/prototype-b/lot.ts, so both read the same inventory.
 *
 * TWO FIELDS ARE NULLABLE, AND BOTH MATTER.
 *
 * `remaining` is null when Shopify withholds inventory — no tracking, or an
 * app without the inventory scope. `total` is null far more often: Shopify
 * records what is in stock and never what was, so the original lot size is
 * EOS production data on a metafield most lots will not carry.
 *
 * Neither may be faked. The tick row and "four of six have gone" are the
 * most persuasive things in this experience precisely because they count
 * real garments; inventing either would make the premise a decoration.
 */
export type Lot = {
  code: string;
  name: string;
  /** Pieces left, or null when the count is unknown. */
  remaining: number | null;
  /** Original lot size, or null when nobody recorded it. */
  total: number | null;
  price: string;
  composition: string;
  weight: string;
  fit: string;
  construction: string;
  origin: string;
  sizes: readonly string[];
};

/**
 * Shown only when the catalog has nothing to offer — an empty store, or a
 * hero handle that no longer resolves. Kept so /b never renders an empty
 * frame, and worded so it can never be mistaken for stock.
 */
export const FALLBACK_LOT: Lot = {
  code: "EOS-000.0",
  name: "No lot listed",
  remaining: null,
  total: null,
  price: "—",
  composition: "—",
  weight: "—",
  fit: "—",
  construction: "—",
  origin: "—",
  sizes: [],
};
