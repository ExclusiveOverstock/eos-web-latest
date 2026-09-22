import { Environment, Lightformer, PerspectiveCamera } from "@react-three/drei";
import Boutique from "./Boutique";
import CinematicEntry from "./CinematicEntry";
import EntranceDoors from "./EntranceDoors";
import PlayerControls from "./PlayerControls";
import { EYE_HEIGHT, ROOM } from "@/lib/three/room-config";
import type { InputState } from "@/lib/three/input-state";

/**
 * Ambient light in here is deliberately low. Almost all of the illumination
 * comes from the ceiling system's cove, downlights and track spots, which is
 * what gives the room its light hierarchy — merchandise brightest, walls
 * grazed, negative space allowed to fall away. The hemisphere and ambient
 * terms only lift the floor of the image so nothing crushes to pure black.
 */
export default function Scene({
  input,
  isMobile,
  entered,
  introDone,
  onIntroComplete,
  onLockChange,
}: {
  input: InputState;
  isMobile: boolean;
  entered: boolean;
  introDone: boolean;
  onIntroComplete: () => void;
  onLockChange?: (locked: boolean) => void;
}) {
  return (
    <>
      <PerspectiveCamera
        makeDefault
        // 58 was wide enough that anything near the edge of frame stretched
        // badly — mannequins at the sides of the aisle came out distorted.
        fov={52}
        near={0.1}
        far={70}
        position={[0, EYE_HEIGHT, ROOM.vestibuleZ + 1]}
        // three's default camera looks down -z; the store is at +z.
        rotation={[0, Math.PI, 0]}
      />

      {/*
        A locally-rendered environment map, built from the light shapes below
        rather than a downloaded HDRI — the brass, the smoked glass and the
        lacquered floor all need something to reflect, and this keeps the
        route's payload to the JS bundle alone. `frames={1}` bakes it once.
      */}
      <Environment resolution={128} frames={1}>
        <color attach="background" args={["#0d0c0a"]} />
        {/* Warm ceiling plane, mirroring the cove wash. This is doing most of
            the room's general illumination: image-based light costs nothing
            per fragment, where every extra point or spot light is another
            term in the shader for every surface in the store. Raising these
            is how the boutique gets readable without a light budget blowout. */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#ffd6a4"
          position={[0, 6, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[12, 18, 1]}
        />
        {/* Cooler bounce off the pale niches, so metal isn't uniformly gold. */}
        <Lightformer
          form="rect"
          intensity={1.3}
          color="#a7aeb8"
          position={[-6, 2.2, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[14, 4, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.3}
          color="#a7aeb8"
          position={[6, 2.2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[14, 4, 1]}
        />
        {/* Bounce back up off the lacquered floor. */}
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#b08a5e"
          position={[0, -1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[12, 18, 1]}
        />
        {/* The lit alcove at the end of the room. */}
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#ffc98d"
          position={[0, 1.6, 11]}
          rotation={[0, Math.PI, 0]}
          scale={[3.5, 3, 1]}
        />
      </Environment>

      <hemisphereLight args={["#5c5342", "#17150f", 0.85]} />
      <ambientLight intensity={0.26} color="#cbb79b" />

      <Boutique isMobile={isMobile} />
      <EntranceDoors open={entered} />

      <CinematicEntry active={entered && !introDone} onComplete={onIntroComplete} />

      <PlayerControls
        input={input}
        isMobile={isMobile}
        active={entered && introDone}
        onLockChange={onLockChange}
      />
    </>
  );
}
