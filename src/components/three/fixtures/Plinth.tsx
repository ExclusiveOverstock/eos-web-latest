import { getMaterials } from "@/lib/three/materials";
import ContactShadow from "./ContactShadow";

/**
 * A sculptural display block. Deliberately plain: it's a pedestal for a
 * product, so the only detail is a brass shadow-gap reveal at the base that
 * makes the mass look like it floats a few millimetres off the floor.
 */
export default function Plinth({
  position,
  size,
  pale = false,
}: {
  position: [number, number];
  size: [number, number, number];
  pale?: boolean;
}) {
  const M = getMaterials();
  const [x, z] = position;
  const [w, h, d] = size;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2 + 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <primitive object={pale ? M.paleStone : M.stone} attach="material" />
      </mesh>
      {/* Recessed dark top. Without it a plinth is a single untextured box
          catching one flat value of light, which is what makes it read as
          cardboard rather than a solid piece of stone. */}
      <mesh position={[0, h + 0.025, 0]}>
        <boxGeometry args={[w - 0.11, 0.02, d - 0.11]} />
        <primitive object={M.stone} attach="material" />
      </mesh>
      {/* Inset brass foot — reads as a shadow gap from a few metres away. */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[w - 0.09, 0.02, d - 0.09]} />
        <primitive object={M.brass} attach="material" />
      </mesh>
      <ContactShadow scale={w + 0.55} scaleZ={d + 0.55} opacity={0.6} />
    </group>
  );
}
