import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ENTRY_REST_Z, EYE_HEIGHT, ROOM } from "@/lib/three/room-config";

const DURATION = 3.2; // seconds
const START_Z = ROOM.vestibuleZ + 1;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * The arrival shot: a slow dolly through the doors that comes to rest just
 * inside the threshold, with the island, the flanking figures and the lit
 * back alcove all in frame.
 *
 * Player control is withheld until this finishes, so nobody's first frame of
 * the boutique is a stationary view down an empty corridor.
 */
export default function CinematicEntry({
  active,
  onComplete,
}: {
  active: boolean;
  onComplete: () => void;
}) {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const finished = useRef(false);

  useFrame((_, rawDelta) => {
    if (!active || finished.current) return;

    // Same reasoning as the movement clamp: a stall during the first frames
    // (shader compilation, texture generation) would otherwise swallow most
    // of the dolly and drop the player at the rest point with no shot at all.
    elapsed.current += Math.min(rawDelta, 0.1);
    const t = Math.min(1, elapsed.current / DURATION);
    const eased = easeInOutCubic(t);

    camera.position.x = 0;
    camera.position.z = THREE.MathUtils.lerp(START_Z, ENTRY_REST_Z, eased);
    // Starts a touch high and settles to eye level — reads as stepping in
    // rather than sliding on rails.
    camera.position.y = EYE_HEIGHT + 0.14 * (1 - eased);

    if (t >= 1) {
      finished.current = true;
      onComplete();
    }
  });

  return null;
}
