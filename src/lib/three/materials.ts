import * as THREE from "three";
import {
  blackenedWoodMap,
  metalRoughnessMap,
  paleStoneMap,
  plasterMap,
  plasterRoughnessMap,
  stoneMap,
  stoneRoughnessMap,
  tiled,
  walnutMap,
  weaveMap,
  woodRoughnessMap,
} from "./textures";

/**
 * The boutique's material palette, built once and shared by every fixture.
 *
 * Reusing a handful of material instances across the whole store means the
 * renderer compiles a handful of shader programs and can batch aggressively,
 * which is what keeps a scene this dense viable in a browser. Fixtures should
 * pull from here rather than declaring `<meshStandardMaterial>` inline —
 * the exception being instanced groups, which get their own material so
 * three isn't asked to compile one program with and without instancing.
 *
 * Palette discipline: void black, charcoal, dark walnut, bone, muted brass.
 * Nothing saturated, nothing bright, and never pure #000 — the darkest
 * surface still carries a little warmth so the architecture stays readable.
 */

export const PALETTE = {
  void: "#0b0b0a",
  charcoal: "#1a1917",
  charcoalLight: "#2a2825",
  walnut: "#4a2f1e",
  bone: "#e6dfd1",
  boneDim: "#b9b2a4",
  brass: "#9a7833",
  brassBright: "#c9a13f",
  stone: "#33312c",
  paleStone: "#6f6a60",
} as const;

const WALNUT_TINT = "#6b5a49";
const BLACK_WOOD_TINT = "#8e8378";

export type StoreMaterials = ReturnType<typeof buildMaterials>;

function buildMaterials() {
  /**
   * Glossy walnut plank floor — the single most reflective surface here, and
   * the one covering the largest share of the frame.
   *
   * Deliberately MeshStandardMaterial rather than Physical: clearcoat adds a
   * second specular lobe evaluated per fragment, and paying that across the
   * whole floor was measurably the most expensive material in the scene. The
   * lacquered sheen comes from low roughness against the environment map
   * instead, which reads the same at this angle for a fraction of the cost.
   */
  const floor = new THREE.MeshStandardMaterial({
    map: tiled(walnutMap, "walnut", 5, 8),
    roughnessMap: tiled(woodRoughnessMap, "woodRough", 5, 8),
    color: WALNUT_TINT,
    roughness: 0.26,
    metalness: 0.12,
    envMapIntensity: 1.15,
  });

  /** Warm walnut for the display island, shelf boards and door faces. */
  const walnut = new THREE.MeshStandardMaterial({
    map: tiled(walnutMap, "walnut", 2, 2),
    roughnessMap: tiled(woodRoughnessMap, "woodRough", 2, 2),
    color: WALNUT_TINT,
    roughness: 0.42,
    metalness: 0,
    envMapIntensity: 0.65,
  });

  /** Same board, tighter tiling for small parts so the grain stays in scale. */
  const walnutFine = new THREE.MeshStandardMaterial({
    map: tiled(walnutMap, "walnut", 6, 6),
    roughnessMap: tiled(woodRoughnessMap, "woodRough", 6, 6),
    color: WALNUT_TINT,
    roughness: 0.46,
    metalness: 0,
    envMapIntensity: 0.6,
  });

  /** Blackened oak — wall slats, fixture carcasses, the room's base note. */
  const blackenedWood = new THREE.MeshStandardMaterial({
    map: tiled(blackenedWoodMap, "blackWood", 1, 3),
    roughnessMap: tiled(woodRoughnessMap, "woodRough", 1, 3),
    color: BLACK_WOOD_TINT,
    roughness: 0.58,
    metalness: 0,
    envMapIntensity: 0.95,
  });

  const blackenedWoodPanel = new THREE.MeshStandardMaterial({
    map: tiled(blackenedWoodMap, "blackWood", 3, 1),
    roughnessMap: tiled(woodRoughnessMap, "woodRough", 3, 1),
    color: BLACK_WOOD_TINT,
    roughness: 0.6,
    metalness: 0,
    envMapIntensity: 0.9,
  });

  /** Dark honed stone: plinth bodies, island base, threshold inlay. */
  const stone = new THREE.MeshStandardMaterial({
    map: tiled(stoneMap, "stone", 2, 2),
    roughnessMap: tiled(stoneRoughnessMap, "stoneRough", 2, 2),
    roughness: 0.78,
    metalness: 0,
    envMapIntensity: 0.8,
  });

  /** Pale limestone for the sculptural counterpoint blocks. */
  const paleStone = new THREE.MeshStandardMaterial({
    map: tiled(paleStoneMap, "paleStone", 1.5, 1.5),
    roughnessMap: tiled(stoneRoughnessMap, "stoneRough", 1.5, 1.5),
    roughness: 0.88,
    metalness: 0,
    envMapIntensity: 0.55,
  });

  /** Charcoal micro-cement for the ceiling slab and upper walls. */
  const charcoalPlaster = new THREE.MeshStandardMaterial({
    map: tiled(plasterMap, "plaster", 4, 4),
    roughnessMap: tiled(plasterRoughnessMap, "plasterRough", 4, 4),
    color: "#26241f",
    roughness: 0.94,
    metalness: 0,
    envMapIntensity: 0.7,
  });

  /** Warm bone plaster — soffits and niche interiors, the light-catchers. */
  const bonePlaster = new THREE.MeshStandardMaterial({
    map: tiled(plasterMap, "plaster", 3, 3),
    roughnessMap: tiled(plasterRoughnessMap, "plasterRough", 3, 3),
    color: "#bdb3a0",
    roughness: 0.9,
    metalness: 0,
    envMapIntensity: 0.85,
  });

  /** Muted brushed brass. Controlled, not shiny — reflections stay legible. */
  const brass = new THREE.MeshStandardMaterial({
    color: PALETTE.brass,
    roughnessMap: tiled(metalRoughnessMap, "metalRough", 2, 2),
    roughness: 0.36,
    metalness: 1,
    envMapIntensity: 1.15,
  });

  /** Blackened steel for rails, frames and track hardware. */
  const blackSteel = new THREE.MeshStandardMaterial({
    color: "#171614",
    roughnessMap: tiled(metalRoughnessMap, "metalRough", 3, 3),
    roughness: 0.48,
    metalness: 0.85,
    envMapIntensity: 1.0,
  });

  /**
   * Smoked glass. Standard rather than Physical for the same reason as the
   * floor — with no transmission or clearcoat in play, Physical was compiling
   * a heavier shader for exactly the same result.
   */
  const smokedGlass = new THREE.MeshStandardMaterial({
    color: "#0d0d0c",
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.34,
    envMapIntensity: 1.4,
    side: THREE.DoubleSide,
  });

  /** Matte composite for the mannequins — luxury showroom, not shop-window. */
  const mannequin = new THREE.MeshStandardMaterial({
    // Held down off white on purpose: at full brightness under the track
    // spots the form clips to a flat silhouette and all the modelling in the
    // shoulders and ribcage disappears.
    color: "#aaa49a",
    roughness: 0.93,
    metalness: 0,
    envMapIntensity: 0.6,
  });

  const mannequinBase = new THREE.MeshStandardMaterial({
    color: "#141311",
    roughness: 0.4,
    metalness: 0.6,
    envMapIntensity: 0.8,
  });

  /** Warm emissive used by cove strips, downlight lenses and the alcove. */
  const warmGlow = new THREE.MeshBasicMaterial({
    color: "#ffd9a3",
    toneMapped: false,
  });

  const warmGlowSoft = new THREE.MeshBasicMaterial({
    color: "#c99a52",
    toneMapped: false,
  });

  return {
    floor,
    walnut,
    walnutFine,
    blackenedWood,
    blackenedWoodPanel,
    stone,
    paleStone,
    charcoalPlaster,
    bonePlaster,
    brass,
    blackSteel,
    smokedGlass,
    mannequin,
    mannequinBase,
    warmGlow,
    warmGlowSoft,
  };
}

let cache: StoreMaterials | null = null;

/** Lazy singleton — the textures inside need `document`, so never at import. */
export function getMaterials(): StoreMaterials {
  if (!cache) cache = buildMaterials();
  return cache;
}

/**
 * Muted garment colours for the placeholder apparel on racks and shelves.
 *
 * Weighted toward the dark end — a rail picked uniformly from an even spread
 * of tones comes out looking like pale paper, where a real rail of this kind
 * of clothing is mostly charcoal and ink with bone as the occasional relief.
 */
export const GARMENT_COLORS = [
  "#1a1917",
  "#2e2c28",
  "#232120",
  "#3f3a33",
  "#2a2723",
  "#5c5347",
  "#4a443b",
  "#8c8577",
  "#a89c88",
  "#d8d0c0",
] as const;

/**
 * Materials reserved for InstancedMesh use.
 *
 * These are deliberately separate objects from the ones above: three keys its
 * compiled programs on a material's defines, so handing the same material to
 * both an instanced and a non-instanced mesh forces a second program and an
 * extra compile stall the first time each is drawn. Splitting them keeps each
 * material to exactly one program.
 */
function buildInstancedMaterials() {
  return {
    /** Placeholder apparel — the weave only reads at arm's length. */
    garment: new THREE.MeshStandardMaterial({
      map: weaveMap(),
      color: "#ffffff",
      roughness: 0.92,
      metalness: 0,
      envMapIntensity: 0.7,
    }),
    /** Folded stacks on shelving. */
    folded: new THREE.MeshStandardMaterial({
      map: weaveMap(),
      color: "#ffffff",
      roughness: 0.95,
      metalness: 0,
      envMapIntensity: 0.7,
    }),
    /** Hangers and other small repeated brass hardware. */
    brass: new THREE.MeshStandardMaterial({
      color: PALETTE.brass,
      roughness: 0.34,
      metalness: 1,
      envMapIntensity: 1.1,
    }),
    /** Vertical wall slats — the room's dominant repeated element. */
    slat: new THREE.MeshStandardMaterial({
      map: tiled(blackenedWoodMap, "blackWoodSlat", 1, 6),
      color: BLACK_WOOD_TINT,
      roughness: 0.62,
      metalness: 0,
      envMapIntensity: 0.95,
    }),
    /** Recessed downlight trims. */
    trim: new THREE.MeshStandardMaterial({
      color: "#181715",
      roughness: 0.5,
      metalness: 0.7,
      envMapIntensity: 0.6,
    }),
    /** The warm lens inside each downlight. */
    lens: new THREE.MeshBasicMaterial({ color: "#ffdcab", toneMapped: false }),
  };
}

let instancedCache: ReturnType<typeof buildInstancedMaterials> | null = null;

export function getInstancedMaterials() {
  if (!instancedCache) instancedCache = buildInstancedMaterials();
  return instancedCache;
}
