import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import { getInstancedMaterials, getMaterials } from "@/lib/three/materials";
import { FLOOR_MID_Z, HALF_W, ROOM } from "@/lib/three/room-config";
import { ISLAND, MANNEQUINS } from "@/lib/three/store-layout";
import AimedSpot from "./AimedSpot";

/**
 * The layered ceiling and the lighting hierarchy hung from it.
 *
 * Architecturally this is a perimeter soffit dropped below a dark central
 * slab, which is what gives the room a horizon instead of a flat lid:
 *
 *   PRIMARY    warm cove uplight washing the recessed slab, plus a spine of
 *              soft point lights for the room's overall level
 *   SECONDARY  aimed track spots keying the island, the mannequins and the
 *              collection rails — the merchandise is what should be brightest
 *   TERTIARY   recessed downlights along the soffit grazing the slat walls
 *
 * Downlight trims and lenses are instanced, so twenty-odd fixtures cost two
 * draw calls, and only the island key casts a real shadow — everything else
 * relies on the fake contact shadows under each fixture.
 *
 * The light count here is a hard budget, not a preference. This scene is
 * fragment-bound: measured frame time scales almost linearly with pixel
 * count, and every punctual light adds a term evaluated for each of those
 * pixels on every lit surface. Adding "just one more" spot is a whole-scene
 * cost, so the room is lit with the fewest, widest sources that will do.
 */

const SOFFIT_UNDERSIDE = ROOM.height - ROOM.soffitDrop;
const INNER_X = HALF_W - ROOM.soffitInset;
const INNER_Z_FRONT = ROOM.entranceZ + ROOM.soffitInset;
const INNER_Z_BACK = ROOM.backWallZ - ROOM.soffitInset;
const SOFFIT_BAND_MID = HALF_W - ROOM.soffitInset / 2;

/** Emissive strip tucked on the soffit's inner lip, throwing light upward. */
function CoveStrip({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  const M = getMaterials();
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <primitive object={M.warmGlow} attach="material" />
    </mesh>
  );
}

export default function CeilingSystem({ isMobile }: { isMobile: boolean }) {
  const M = getMaterials();
  const materials = getInstancedMaterials();

  const innerWidth = INNER_X * 2;
  const innerDepth = INNER_Z_BACK - INNER_Z_FRONT;
  const innerMidZ = (INNER_Z_FRONT + INNER_Z_BACK) / 2;

  /** Recessed downlights: two rows over the perimeter merchandising. */
  const downlights = useMemo(() => {
    const out: [number, number][] = [];
    for (let z = ROOM.entranceZ + 1.3; z <= ROOM.backWallZ - 1.3; z += 2.05) {
      out.push([-SOFFIT_BAND_MID, z], [SOFFIT_BAND_MID, z]);
    }
    for (const x of [-2.5, 0, 2.5]) {
      out.push([x, ROOM.backWallZ - ROOM.soffitInset / 2]);
      out.push([x, ROOM.entranceZ + ROOM.soffitInset / 2]);
    }
    return out;
  }, []);

  /** Track spots keying the merchandise, aimed from the soffit's inner edge. */
  const spots = useMemo(() => {
    const [ix, iz] = ISLAND.center;
    const list: {
      position: [number, number, number];
      target: [number, number, number];
      angle: number;
      intensity: number;
      castShadow: boolean;
    }[] = [
      {
        position: [ix, SOFFIT_UNDERSIDE - 0.1, iz - 1.2],
        target: [ix, 0.8, iz],
        angle: 0.6,
        intensity: 42,
        castShadow: true,
      },
      {
        position: [0, SOFFIT_UNDERSIDE - 0.1, MANNEQUINS[0].position[1] + 0.6],
        target: [MANNEQUINS[0].position[0], 1.1, MANNEQUINS[0].position[1]],
        angle: 0.42,
        intensity: 30,
        // Only the island key casts a real shadow. Each additional caster
        // costs a full depth pass over the scene plus per-fragment sampling;
        // the fixtures' contact shadows carry the grounding elsewhere.
        castShadow: false,
      },
      {
        position: [0, SOFFIT_UNDERSIDE - 0.1, MANNEQUINS[1].position[1] + 0.6],
        target: [MANNEQUINS[1].position[0], 1.1, MANNEQUINS[1].position[1]],
        angle: 0.42,
        intensity: 30,
        castShadow: false,
      },
    ];

    // Wall-washers, one per side. Frame time here scales with the number of
    // punctual lights times the number of shaded fragments, so each of these
    // is paid for by every surface on screen — two wide ones cover the
    // perimeter about as well as four narrow ones for half the cost.
    if (!isMobile) {
      for (const side of [-1, 1]) {
        list.push({
          position: [side * SOFFIT_BAND_MID, SOFFIT_UNDERSIDE - 0.08, 0],
          target: [side * (HALF_W - 0.25), 1.5, 0],
          angle: 0.95,
          intensity: 34,
          castShadow: false,
        });
      }
    }
    return list;
  }, [isMobile]);

  /** Soft warm fill along the spine, sitting up inside the recess. */
  const fillZ = isMobile ? [-6, 3] : [-7.5, -1, 6];

  return (
    <group>
      {/* Dark central slab, recessed above the soffit line. */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height, innerMidZ]}>
        <planeGeometry args={[innerWidth, innerDepth]} />
        <primitive object={M.charcoalPlaster} attach="material" />
      </mesh>

      {/* Perimeter soffit: four bands framing the recess, bone plaster below. */}
      {(
        [
          [-SOFFIT_BAND_MID, FLOOR_MID_Z, ROOM.soffitInset, ROOM.backWallZ - ROOM.entranceZ],
          [SOFFIT_BAND_MID, FLOOR_MID_Z, ROOM.soffitInset, ROOM.backWallZ - ROOM.entranceZ],
          [0, ROOM.entranceZ + ROOM.soffitInset / 2, innerWidth, ROOM.soffitInset],
          [0, ROOM.backWallZ - ROOM.soffitInset / 2, innerWidth, ROOM.soffitInset],
        ] as [number, number, number, number][]
      ).map(([x, z, sx, sz], i) => (
        <mesh key={i} position={[x, SOFFIT_UNDERSIDE + ROOM.soffitDrop / 2, z]}>
          <boxGeometry args={[sx, ROOM.soffitDrop, sz]} />
          <primitive object={M.bonePlaster} attach="material" />
        </mesh>
      ))}

      {/* Cove strips on the soffit's inner lip — the warm indirect source. */}
      <CoveStrip
        position={[-INNER_X + 0.05, SOFFIT_UNDERSIDE + 0.06, innerMidZ]}
        size={[0.05, 0.05, innerDepth]}
      />
      <CoveStrip
        position={[INNER_X - 0.05, SOFFIT_UNDERSIDE + 0.06, innerMidZ]}
        size={[0.05, 0.05, innerDepth]}
      />
      <CoveStrip
        position={[0, SOFFIT_UNDERSIDE + 0.06, INNER_Z_FRONT + 0.05]}
        size={[innerWidth, 0.05, 0.05]}
      />
      <CoveStrip
        position={[0, SOFFIT_UNDERSIDE + 0.06, INNER_Z_BACK - 0.05]}
        size={[innerWidth, 0.05, 0.05]}
      />

      {/* Recessed downlight trims and their warm lenses. */}
      <Instances
        limit={downlights.length}
        range={downlights.length}
        material={materials.trim}
      >
        <cylinderGeometry args={[0.085, 0.095, 0.05, 14]} />
        {downlights.map(([x, z], i) => (
          <Instance key={i} position={[x, SOFFIT_UNDERSIDE + 0.01, z]} />
        ))}
      </Instances>
      <Instances
        limit={downlights.length}
        range={downlights.length}
        material={materials.lens}
      >
        <cylinderGeometry args={[0.066, 0.066, 0.012, 14]} />
        {downlights.map(([x, z], i) => (
          <Instance key={i} position={[x, SOFFIT_UNDERSIDE - 0.008, z]} />
        ))}
      </Instances>

      {/* Track spot bodies, sitting where the aimed lights actually are. */}
      <Instances limit={spots.length} range={spots.length} material={materials.trim}>
        <cylinderGeometry args={[0.055, 0.07, 0.19, 12]} />
        {spots.map((spot, i) => (
          <Instance
            key={i}
            position={[spot.position[0], spot.position[1] + 0.06, spot.position[2]]}
            rotation={[0.42, 0, 0]}
          />
        ))}
      </Instances>

      {/* PRIMARY — warm fill. Hung below the soffit line rather than up
          inside the recess: sitting 28cm under the slab it burned a hard
          bright pool into the dark ceiling above each lamp. Down here the
          light goes into the room, and the cove strips carry the glow. */}
      {fillZ.map((z) => (
        <pointLight
          key={z}
          position={[0, SOFFIT_UNDERSIDE - 0.8, z]}
          color="#ffcf9c"
          intensity={30}
          distance={20}
          decay={2}
        />
      ))}

      {/* SECONDARY — keyed merchandise lighting. */}
      {spots.map((spot, i) => (
        <AimedSpot
          key={i}
          position={spot.position}
          target={spot.target}
          angle={spot.angle}
          intensity={spot.intensity}
          distance={11}
          castShadow={spot.castShadow && !isMobile}
        />
      ))}
    </group>
  );
}
