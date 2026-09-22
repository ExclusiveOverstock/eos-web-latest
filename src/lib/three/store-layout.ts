import { HALF_W } from "./room-config";

/**
 * The boutique's merchandising plan, as data.
 *
 * Keeping the arrangement here (rather than hard-coded inside JSX) means the
 * floor plan, the collision volumes and — later — the product anchors all
 * describe the same store, and a fixture can be moved by editing one line.
 *
 * The composition follows a single circulation idea:
 *
 *   ENTRANCE  →  HERO ISLAND  →  LEFT/RIGHT COLLECTIONS  →  LIT BACK ALCOVE
 *
 * A clear ~4m aisle runs the length of the room on x ≈ 0. Everything that
 * carries merchandise sits either on the perimeter or on a low central
 * anchor, so the view from the door always terminates on the back alcove.
 */

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };

/** Facing the wall it hangs on, so components can mirror without maths. */
export type WallSide = "left" | "right";

export const WALL_X = { left: -HALF_W, right: HALF_W } as const;

/** +1 pushes into the room from the left wall, -1 from the right. */
export function inwardSign(side: WallSide) {
  return side === "left" ? 1 : -1;
}

// ---------------------------------------------------------------------------
// Central anchors
// ---------------------------------------------------------------------------

/** The sculptural hero island — first thing you see past the doors. */
export const ISLAND = {
  center: [0, -1.4] as [number, number],
  /** Wedge deck: long in z, cantilevered over an angled walnut leg. */
  deckLength: 3.4,
  deckWidth: 1.55,
  deckHeight: 0.78,
  /** Pale stone counterpoint block at the near end. */
  blockSize: [1.3, 0.64, 1.3] as [number, number, number],
  blockOffsetZ: 2.15,
} as const;

/** Low accessory bench deep in the store — sits below the sightline. */
export const BENCH = {
  center: [0, 5.2] as [number, number],
  size: [2.3, 0.44, 1.0] as [number, number, number],
} as const;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

export type PlinthSpec = {
  id: string;
  position: [number, number];
  size: [number, number, number];
  /** Pale limestone reads as the accent; dark stone as the default. */
  pale?: boolean;
};

export const PLINTHS: PlinthSpec[] = [
  // Pulled back toward the threshold so they frame the arrival shot from the
  // edges of frame rather than blocking the island in the middle of it.
  { id: "PLINTH_01", position: [-3.0, -6.4], size: [0.72, 0.95, 0.72] },
  { id: "PLINTH_02", position: [3.1, -6.2], size: [0.62, 1.15, 0.62], pale: true },
  { id: "PLINTH_03", position: [2.8, 2.6], size: [0.8, 0.55, 0.8] },
];

export type MannequinSpec = {
  id: string;
  position: [number, number];
  rotationY: number;
  /** Raises the figure on a shallow dark base for the hero positions. */
  riser?: number;
};

export const MANNEQUINS: MannequinSpec[] = [
  // Flanking the aisle ahead of the island. Positioned off the camera's rest
  // point at ENTRY_REST_Z: any nearer and they fall outside the frustum
  // entirely, which is what makes an arrival shot read as an empty corridor.
  { id: "MANNEQUIN_01", position: [-2.9, -3.2], rotationY: 0.55 },
  { id: "MANNEQUIN_02", position: [2.9, -3.2], rotationY: -0.55 },
  // Grouped past the hero island, set wider so they stagger against the pair
  // in front rather than lining up behind them.
  { id: "MANNEQUIN_03", position: [-3.5, 1.4], rotationY: 1.1 },
  { id: "MANNEQUIN_04", position: [3.5, 1.0], rotationY: -1.1 },
  // Silhouetted beside the lit back alcove — the destination. Offset so it
  // frames the opening instead of standing squarely in front of it.
  { id: "MANNEQUIN_05", position: [-2.4, 8.0], rotationY: 2.5, riser: 0.22 },
];

export type RackSpec = {
  id: string;
  position: [number, number];
  rotationY: number;
  length: number;
  garments: number;
};

/** Freestanding rails in the mid-floor collection areas. */
export const RACKS: RackSpec[] = [
  { id: "RACK_01", position: [-4.4, 4.6], rotationY: 0, length: 2.8, garments: 15 },
  { id: "RACK_02", position: [4.4, 4.6], rotationY: 0, length: 2.8, garments: 15 },
];

export type WallUnitKind = "rail" | "shelving" | "accessory";

export type WallUnitSpec = {
  id: string;
  kind: WallUnitKind;
  side: WallSide;
  /** Centre of the unit along z. */
  z: number;
  /** Extent along z. */
  length: number;
};

/**
 * Perimeter merchandising. Between them these cover most of both side walls,
 * which is what stops the room reading as two large empty polygons — while
 * the gaps left between units keep deliberate negative space.
 */
export const WALL_UNITS: WallUnitSpec[] = [
  { id: "WALL_L1", kind: "rail", side: "left", z: -6.0, length: 4.2 },
  { id: "WALL_L2", kind: "shelving", side: "left", z: -0.6, length: 3.4 },
  { id: "WALL_L3", kind: "rail", side: "left", z: 4.6, length: 3.8 },
  { id: "WALL_L4", kind: "accessory", side: "left", z: 8.6, length: 2.6 },
  { id: "WALL_R1", kind: "shelving", side: "right", z: -6.4, length: 3.8 },
  { id: "WALL_R2", kind: "rail", side: "right", z: -1.0, length: 3.6 },
  { id: "WALL_R3", kind: "accessory", side: "right", z: 3.4, length: 2.8 },
  { id: "WALL_R4", kind: "shelving", side: "right", z: 7.8, length: 3.4 },
];

// ---------------------------------------------------------------------------
// Collision
// ---------------------------------------------------------------------------

function rectAround(
  [x, z]: [number, number],
  sizeX: number,
  sizeZ: number,
  offsetZ = 0,
): Rect {
  return {
    minX: x - sizeX / 2,
    maxX: x + sizeX / 2,
    minZ: z + offsetZ - sizeZ / 2,
    maxZ: z + offsetZ + sizeZ / 2,
  };
}

/**
 * Axis-aligned footprints the player can't walk through. Fixtures sitting
 * flush against a side wall are omitted: they're shallower than the wall
 * inset in WALK_BOUNDS, so the existing clamp already keeps the camera clear
 * of them and every rect here costs a little work each frame.
 */
export const OBSTACLES: Rect[] = [
  // Hero island — deck plus the stone block at its near end.
  {
    minX: ISLAND.center[0] - ISLAND.deckWidth / 2 - 0.1,
    maxX: ISLAND.center[0] + ISLAND.deckWidth / 2 + 0.1,
    minZ: ISLAND.center[1] - ISLAND.deckLength / 2 - 0.1,
    maxZ: ISLAND.center[1] + ISLAND.blockOffsetZ + ISLAND.blockSize[2] / 2,
  },
  rectAround(BENCH.center, BENCH.size[0] + 0.2, BENCH.size[2] + 0.2),
  ...PLINTHS.map((p) => rectAround(p.position, p.size[0] + 0.2, p.size[2] + 0.2)),
  // Freestanding rails, widened for the garments hanging off them.
  ...RACKS.map((r) => rectAround(r.position, 0.95, r.length + 0.4)),
  // The hero mannequin at the alcove stands in the aisle, so it gets a volume.
  ...MANNEQUINS.filter((m) => m.riser !== undefined).map((m) =>
    rectAround(m.position, 0.85, 0.85),
  ),
];

/** Half-width of the player's collision cylinder, in metres. */
export const PLAYER_RADIUS = 0.4;
