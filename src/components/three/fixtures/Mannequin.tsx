import { getMaterials } from "@/lib/three/materials";
import { mannequinGeometry } from "@/lib/three/mannequin-geometry";
import ContactShadow from "./ContactShadow";

/**
 * A single display form. The body is one merged, shared geometry (see
 * mannequin-geometry.ts) so adding figures to the floor plan costs almost
 * nothing; only the base disc and the fake contact shadow are extra.
 *
 * `riser` lifts the figure onto a shallow dark plinth for hero positions.
 */
export default function Mannequin({
  position,
  rotationY = 0,
  riser = 0,
  castShadow = true,
}: {
  position: [number, number];
  rotationY?: number;
  riser?: number;
  castShadow?: boolean;
}) {
  const M = getMaterials();
  const [x, z] = position;

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      {riser > 0 && (
        <mesh position={[0, riser / 2, 0]} receiveShadow castShadow={castShadow}>
          <boxGeometry args={[0.78, riser, 0.78]} />
          <primitive object={M.stone} attach="material" />
        </mesh>
      )}

      <group position={[0, riser, 0]}>
        <mesh geometry={mannequinGeometry()} castShadow={castShadow}>
          <primitive object={M.mannequin} attach="material" />
        </mesh>
        {/* Slim disc the form stands on, as on a real showroom stand. */}
        <mesh position={[0, 0.012, 0]}>
          <cylinderGeometry args={[0.26, 0.28, 0.024, 24]} />
          <primitive object={M.mannequinBase} attach="material" />
        </mesh>
      </group>

      <ContactShadow y={riser + 0.004} scale={1.15} opacity={0.7} />
    </group>
  );
}
