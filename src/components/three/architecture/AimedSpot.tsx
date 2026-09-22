import { useMemo } from "react";
import * as THREE from "three";

/**
 * A spotlight that actually points somewhere.
 *
 * three aims a SpotLight at a separate target Object3D which has to be in the
 * scene graph; setting `position` alone leaves every spot pointing at the
 * world origin. This mounts the target alongside the light so callers can
 * just say where the beam lands.
 */
export default function AimedSpot({
  position,
  target,
  angle = 0.5,
  penumbra = 0.65,
  intensity = 30,
  distance = 12,
  color = "#ffd7a8",
  castShadow = false,
}: {
  position: [number, number, number];
  target: [number, number, number];
  angle?: number;
  penumbra?: number;
  intensity?: number;
  distance?: number;
  color?: string;
  castShadow?: boolean;
}) {
  const targetObject = useMemo(() => new THREE.Object3D(), []);

  return (
    <>
      <primitive object={targetObject} position={target} />
      <spotLight
        position={position}
        target={targetObject}
        angle={angle}
        penumbra={penumbra}
        intensity={intensity}
        distance={distance}
        decay={2}
        color={color}
        castShadow={castShadow}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0015}
        shadow-normalBias={0.02}
      />
    </>
  );
}
