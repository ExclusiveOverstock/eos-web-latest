import { getMaterials } from "@/lib/three/materials";
import type { WallUnitKind } from "@/lib/three/store-layout";
import { ROOM } from "@/lib/three/room-config";
import FoldedStacks, { type ShelfRow } from "./FoldedStacks";
import HangingGarments from "./HangingGarments";

/**
 * Merchandising built into a recess in the slat wall.
 *
 * Rendered in local space with the structural wall at x = 0 and the room in
 * local +x, so the same code serves both side walls — the caller just rotates
 * the group by pi for the right-hand side.
 *
 * Three variants cover the perimeter:
 *   rail       hanging apparel with a shelf of folded goods above
 *   shelving   an open bay of boards carrying folded stacks
 *   accessory  narrow lit shelves for shoes and small leather goods
 */

const DEPTH = ROOM.panelDepth;
const BOARD = 0.04;

// Module-level so the memo inside FoldedStacks isn't invalidated every render.
const SHELVING_ROWS: ShelfRow[] = [
  { y: 0.42, stacks: 2 },
  { y: 0.94, stacks: 2 },
  { y: 1.46, stacks: 2 },
  { y: 1.98, stacks: 2 },
];
const RAIL_TOP_ROWS: ShelfRow[] = [{ y: 2.36, stacks: 2 }];

/** Brass reveal framing the opening — catches the perimeter downlights. */
function Reveal({ length, height, baseY }: { length: number; height: number; baseY: number }) {
  const M = getMaterials();
  const edges: [number, number, number, number][] = [
    // [x, y, sizeY, sizeZ]
    [DEPTH, baseY + height + 0.015, 0.03, length + 0.06],
    [DEPTH, baseY - 0.015, 0.03, length + 0.06],
  ];

  return (
    <group>
      {edges.map(([x, y, sy, sz], i) => (
        <mesh key={i} position={[x, y, 0]}>
          <boxGeometry args={[0.05, sy, sz]} />
          <primitive object={M.brass} attach="material" />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[DEPTH, baseY + height / 2, (side * (length + 0.06)) / 2]}>
          <boxGeometry args={[0.05, height + 0.03, 0.03]} />
          <primitive object={M.brass} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function RailBay({ length }: { length: number }) {
  const M = getMaterials();
  const railHeight = 1.78;

  return (
    <group>
      {/* Hanging rail, spanning the recess. Garments are narrowed so they
          stay inside the 34cm reveal instead of poking through its face. */}
      <mesh position={[DEPTH * 0.5, railHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.017, 0.017, length - 0.08, 10]} />
        <primitive object={M.brass} attach="material" />
      </mesh>
      <group position={[DEPTH * 0.5, 0, 0]}>
        <HangingGarments
          count={Math.round(length * 4.2)}
          length={length - 0.4}
          railHeight={railHeight}
          width={0.66}
          seed={Math.round(length * 100)}
        />
      </group>

      {/* Shelf above the rail, carrying folded goods. */}
      <mesh position={[DEPTH * 0.55, 2.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[DEPTH * 0.9, BOARD, length - 0.04]} />
        <primitive object={M.walnutFine} attach="material" />
      </mesh>
      <group position={[DEPTH * 0.55, 0, 0]}>
        <FoldedStacks
          rows={RAIL_TOP_ROWS}
          length={length - 0.3}
          depth={DEPTH * 0.62}
          seed={Math.round(length * 31)}
        />
      </group>

      {/* Low plinth shelf for footwear beneath the garments. */}
      <mesh position={[DEPTH * 0.55, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[DEPTH * 0.9, BOARD, length - 0.04]} />
        <primitive object={M.walnutFine} attach="material" />
      </mesh>
    </group>
  );
}

function ShelvingBay({ length }: { length: number }) {
  const M = getMaterials();

  return (
    <group>
      {/* Blackened steel uprights, then walnut boards spanning between. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[DEPTH * 0.6, 1.24, (side * (length - 0.1)) / 2]}
          castShadow
        >
          <boxGeometry args={[DEPTH * 0.95, 2.46, 0.05]} />
          <primitive object={M.blackSteel} attach="material" />
        </mesh>
      ))}
      {SHELVING_ROWS.map((row) => (
        <mesh
          key={row.y}
          position={[DEPTH * 0.6, row.y - BOARD / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[DEPTH * 0.95, BOARD, length - 0.06]} />
          <primitive object={M.walnut} attach="material" />
        </mesh>
      ))}
      <group position={[DEPTH * 0.6, 0, 0]}>
        <FoldedStacks
          rows={SHELVING_ROWS}
          length={length - 0.24}
          depth={DEPTH * 0.7}
          seed={Math.round(length * 57)}
        />
      </group>
    </group>
  );
}

function AccessoryBay({ length }: { length: number }) {
  const M = getMaterials();
  const shelves = [0.62, 1.14, 1.66, 2.18];

  return (
    <group>
      {shelves.map((y, row) => (
        <group key={y}>
          <mesh position={[DEPTH * 0.55, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[DEPTH * 0.85, 0.035, length - 0.1]} />
            <primitive object={M.walnutFine} attach="material" />
          </mesh>
          {/* Slim brass under-shelf light line — the niches read as lit. */}
          <mesh position={[DEPTH * 0.92, y - 0.03, 0]}>
            <boxGeometry args={[0.02, 0.012, length - 0.3]} />
            <primitive object={M.warmGlowSoft} attach="material" />
          </mesh>

          {/* Placeholder goods: alternating low blocks and shoe-sized forms. */}
          {[-1, 0, 1].map((slot) => {
            const z = slot * (length / 3.4);
            const isBox = (row + slot) % 2 === 0;
            return isBox ? (
              <mesh
                key={slot}
                position={[DEPTH * 0.55, y + 0.075, z]}
                rotation={[0, 0.18 * slot, 0]}
                castShadow
              >
                <boxGeometry args={[0.2, 0.11, 0.28]} />
                <primitive object={M.paleStone} attach="material" />
              </mesh>
            ) : (
              <mesh
                key={slot}
                position={[DEPTH * 0.55, y + 0.06, z]}
                rotation={[0, 0.32 * slot, 0]}
                castShadow
              >
                <capsuleGeometry args={[0.055, 0.16, 3, 8]} />
                <primitive object={M.blackSteel} attach="material" />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

export default function WallDisplay({
  kind,
  length,
}: {
  kind: WallUnitKind;
  length: number;
}) {
  const M = getMaterials();
  const height = kind === "rail" ? 2.6 : 2.55;
  const baseY = 0.06;

  return (
    <group>
      {/* Bone plaster back of the recess — bounces the downlights forward. */}
      <mesh position={[0.02, baseY + height / 2, 0]} receiveShadow>
        <boxGeometry args={[0.04, height, length]} />
        <primitive object={M.bonePlaster} attach="material" />
      </mesh>
      {/* Recess returns on all four sides. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[DEPTH / 2, baseY + height / 2, (side * length) / 2]}>
          <boxGeometry args={[DEPTH, height, 0.04]} />
          <primitive object={M.charcoalPlaster} attach="material" />
        </mesh>
      ))}
      <mesh position={[DEPTH / 2, baseY + height + 0.02, 0]}>
        <boxGeometry args={[DEPTH, 0.04, length]} />
        <primitive object={M.charcoalPlaster} attach="material" />
      </mesh>
      <mesh position={[DEPTH / 2, baseY - 0.02, 0]} receiveShadow>
        <boxGeometry args={[DEPTH, 0.04, length]} />
        <primitive object={M.charcoalPlaster} attach="material" />
      </mesh>

      <Reveal length={length} height={height} baseY={baseY} />

      <group position={[0, baseY, 0]}>
        {kind === "rail" && <RailBay length={length} />}
        {kind === "shelving" && <ShelvingBay length={length} />}
        {kind === "accessory" && <AccessoryBay length={length} />}
      </group>
    </group>
  );
}
