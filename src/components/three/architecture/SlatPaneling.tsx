import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import { getInstancedMaterials, getMaterials } from "@/lib/three/materials";
import { ROOM } from "@/lib/three/room-config";

const SLAT_WIDTH = 0.085;
const SLAT_PITCH = 0.155;

export type Gap = { from: number; to: number };

/**
 * Fluted blackened-oak slat paneling — the boutique's dominant wall texture.
 *
 * The whole field is one InstancedMesh, so a 22m wall of ~140 slats costs a
 * single draw call. Gaps are z-ranges where slats are omitted: those become
 * the display niches, genuinely recessed by the panel depth rather than
 * faked with a decal, which is what gives the walls their depth at grazing
 * angles and under the perimeter downlights.
 *
 * Rendered in the group's local space: slats run along local z and stand
 * proud of the wall in local +x.
 */
export default function SlatPaneling({
  from,
  to,
  gaps = [],
  height = ROOM.height,
  baseY = 0,
}: {
  from: number;
  to: number;
  gaps?: Gap[];
  height?: number;
  baseY?: number;
}) {
  const M = getMaterials();
  const materials = getInstancedMaterials();

  const positions = useMemo(() => {
    const out: number[] = [];
    const count = Math.floor((to - from) / SLAT_PITCH);
    for (let i = 0; i < count; i += 1) {
      const z = from + SLAT_PITCH * (i + 0.5);
      const blocked = gaps.some((gap) => z > gap.from - 0.06 && z < gap.to + 0.06);
      if (!blocked) out.push(z);
    }
    return out;
  }, [from, to, gaps]);

  // Continuous backer board behind the slats, so the gaps between them read
  // as shadow lines instead of holes onto the structural wall. One run per
  // stretch of uninterrupted paneling.
  const backerRuns = useMemo(() => {
    const runs: [number, number][] = [];
    let cursor = from;
    for (const gap of [...gaps].sort((a, b) => a.from - b.from)) {
      if (gap.from > cursor) runs.push([cursor, gap.from]);
      cursor = Math.max(cursor, gap.to);
    }
    if (cursor < to) runs.push([cursor, to]);
    return runs;
  }, [from, to, gaps]);

  const depth = ROOM.panelDepth;

  return (
    <group>
      {backerRuns.map(([a, b], i) => (
        <mesh
          key={i}
          position={[depth * 0.35, baseY + height / 2, (a + b) / 2]}
          receiveShadow
        >
          <boxGeometry args={[depth * 0.7, height, b - a]} />
          <primitive object={M.blackenedWoodPanel} attach="material" />
        </mesh>
      ))}

      <Instances
        limit={Math.max(positions.length, 1)}
        range={positions.length}
        material={materials.slat}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[depth * 0.3, height, SLAT_WIDTH]} />
        {positions.map((z, i) => (
          <Instance key={i} position={[depth * 0.85, baseY + height / 2, z]} />
        ))}
      </Instances>
    </group>
  );
}
