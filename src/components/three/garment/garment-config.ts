/**
 * The EOS garment registry and camera choreography.
 *
 * TWO THINGS LIVE HERE, AND NOTHING ELSE SHOULD.
 *
 * 1. Which 3D asset a product uses. Shopify owns the product — its photos,
 *    price, variants, inventory and description. It does not own the GLB.
 *    A 3D asset is an EOS-side production artefact with its own materials,
 *    animation clips and framing, so the link between the two is a lookup by
 *    product handle, made here.
 *
 *    Swapping the placeholder for a real garment is therefore one line:
 *    drop `hoodie-014.glb` into /public/garments and register it below. No
 *    component changes, no route changes.
 *
 * 2. Where the camera goes. Every beat of the product experience is a named
 *    state rather than a magic number inside a scroll handler, so the
 *    choreography can be re-cut without touching the rig that plays it.
 */

import type { GarmentCut } from "@/lib/three/garment-geometry";

export type GarmentAsset = {
  /**
   * Path to a GLB under /public, or `null` to use the procedural garment.
   *
   * Null is a first-class value, not a failure mode: most of the manifest
   * will never get a bespoke 3D capture, and those products should still get
   * a credible hero rather than an empty frame.
   */
  src: string | null;
  /** Uniform scale applied after load, to normalise assets authored at different sizes. */
  scale: number;
  /** Y offset after centring, in metres. Positive lifts the garment. */
  lift: number;
  /** Resting Y rotation, so an asset's "front" faces the camera. */
  facing: number;
  /**
   * Hooded or crewneck, for the procedural garment. Ignored by GLBs, which
   * already are whatever they were modelled as.
   */
  cut: GarmentCut;
  /** Animation clip played on loop while idle, if the GLB ships one. */
  idleClip?: string;
  /** Cloth colour. Muted, desaturated — this is the garment, not the accent. */
  color: string;
  /** Sheen tint. Cotton and wool catch a cool halo at grazing angles. */
  sheenColor: string;
  /** 0–1. Heavier fabrics scatter more; leather almost none. */
  sheen: number;
  /**
   * Multiplies a loaded GLB's base colour. Ignored by the procedural garment.
   *
   * A correction, not a style control. Scan and photogrammetry pipelines
   * routinely export dark cloth with crushed blacks — an albedo down near
   * half a percent reflectance, which is darker than any real fabric and
   * renders as a hole rather than a garment. Lifting it back to a plausible
   * two-to-three percent is restoring the asset, not re-lighting it.
   */
  albedoGain: number;
};

const PLACEHOLDER: GarmentAsset = {
  src: null,
  scale: 1,
  lift: 0,
  facing: 0,
  cut: "crew",
  color: "#2a2724",
  sheenColor: "#6d6459",
  sheen: 0.55,
  albedoGain: 1,
};

/* ------------------------------------------------------------------ */
/* Deriving a garment from a handle                                    */
/* ------------------------------------------------------------------ */

/**
 * Why this is derived rather than a table of products.
 *
 * The registry began as a hand-written entry per product, which was right
 * when the catalog was eleven invented placeholders. Against a real store it
 * is wrong twice over: the handles never matched, so every product silently
 * fell through to one identical grey garment; and a hand-written table makes
 * adding a product in Shopify a code change, which is exactly the coupling
 * the rest of the Shopify integration was built to avoid.
 *
 * EOS handles name their own colour and cut — `hoodie-lavender-plain`,
 * `sweatshirt-army-green-plain` — because that is how the stock arrives and
 * how it gets listed. So the handle is read rather than looked up, and a
 * product added tomorrow gets a plausible garment with nobody touching this
 * file. An explicit entry in OVERRIDES still wins where a piece deserves
 * bespoke treatment, which is what the hero GLB uses.
 */

/**
 * Cloth colours, as lit fabric rather than as swatches.
 *
 * Every value here is darker and less saturated than the colour it names,
 * and deliberately so. The scene is a near-black room with one raking key
 * light; a garment given its literal hex would read as a glowing plastic
 * cutout rather than as cloth in low light. These are the colours those
 * fabrics actually resolve to under this rig.
 *
 * Longer keys are matched first (see below), so `heather-grey` wins over
 * `grey` and `navy-blue` over `blue` regardless of the order written here.
 */
const CLOTH: Record<string, { color: string; sheenColor: string; sheen: number }> = {
  black: { color: "#1a1817", sheenColor: "#5c554c", sheen: 0.5 },
  "off-white": { color: "#b3ab9d", sheenColor: "#e4dbc9", sheen: 0.72 },
  oyster: { color: "#a2998a", sheenColor: "#ddd3c1", sheen: 0.7 },
  beige: { color: "#9a8e7c", sheenColor: "#d6cab4", sheen: 0.68 },
  "heather-grey": { color: "#45423e", sheenColor: "#8d867c", sheen: 0.72 },
  "solid-grey": { color: "#3a3836", sheenColor: "#827c74", sheen: 0.62 },
  grey: { color: "#3a3836", sheenColor: "#827c74", sheen: 0.62 },
  "navy-blue": { color: "#23293a", sheenColor: "#6a7286", sheen: 0.58 },
  "sky-blue": { color: "#4a5f73", sheenColor: "#93a4b5", sheen: 0.6 },
  indigo: { color: "#2c3350", sheenColor: "#6e7796", sheen: 0.55 },
  denim: { color: "#37455a", sheenColor: "#7c8a9e", sheen: 0.42 },
  lavender: { color: "#56506b", sheenColor: "#9b93ae", sheen: 0.62 },
  "pastel-pink": { color: "#8e7377", sheenColor: "#cdb4b6", sheen: 0.66 },
  "cherry-pink": { color: "#77394b", sheenColor: "#b5788a", sheen: 0.6 },
  "coral-pink": { color: "#8f5b57", sheenColor: "#caa09a", sheen: 0.62 },
  apricot: { color: "#8d6a51", sheenColor: "#c9a986", sheen: 0.64 },
  "mocha-brown": { color: "#4a3a30", sheenColor: "#8f7c6a", sheen: 0.58 },
  "army-green": { color: "#3a3f30", sheenColor: "#7f8570", sheen: 0.55 },
  "parrot-green": { color: "#3f5238", sheenColor: "#85977c", sheen: 0.58 },
  // Warmer and browner than the brand accent on purpose. A red garment is
  // product truth, but it must not start reading as oxblood — that colour
  // means something specific on this site and does not mean "this item".
  "bright-red": { color: "#73332c", sheenColor: "#b57a6c", sheen: 0.58 },
  red: { color: "#6b3029", sheenColor: "#ab7264", sheen: 0.56 },
};

/**
 * Longest key first, so a compound colour is never shadowed by the plain one
 * it contains. Computed once rather than relying on the literal's key order,
 * which is a property nobody editing CLOTH should have to remember.
 */
const CLOTH_KEYS = Object.keys(CLOTH).sort((a, b) => b.length - a.length);

function clothFor(handle: string) {
  const key = CLOTH_KEYS.find((k) => handle.includes(k));
  return key ? CLOTH[key] : undefined;
}

/**
 * Hood or crew, read from the handle.
 *
 * Most of the manifest is crewneck sweatshirts, and rendering them with the
 * hood up was the loudest way the 3D could contradict the product beside it.
 * `swaetshirt` is not a typo here — it is a typo in a live product handle,
 * and the garment should not turn into a hoodie because of it.
 */
function cutFor(handle: string): GarmentCut {
  if (/hood/.test(handle)) return "hooded";
  if (/sw(ea|ae)tshirt|crew|tee|shirt/.test(handle)) return "crew";
  return "crew";
}

/**
 * Explicit overrides, for pieces that earn one.
 *
 * Only the fields that differ need stating, and anything set here beats the
 * derivation above.
 */
const OVERRIDES: Record<string, Partial<GarmentAsset>> = {
  // The hero, and the first product with a real captured asset.
  //
  // It needs almost nothing: its front already faces +Z, its material is
  // sound — matte, zero metalness, normal-mapped — and height normalisation
  // happens on load. Only the albedo is corrected. The colour fields below
  // belong to the procedural fallback and are seen only while the GLB is
  // still streaming.
  "heavyweight-hoodie": {
    src: "/garments/hoodie-014.glb",
    albedoGain: 2.4,
    color: "#2b2724",
    sheenColor: "#8a7f70",
    sheen: 0.62,
  },
};

/**
 * @param src overrides the registry's `src` when the catalog supplies one.
 *   Shopify wins over the local registry deliberately: the registry is a
 *   developer's default, and a path set in the admin is someone stating what
 *   this specific lot should show.
 */
export function garmentAssetFor(handle: string, src?: string | null): GarmentAsset {
  const key = handle.toLowerCase();
  const asset: GarmentAsset = {
    ...PLACEHOLDER,
    cut: cutFor(key),
    ...clothFor(key),
    ...(OVERRIDES[key] ?? {}),
  };
  return src ? { ...asset, src } : asset;
}

/* ------------------------------------------------------------------ */
/* Camera choreography                                                 */
/* ------------------------------------------------------------------ */

export type CameraState = {
  id: string;
  /** Shown in the experience's progress rail. */
  label: string;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
  /**
   * Garment Y rotation at this beat, in radians, monotonically increasing
   * across a sequence. Continuous rotation is what makes the experience feel
   * like one held camera move; resetting between beats makes it feel like a
   * slideshow of product renders.
   */
  spin: number;
  /** Multiplies the whole lighting rig. Lets a beat go darker or hotter. */
  exposure: number;
};

/**
 * The product experience — Prototype B.
 *
 * The garment is the protagonist for all seven beats. Note what the sequence
 * does *not* do: it never cuts to a spec table or a size grid while the
 * garment sits idle in the corner. Information arrives while the camera is
 * already looking at the part of the garment it describes.
 */
export const LOT_SEQUENCE: readonly CameraState[] = [
  {
    id: "reveal",
    label: "Reveal",
    position: [0, 0.06, 3.5],
    target: [0, 0, 0],
    fov: 32,
    spin: 0,
    exposure: 0.85,
  },
  {
    id: "presence",
    label: "Presence",
    position: [1.42, 0.18, 2.55],
    target: [0, 0.02, 0],
    fov: 34,
    spin: -0.62,
    exposure: 1,
  },
  {
    id: "inspection",
    label: "Inspection",
    position: [0.62, 0.46, 1.42],
    target: [0, 0.34, 0],
    fov: 30,
    spin: -1.15,
    exposure: 1.08,
  },
  {
    id: "material",
    label: "Material",
    position: [-0.46, -0.08, 0.86],
    target: [-0.04, -0.06, 0.06],
    fov: 26,
    spin: -2.05,
    exposure: 1.22,
  },
  {
    id: "story",
    label: "Story",
    position: [0, 0.04, 4.1],
    target: [0, 0, 0],
    fov: 30,
    spin: -3.1,
    exposure: 0.75,
  },
  {
    id: "lot",
    label: "Lot",
    position: [-1.58, 0.12, 2.35],
    target: [0, 0, 0],
    fov: 34,
    spin: -4.4,
    exposure: 0.95,
  },
  {
    id: "purchase",
    label: "Acquire",
    position: [0.05, 0.04, 2.95],
    target: [0, 0, 0],
    fov: 32,
    // A shade over a full turn: the garment arrives back at its front having
    // gone the long way round, rather than snapping back.
    spin: -6.28,
    exposure: 1,
  },
];

/**
 * The homepage opening.
 *
 * Four beats, not seven. The homepage's job is to create curiosity and then
 * hand control over — it is not the place to explain the product, so the
 * camera does one long approach and stops.
 */
export const HERO_SEQUENCE: readonly CameraState[] = [
  {
    id: "arrival",
    label: "Arrival",
    position: [0, 0.02, 4.6],
    target: [0, 0, 0],
    fov: 30,
    spin: 0.35,
    exposure: 0.9,
  },
  {
    id: "statement",
    label: "Statement",
    position: [0.9, 0.1, 3.1],
    target: [0, 0, 0],
    fov: 32,
    spin: -0.5,
    exposure: 1.05,
  },
  {
    id: "approach",
    label: "Approach",
    position: [-0.7, 0.24, 2.15],
    target: [0, 0.12, 0],
    fov: 32,
    spin: -1.5,
    exposure: 1.2,
  },
  {
    id: "handoff",
    label: "Handoff",
    position: [0, 0.05, 2.85],
    target: [0, 0, 0],
    fov: 32,
    spin: -2.4,
    exposure: 1,
  },
];
