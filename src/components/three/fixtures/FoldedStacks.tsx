import { useMemo } from "react";
import { Instance, Instances } from "@react-three/drei";
import { GARMENT_COLORS, getInstancedMaterials } from "@/lib/three/materials";

export type ShelfRow = {
  /** Shelf top surface height. */
  y: number;
  /** Number of stacks side by side along the local z axis. */
  stacks: number;
};

/**
 * Neatly folded apparel sitting on shelving, laid out along local z.
 *
 * Every fold across every shelf of a unit is one InstancedMesh, so a
 * four-shelf wall unit carrying ~60 folded pieces stays a single draw call.
 * Fold heights and slight rotations vary per piece so the stacks look
 * hand-placed rather than extruded.
 */
export default function FoldedStacks({
  rows,
  length,
  depth = 0.34,
  seed = 1,
}: {
  rows: ShelfRow[];
  length: number;
  depth?: number;
  seed?: number;
}) {
  const materials = getInstancedMaterials();

  const folds = useMemo(() => {
    let s = (seed * 7919 + 104729) >>> 0;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0xffffffff;
    };

    const out: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
      color: string;
    }[] = [];

    for (const row of rows) {
      const spacing = length / row.stacks;
      for (let i = 0; i < row.stacks; i += 1) {
        const z = -length / 2 + spacing * (i + 0.5);
        const pieces = 3 + Math.floor(rand() * 4);
        // Each stack keeps one colour family — how a real shop merchandises.
        const base = GARMENT_COLORS[Math.floor(rand() * GARMENT_COLORS.length)];
        let y = row.y;
        for (let p = 0; p < pieces; p += 1) {
          const thickness = 0.045 + rand() * 0.025;
          out.push({
            position: [0, y + thickness / 2, z],
            rotation: [0, (rand() - 0.5) * 0.06, 0],
            scale: [depth, thickness, spacing * (0.62 + rand() * 0.12)],
            color: p % 3 === 0 && rand() > 0.6 ? GARMENT_COLORS[0] : base,
          });
          y += thickness;
        }
      }
    }
    return out;
  }, [rows, length, depth, seed]);

  return (
    <Instances
      limit={Math.max(folds.length, 1)}
      range={folds.length}
      material={materials.folded}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      {folds.map((fold, i) => (
        <Instance
          key={i}
          position={fold.position}
          rotation={fold.rotation}
          scale={fold.scale}
          color={fold.color}
        />
      ))}
    </Instances>
  );
}
