import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import { GARMENT_COLORS, getInstancedMaterials } from "@/lib/three/materials";

/**
 * A run of hanging apparel beneath a rail, laid out along the group's local
 * z axis and centred on the origin.
 *
 * Garments and hangers are two InstancedMeshes, so a rail carrying twenty
 * pieces is two draw calls. Each garment is the same tapered form scaled and
 * jittered per instance — enough irregularity that a row doesn't read as a
 * repeated stamp, while staying a single shared geometry.
 *
 * These are placeholders. Milestone 5 swaps the instanced form for real
 * garment GLBs anchored to the same rail positions.
 */
export default function HangingGarments({
  count,
  length,
  railHeight,
  width = 1,
  seed = 1,
}: {
  count: number;
  length: number;
  railHeight: number;
  /** Scales how far the garments project across the rail. Wall rails sit in
   *  a 34cm recess and need narrower pieces than a freestanding rack. */
  width?: number;
  seed?: number;
}) {
  const materials = getInstancedMaterials();

  const items = useMemo(() => {
    // Deterministic jitter so the shop looks identical on every visit.
    let s = (seed * 9301 + 49297) >>> 0;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };
    const spacing = length / count;
    return Array.from({ length: count }, (_, i) => {
      const z = -length / 2 + spacing * (i + 0.5);
      return {
        z,
        color: GARMENT_COLORS[Math.floor(rand() * GARMENT_COLORS.length)],
        heightScale: 0.86 + rand() * 0.3,
        widthScale: (0.9 + rand() * 0.22) * width,
        tilt: (rand() - 0.5) * 0.09,
        drop: rand() * 0.03,
      };
    });
  }, [count, length, seed, width]);

  return (
    <group>
      <Instances limit={count} range={count} material={materials.garment} castShadow>
        {/* Flattened hard front-to-back: at anything near a round section
            these read as paper tubes on a pole rather than cloth on a rail. */}
        <cylinderGeometry args={[0.15, 0.2, 0.9, 8, 1]} />
        {items.map((item, i) => (
          <Instance
            key={i}
            color={item.color}
            position={[0, railHeight - 0.58 - item.drop, item.z]}
            rotation={[0, 0, item.tilt]}
            scale={[item.widthScale, item.heightScale, 0.24]}
          />
        ))}
      </Instances>

      <Instances limit={count} range={count} material={materials.brass}>
        <torusGeometry args={[0.036, 0.005, 5, 12, Math.PI * 1.5]} />
        {items.map((item, i) => (
          <Instance
            key={i}
            position={[0, railHeight - 0.028 - item.drop, item.z]}
            rotation={[Math.PI / 2, 0, Math.PI * 0.75]}
          />
        ))}
      </Instances>
    </group>
  );
}
