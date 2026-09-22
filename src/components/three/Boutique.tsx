import { getMaterials } from "@/lib/three/materials";
import {
  FLOOR_DEPTH,
  FLOOR_MID_Z,
  HALF_W,
  ROOM,
} from "@/lib/three/room-config";
import {
  BENCH,
  MANNEQUINS,
  PLINTHS,
  RACKS,
  WALL_UNITS,
  WALL_X,
  type WallSide,
} from "@/lib/three/store-layout";
import BackAlcove from "./architecture/BackAlcove";
import CeilingSystem from "./architecture/CeilingSystem";
import SlatPaneling, { type Gap } from "./architecture/SlatPaneling";
import ClothingRack from "./fixtures/ClothingRack";
import ContactShadow from "./fixtures/ContactShadow";
import DisplayIsland from "./fixtures/DisplayIsland";
import Mannequin from "./fixtures/Mannequin";
import Plinth from "./fixtures/Plinth";
import WallDisplay from "./fixtures/WallDisplay";

/**
 * The boutique shell and everything merchandised inside it.
 *
 * Composition follows one circulation idea, read from the door:
 *
 *   THRESHOLD  a dark stone inlay and two flanking figures, so the first
 *              frame says "clothing store" before you take a step
 *   ISLAND     the sculptural walnut anchor on the centreline
 *   FLANKS     recessed wall bays left and right, plus freestanding rails
 *   ALCOVE     a lit void at the end of the aisle, pulling you deeper
 *
 * The arrangement itself lives in store-layout.ts; this file only turns that
 * plan into geometry.
 */

function SideWall({ side }: { side: WallSide }) {
  const M = getMaterials();
  const wallX = WALL_X[side];
  // Local +x always points into the room, so one set of coordinates drives
  // both walls and the wall units never need mirrored maths. The half-turn
  // that achieves it also flips local z, so world z has to be negated on the
  // right-hand wall for units to land where the floor plan says.
  const rotationY = side === "left" ? 0 : Math.PI;
  const zSign = side === "left" ? 1 : -1;
  const units = WALL_UNITS.filter((unit) => unit.side === side);

  // Cut a niche in the slat field wherever a wall unit is merchandised.
  const gaps: Gap[] = units.map((unit) => ({
    from: zSign * unit.z - unit.length / 2,
    to: zSign * unit.z + unit.length / 2,
  }));

  return (
    <group position={[wallX, 0, 0]} rotation={[0, rotationY, 0]}>
      {/* Structural wall behind the panel zone. */}
      <mesh position={[-0.1, ROOM.height / 2, 0]} receiveShadow>
        <boxGeometry args={[0.2, ROOM.height, FLOOR_DEPTH]} />
        <primitive object={M.charcoalPlaster} attach="material" />
      </mesh>

      <SlatPaneling from={ROOM.entranceZ} to={ROOM.backWallZ} gaps={gaps} />

      {units.map((unit) => (
        <group key={unit.id} position={[0, 0, zSign * unit.z]}>
          <WallDisplay kind={unit.kind} length={unit.length} />
        </group>
      ))}

      {/* Blackened skirting, running the full length under everything. */}
      <mesh position={[ROOM.panelDepth / 2, 0.055, 0]}>
        <boxGeometry args={[ROOM.panelDepth + 0.03, 0.11, FLOOR_DEPTH]} />
        <primitive object={M.blackenedWood} attach="material" />
      </mesh>
    </group>
  );
}

/** South wall, split around the entrance opening. */
function EntranceWall() {
  const M = getMaterials();
  const sideWidth = (ROOM.width - ROOM.doorwayWidth) / 2;
  const headerHeight = ROOM.height - ROOM.openingHeight;

  return (
    <group position={[0, 0, ROOM.entranceZ]}>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * (ROOM.doorwayWidth / 2 + sideWidth / 2), ROOM.height / 2, -0.1]}
            receiveShadow
          >
            <boxGeometry args={[sideWidth, ROOM.height, 0.2]} />
            <primitive object={M.charcoalPlaster} attach="material" />
          </mesh>
          {/* Paneling on the inward face, matching the side walls. */}
          <group
            position={[side * (ROOM.doorwayWidth / 2 + sideWidth / 2), 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
          >
            <SlatPaneling from={-sideWidth / 2} to={sideWidth / 2} />
          </group>
        </group>
      ))}

      <mesh position={[0, ROOM.height - headerHeight / 2, -0.1]} receiveShadow>
        <boxGeometry args={[ROOM.doorwayWidth + 0.3, headerHeight, 0.2]} />
        <primitive object={M.charcoalPlaster} attach="material" />
      </mesh>
      {/* Brass reveal around the doorway head. */}
      <mesh position={[0, ROOM.height - headerHeight - 0.03, 0.03]}>
        <boxGeometry args={[ROOM.doorwayWidth + 0.14, 0.05, 0.06]} />
        <primitive object={M.brass} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * A shallow enclosed foyer outside the doors.
 *
 * The player spawns here, so without it the arrival shot opens with the
 * boutique floating in black void at the edges of frame. Four dark surfaces
 * and a single warm downlight are enough to read as "you are standing in an
 * entrance", and they frame the doorway for the dolly-in.
 */
function Vestibule() {
  const M = getMaterials();
  const depth = ROOM.entranceZ - ROOM.vestibuleZ + 1;
  const midZ = (ROOM.vestibuleZ - 1 + ROOM.entranceZ) / 2;
  const width = ROOM.doorwayWidth + 2.4;
  const height = ROOM.openingHeight + 0.5;

  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * width) / 2, height / 2, midZ]} receiveShadow>
          <boxGeometry args={[0.2, height, depth]} />
          <primitive object={M.charcoalPlaster} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, height, midZ]}>
        <boxGeometry args={[width, 0.2, depth]} />
        <primitive object={M.charcoalPlaster} attach="material" />
      </mesh>
      {/* Behind the player, so turning around doesn't reveal the void. */}
      <mesh position={[0, height / 2, ROOM.vestibuleZ - 1]} receiveShadow>
        <boxGeometry args={[width, height, 0.2]} />
        <primitive object={M.blackenedWoodPanel} attach="material" />
      </mesh>
      {/* Lit by an emissive panel rather than a real light. A point light
          out here would be evaluated by every shaded fragment inside the
          store for the whole session, to illuminate a space the visitor
          passes through once in the first three seconds. */}
      <mesh position={[0, height - 0.12, midZ]}>
        <boxGeometry args={[width * 0.5, 0.05, depth * 0.5]} />
        <primitive object={M.warmGlowSoft} attach="material" />
      </mesh>
    </group>
  );
}

/** Low accessory bench deep in the store; sits below the sightline. */
function AccessoryBench() {
  const M = getMaterials();
  const [x, z] = BENCH.center;
  const [w, h, d] = BENCH.size;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h - 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.06, d]} />
        <primitive object={M.walnut} attach="material" />
      </mesh>
      <mesh position={[0, (h - 0.06) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.5, h - 0.06, d - 0.34]} />
        <primitive object={M.stone} attach="material" />
      </mesh>
      {/* Smoked glass vitrine over one half, for small goods. */}
      <mesh position={[-w * 0.24, h + 0.14, 0]}>
        <boxGeometry args={[w * 0.4, 0.28, d * 0.62]} />
        <primitive object={M.smokedGlass} attach="material" />
      </mesh>
      <ContactShadow scale={w + 0.7} scaleZ={d + 0.7} opacity={0.55} />
    </group>
  );
}

export default function Boutique({ isMobile }: { isMobile: boolean }) {
  const M = getMaterials();

  return (
    <group>
      {/* ---------------------------------------------------------------- */}
      {/* Shell                                                            */}
      {/* ---------------------------------------------------------------- */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, FLOOR_MID_Z]}
      >
        <planeGeometry args={[ROOM.width, FLOOR_DEPTH]} />
        <primitive object={M.floor} attach="material" />
      </mesh>

      {/* Dark stone threshold inlay — marks the entry and breaks up the
          plank floor where the traffic is heaviest. */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.006, ROOM.entranceZ + 1.4]}
      >
        <planeGeometry args={[ROOM.doorwayWidth + 1.6, 2.6]} />
        <primitive object={M.stone} attach="material" />
      </mesh>

      {/* Vestibule floor, outside the doors. */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, (ROOM.vestibuleZ - 1 + ROOM.entranceZ) / 2]}
      >
        <planeGeometry
          args={[ROOM.doorwayWidth + 2.4, ROOM.entranceZ - ROOM.vestibuleZ + 1]}
        />
        <primitive object={M.stone} attach="material" />
      </mesh>

      <SideWall side="left" />
      <SideWall side="right" />
      <EntranceWall />
      <Vestibule />
      <BackAlcove />
      <CeilingSystem isMobile={isMobile} />

      {/* ---------------------------------------------------------------- */}
      {/* Merchandising                                                    */}
      {/* ---------------------------------------------------------------- */}
      <DisplayIsland />
      <AccessoryBench />

      {PLINTHS.map((plinth) => (
        <Plinth
          key={plinth.id}
          position={plinth.position}
          size={plinth.size}
          pale={plinth.pale}
        />
      ))}

      {RACKS.map((rack, i) => (
        <ClothingRack
          key={rack.id}
          position={rack.position}
          rotationY={rack.rotationY}
          length={rack.length}
          garments={rack.garments}
          seed={i * 17 + 3}
        />
      ))}

      {MANNEQUINS.map((mannequin) => (
        <Mannequin
          key={mannequin.id}
          position={mannequin.position}
          rotationY={mannequin.rotationY}
          riser={mannequin.riser}
          castShadow={!isMobile}
        />
      ))}

      {/* A brass rail at knee height along the aisle edges — the kind of
          quiet detail that makes a space read as built rather than blocked
          out. Kept to the entrance run only, so it never crowds the floor. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (HALF_W - 1.9), 0.44, ROOM.entranceZ + 2.2]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.016, 0.016, 1.5, 8]} />
          <primitive object={M.brass} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
