import { getMaterials } from "@/lib/three/materials";
import { HALF_W, ROOM } from "@/lib/three/room-config";
import SlatPaneling from "./SlatPaneling";

/**
 * The back wall and the illuminated alcove cut into it.
 *
 * This is the room's destination: the one warm, bright void at the end of the
 * central aisle, which is what stops the view down the store terminating on a
 * flat polygon. The wall is built as three segments around the opening so the
 * recess is real geometry, and the alcove's own light spills forward onto the
 * floor — the cue that draws a visitor deeper into the boutique.
 *
 * EOS branding here is one brushed brass ring on bone plaster. No wordmark,
 * no graphics.
 */

const { alcoveWidth: AW, alcoveHeight: AH, alcoveDepth: AD, backWallZ: BZ } = ROOM;
const HALF_AW = AW / 2;
const SEGMENT_WIDTH = HALF_W - HALF_AW;

export default function BackAlcove() {
  const M = getMaterials();

  return (
    <group>
      {/* Structural wall, split around the opening. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (HALF_AW + SEGMENT_WIDTH / 2), ROOM.height / 2, BZ + 0.1]}
          receiveShadow
        >
          <boxGeometry args={[SEGMENT_WIDTH, ROOM.height, 0.2]} />
          <primitive object={M.charcoalPlaster} attach="material" />
        </mesh>
      ))}
      <mesh
        position={[0, AH + (ROOM.height - AH) / 2, BZ + 0.1]}
        receiveShadow
      >
        <boxGeometry args={[AW, ROOM.height - AH, 0.2]} />
        <primitive object={M.charcoalPlaster} attach="material" />
      </mesh>

      {/* Slat paneling on the two solid stretches, facing back into the room. */}
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[side * (HALF_AW + SEGMENT_WIDTH / 2), 0, BZ]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <SlatPaneling from={-SEGMENT_WIDTH / 2} to={SEGMENT_WIDTH / 2} />
        </group>
      ))}

      {/* Alcove shell — bone plaster so the hidden source reads as a glow. */}
      <mesh position={[0, AH / 2, BZ + AD]} receiveShadow>
        <boxGeometry args={[AW, AH, 0.08]} />
        <primitive object={M.bonePlaster} attach="material" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * HALF_AW, AH / 2, BZ + AD / 2]} receiveShadow>
          <boxGeometry args={[0.08, AH, AD]} />
          <primitive object={M.bonePlaster} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, AH, BZ + AD / 2]}>
        <boxGeometry args={[AW, 0.08, AD]} />
        <primitive object={M.charcoalPlaster} attach="material" />
      </mesh>
      <mesh
        position={[0, 0.01, BZ + AD / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[AW, AD]} />
        <primitive object={M.stone} attach="material" />
      </mesh>

      {/* Brass reveal around the opening. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * HALF_AW, AH / 2, BZ - 0.02]}>
          <boxGeometry args={[0.05, AH + 0.05, 0.05]} />
          <primitive object={M.brass} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, AH + 0.025, BZ - 0.02]}>
        <boxGeometry args={[AW + 0.05, 0.05, 0.05]} />
        <primitive object={M.brass} attach="material" />
      </mesh>

      {/* Concealed cove above the opening, washing the alcove's back wall. */}
      <mesh position={[0, AH - 0.08, BZ + 0.12]}>
        <boxGeometry args={[AW - 0.3, 0.04, 0.06]} />
        <primitive object={M.warmGlow} attach="material" />
      </mesh>
      <pointLight
        position={[0, AH - 0.35, BZ + 0.3]}
        color="#ffc98d"
        intensity={22}
        distance={7}
        decay={2}
      />

      {/* The EOS mark: a single brass ring, restrained and unlit. */}
      <mesh position={[0, 1.72, BZ + AD - 0.06]}>
        <torusGeometry args={[0.34, 0.014, 8, 44]} />
        <primitive object={M.brass} attach="material" />
      </mesh>

      {/* Low stone bench in the alcove — somewhere for a hero product. */}
      <mesh position={[0, 0.21, BZ + AD * 0.62]} castShadow receiveShadow>
        <boxGeometry args={[AW - 1.0, 0.42, 0.5]} />
        <primitive object={M.stone} attach="material" />
      </mesh>
    </group>
  );
}
