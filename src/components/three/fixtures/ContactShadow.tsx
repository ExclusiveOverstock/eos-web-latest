import * as THREE from "three";
import { shadowBlobMap } from "@/lib/three/textures";

/**
 * A soft dark blob on the floor beneath a fixture.
 *
 * Real shadow maps are reserved for the few lights that key the hero
 * displays; everything else grounds itself with one of these instead. It's a
 * single unlit quad, so it costs nothing next to another shadow-casting
 * light, and it gives the ambient-occlusion contact darkening that keeps
 * furniture from looking like it's hovering.
 */

const materialCache = new Map<number, THREE.MeshBasicMaterial>();

function shadowMaterial(opacity: number) {
  const key = Math.round(opacity * 100);
  const cached = materialCache.get(key);
  if (cached) return cached;
  const material = new THREE.MeshBasicMaterial({
    map: shadowBlobMap(),
    color: "#000000",
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
  });
  materialCache.set(key, material);
  return material;
}

export default function ContactShadow({
  y = 0.004,
  scale = 1,
  scaleZ,
  opacity = 0.6,
  position = [0, 0],
}: {
  y?: number;
  scale?: number;
  /** Set for long fixtures (rails, islands) that need an elongated blob. */
  scaleZ?: number;
  opacity?: number;
  position?: [number, number];
}) {
  return (
    <mesh
      position={[position[0], y, position[1]]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[scale, scaleZ ?? scale, 1]}
      renderOrder={1}
    >
      <planeGeometry args={[1, 1]} />
      <primitive object={shadowMaterial(opacity)} attach="material" />
    </mesh>
  );
}
