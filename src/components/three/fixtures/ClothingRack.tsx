import { getMaterials } from "@/lib/three/materials";
import ContactShadow from "./ContactShadow";
import HangingGarments from "./HangingGarments";

const RAIL_HEIGHT = 1.66;

/**
 * A freestanding rail for the mid-floor collection areas: two blackened
 * steel uprights on shallow feet, a brushed brass rail, and a walnut lower
 * board for folded overflow. Garments run along the rack's local z axis.
 */
export default function ClothingRack({
  position,
  rotationY = 0,
  length,
  garments,
  seed = 1,
}: {
  position: [number, number];
  rotationY?: number;
  length: number;
  garments: number;
  seed?: number;
}) {
  const M = getMaterials();
  const [x, z] = position;
  const postZ = length / 2;

  return (
    <group position={[x, 0, z]} rotation={[0, rotationY, 0]}>
      {[-postZ, postZ].map((pz) => (
        <group key={pz}>
          <mesh position={[0, RAIL_HEIGHT / 2, pz]} castShadow>
            <boxGeometry args={[0.05, RAIL_HEIGHT, 0.05]} />
            <primitive object={M.blackSteel} attach="material" />
          </mesh>
          {/* Foot, running across the rack so it reads as stable. */}
          <mesh position={[0, 0.022, pz]} castShadow>
            <boxGeometry args={[0.62, 0.044, 0.09]} />
            <primitive object={M.blackSteel} attach="material" />
          </mesh>
          {/* Brass collar where the rail lands on the post. */}
          <mesh position={[0, RAIL_HEIGHT, pz]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.05, 10]} />
            <primitive object={M.brass} attach="material" />
          </mesh>
        </group>
      ))}

      <mesh position={[0, RAIL_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, length, 10]} />
        <primitive object={M.brass} attach="material" />
      </mesh>

      <mesh position={[0, 0.26, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.04, length - 0.1]} />
        <primitive object={M.walnut} attach="material" />
      </mesh>

      <HangingGarments
        count={garments}
        length={length - 0.24}
        railHeight={RAIL_HEIGHT}
        seed={seed}
      />

      <ContactShadow scale={1.1} scaleZ={length + 0.5} opacity={0.55} />
    </group>
  );
}
