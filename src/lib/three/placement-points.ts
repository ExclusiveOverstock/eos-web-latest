import { BENCH, ISLAND, MANNEQUINS, PLINTHS, RACKS, WALL_UNITS, WALL_X } from "./store-layout";

/**
 * Physical anchor points inside the boutique. Milestone 5 assigns Shopify
 * products to these positions via configuration data — this milestone only
 * builds the fixtures that stand at them.
 *
 * Derived from store-layout.ts rather than duplicated, so moving a rail on
 * the floor plan moves the product that will eventually hang on it. The IDs
 * are the stable contract: keep them when a fixture is repositioned, change
 * them only when a fixture is genuinely added or removed.
 */
export type PlacementKind =
  | "mannequin"
  | "rack"
  | "wall-rail"
  | "wall-shelving"
  | "wall-accessory"
  | "display-table"
  | "plinth";

export type PlacementPoint = {
  id: string;
  kind: PlacementKind;
  position: [number, number, number];
  rotationY?: number;
};

const WALL_UNIT_KIND = {
  rail: "wall-rail",
  shelving: "wall-shelving",
  accessory: "wall-accessory",
} as const;

export const PLACEMENT_POINTS: PlacementPoint[] = [
  ...MANNEQUINS.map(
    (m): PlacementPoint => ({
      id: m.id,
      kind: "mannequin",
      position: [m.position[0], m.riser ?? 0, m.position[1]],
      rotationY: m.rotationY,
    }),
  ),
  ...RACKS.map(
    (r): PlacementPoint => ({
      id: r.id,
      kind: "rack",
      position: [r.position[0], 0, r.position[1]],
      rotationY: r.rotationY,
    }),
  ),
  ...WALL_UNITS.map(
    (unit): PlacementPoint => ({
      id: unit.id,
      kind: WALL_UNIT_KIND[unit.kind],
      position: [WALL_X[unit.side], 0, unit.z],
      // Faces into the room from whichever wall it's mounted on.
      rotationY: unit.side === "left" ? Math.PI / 2 : -Math.PI / 2,
    }),
  ),
  ...PLINTHS.map(
    (p): PlacementPoint => ({
      id: p.id,
      kind: "plinth",
      position: [p.position[0], p.size[1], p.position[1]],
    }),
  ),
  {
    id: "ISLAND_01",
    kind: "display-table",
    position: [ISLAND.center[0], ISLAND.deckHeight, ISLAND.center[1]],
  },
  {
    id: "BENCH_01",
    kind: "display-table",
    position: [BENCH.center[0], BENCH.size[1], BENCH.center[1]],
  },
];
