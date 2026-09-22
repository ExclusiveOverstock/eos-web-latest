import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getMaterials } from "@/lib/three/materials";
import { ROOM } from "@/lib/three/room-config";

const DOOR_WIDTH = ROOM.doorwayWidth / 2;
const DOOR_HEIGHT = ROOM.openingHeight - 0.05;
const OPEN_ANGLE = Math.PI * 0.62;

/**
 * A pair of pivoting entrance doors: blackened wood stiles carrying a smoked
 * glass panel, with a full-height brushed brass pull. The glass lets the warm
 * interior show through before the doors ever open, which is what makes the
 * threshold feel like a shopfront rather than a loading screen.
 */
function DoorPanel({ side, open }: { side: "left" | "right"; open: boolean }) {
  const pivotRef = useRef<THREE.Group>(null);
  const M = getMaterials();
  const sign = side === "left" ? -1 : 1;
  const stile = 0.11;

  useFrame((_, delta) => {
    const pivot = pivotRef.current;
    if (!pivot) return;
    const target = open ? sign * OPEN_ANGLE : 0;
    pivot.rotation.y = THREE.MathUtils.damp(pivot.rotation.y, target, 3.2, delta);
  });

  const centerX = sign * (DOOR_WIDTH / 2);

  return (
    <group ref={pivotRef} position={[sign * (ROOM.doorwayWidth / 2), 0, 0]}>
      {/* Frame: two stiles and two rails around the glazed opening. */}
      {[-1, 1].map((edge) => (
        <mesh
          key={edge}
          castShadow
          position={[centerX + (edge * (DOOR_WIDTH - stile)) / 2, DOOR_HEIGHT / 2, 0]}
        >
          <boxGeometry args={[stile, DOOR_HEIGHT, 0.07]} />
          <primitive object={M.blackenedWood} attach="material" />
        </mesh>
      ))}
      {[0.055, DOOR_HEIGHT - 0.055].map((y) => (
        <mesh key={y} castShadow position={[centerX, y, 0]}>
          <boxGeometry args={[DOOR_WIDTH - 0.04, 0.11, 0.07]} />
          <primitive object={M.blackenedWood} attach="material" />
        </mesh>
      ))}

      <mesh position={[centerX, DOOR_HEIGHT / 2, 0]}>
        <boxGeometry args={[DOOR_WIDTH - 0.24, DOOR_HEIGHT - 0.2, 0.02]} />
        <primitive object={M.smokedGlass} attach="material" />
      </mesh>

      {/* Vertical brass pull on the leading edge. */}
      <mesh position={[sign * (DOOR_WIDTH - 0.16), DOOR_HEIGHT * 0.5, 0.06]}>
        <cylinderGeometry args={[0.016, 0.016, DOOR_HEIGHT * 0.52, 8]} />
        <primitive object={M.brass} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * `open` sets a target hinge angle; each panel damps toward it in useFrame
 * for a smooth, weighted swing rather than an instant snap.
 */
export default function EntranceDoors({ open }: { open: boolean }) {
  return (
    <group position={[0, 0, ROOM.entranceZ + 0.06]}>
      <DoorPanel side="left" open={open} />
      <DoorPanel side="right" open={open} />
    </group>
  );
}
