"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { QUALITY, type QualityTier } from "@/lib/design/tokens";
import GarmentMesh from "./GarmentMesh";
import GarmentStage from "./GarmentStage";
import type { CameraState, GarmentAsset } from "./garment-config";
import type { GarmentInput } from "./garment-input";

/**
 * The camera director and the garment rig.
 *
 * Everything that moves in a garment experience moves from here, driven by
 * two numbers written from outside the React tree: a scroll progress ref and
 * a pointer input object. Neither passes through state, so a full page of
 * scrolling re-renders nothing — the scene tree is mounted once and the
 * animation loop reads the numbers.
 *
 * The camera never snaps to the scroll position. It is damped toward it, so
 * a flick of the wheel produces a long settle rather than a jump cut. That
 * single choice is most of what separates "cinematic" from "scrubbing a
 * timeline".
 */

/**
 * Anything that can hand the frame loop a number.
 *
 * Framer Motion's MotionValue satisfies this as-is, which is the point: the
 * scroll position is *pulled* once per frame rather than pushed through a
 * change subscription. A subscription has to fire, be ordered correctly
 * against the render loop, and survive remounts; pulling cannot go stale.
 */
export type ProgressSource = { get(): number };

type Props = {
  asset: GarmentAsset;
  sequence: readonly CameraState[];
  /** 0–1 through the sequence, sampled every frame. */
  progress: ProgressSource;
  input: GarmentInput;
  tier: QualityTier;
  /** prefers-reduced-motion. Calmer, not absent. */
  calm: boolean;
  /** Play the drop-in entrance. The homepage does; a product page does not. */
  entrance?: boolean;
};

const ENTRANCE_SECONDS = 3.2;

/** Expo-out, matching the CSS easing so 2D and 3D motion feel like one system. */
function easeOutExpo(t: number) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Interpolates the choreography at a given progress.
 *
 * Writes into caller-owned scratch objects. Called every frame, so returning
 * fresh vectors here would allocate three objects per frame per experience
 * and hand the GC a steady drip of work during the one moment on the site
 * where a dropped frame is most visible.
 */
function sampleSequence(
  sequence: readonly CameraState[],
  progress: number,
  outPosition: THREE.Vector3,
  outTarget: THREE.Vector3,
) {
  const n = sequence.length;
  if (n === 1) {
    const only = sequence[0];
    outPosition.set(...only.position);
    outTarget.set(...only.target);
    return { fov: only.fov, spin: only.spin, exposure: only.exposure };
  }

  const x = THREE.MathUtils.clamp(progress, 0, 1) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  const raw = x - i;
  const f = raw * raw * (3 - 2 * raw);

  const a = sequence[i];
  const b = sequence[i + 1];

  outPosition.set(...a.position).lerp(scratch.set(...b.position), f);
  outTarget.set(...a.target).lerp(scratch.set(...b.target), f);

  return {
    fov: THREE.MathUtils.lerp(a.fov, b.fov, f),
    spin: THREE.MathUtils.lerp(a.spin, b.spin, f),
    exposure: THREE.MathUtils.lerp(a.exposure, b.exposure, f),
  };
}

/**
 * Shared scratch vector. Safe to keep at module scope despite two garment
 * experiences potentially being mounted at once: every write is consumed
 * within the same synchronous expression, and useFrame callbacks never
 * interleave.
 */
const scratch = new THREE.Vector3();

export default function GarmentScene({
  asset,
  sequence,
  progress,
  input,
  tier,
  calm,
  entrance = false,
}: Props) {
  const rig = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();

  const settings = QUALITY[tier];
  const detail = tier === "low" ? "low" : "high";

  // Per-instance animation state, held outside React for the same reason the
  // inputs are: none of it should ever cause a render.
  const state = useMemo(
    () => ({
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      smoothedTarget: new THREE.Vector3(),
      spin: 0,
      elapsed: 0,
      started: false,
    }),
    [],
  );

  useFrame((_, rawDelta) => {
    // A tab restored from the background delivers one enormous delta; damping
    // against it teleports the camera. Clamping costs nothing and removes a
    // whole class of "why did it jump" bug.
    const delta = Math.min(rawDelta, 0.1);
    state.elapsed += delta;

    const sampled = sampleSequence(sequence, progress.get(), state.position, state.target);

    /* --- Camera ------------------------------------------------- */

    // Parallax. Small enough that most people never consciously notice it and
    // large enough that the scene stops feeling like a flat render.
    const parallax = calm ? 0 : 0.12;
    state.position.x += input.pointerX * parallax;
    state.position.y += -input.pointerY * parallax * 0.6;

    // Zoom rides the view axis, so pinching in moves the camera toward what
    // the beat was already framing rather than toward the world origin.
    if (input.zoom !== 0) {
      scratch.copy(state.position).sub(state.target).normalize();
      state.position.addScaledVector(scratch, input.zoom);
    }

    // Slower for the camera than the aim point: the frame settles after the
    // subject does, which is how a real operator lands a move.
    const lambda = calm ? 9 : 2.6;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, state.position.x, lambda, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, state.position.y, lambda, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, state.position.z, lambda, delta);

    state.smoothedTarget.x = THREE.MathUtils.damp(state.smoothedTarget.x, state.target.x, lambda * 1.4, delta);
    state.smoothedTarget.y = THREE.MathUtils.damp(state.smoothedTarget.y, state.target.y, lambda * 1.4, delta);
    state.smoothedTarget.z = THREE.MathUtils.damp(state.smoothedTarget.z, state.target.z, lambda * 1.4, delta);
    camera.lookAt(state.smoothedTarget);

    const perspective = camera as THREE.PerspectiveCamera;
    const fov = THREE.MathUtils.damp(perspective.fov, sampled.fov, lambda, delta);
    if (Math.abs(fov - perspective.fov) > 0.001) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }

    // Exposure carries the lighting states. Moving one number is far cheaper
    // than animating five light intensities, and tone mapping applies it
    // after shading, so highlights roll off instead of clipping.
    gl.toneMappingExposure = THREE.MathUtils.damp(
      gl.toneMappingExposure,
      sampled.exposure,
      lambda,
      delta,
    );

    /* --- Garment ------------------------------------------------ */

    if (!rig.current) return;

    // Momentum after a flick, bled off over about a second.
    if (!input.dragging && Math.abs(input.yawVelocity) > 1e-5) {
      input.yaw += input.yawVelocity;
      input.yawVelocity *= Math.pow(0.02, delta);
    }

    state.spin = THREE.MathUtils.damp(state.spin, sampled.spin + input.yaw, input.dragging ? 18 : 3.4, delta);
    rig.current.rotation.y = state.spin;

    if (calm) {
      rig.current.position.y = 0;
      rig.current.rotation.z = 0;
      return;
    }

    // Idle: a long, shallow rise and fall plus an even slower list to one
    // side. The periods are deliberately coprime so the loop never visibly
    // repeats, and the amplitudes are small enough to read as air moving
    // rather than as an animation playing.
    const t = state.elapsed;
    const float = Math.sin(t * 0.44) * 0.016 + Math.sin(t * 0.19) * 0.009;
    const list = Math.sin(t * 0.31) * 0.008;

    if (entrance && !state.started) {
      // Enters from above and settles — the garment arrives in the frame
      // rather than being switched on in it.
      const e = easeOutExpo(Math.min(1, t / ENTRANCE_SECONDS));
      rig.current.position.y = float + (1 - e) * 1.9;
      rig.current.rotation.z = list + (1 - e) * 0.14;
      rig.current.rotation.x = (1 - e) * -0.1;
      if (t >= ENTRANCE_SECONDS) state.started = true;
      return;
    }

    rig.current.position.y = float;
    rig.current.rotation.z = list;
    rig.current.rotation.x = 0;
  });

  return (
    <>
      <GarmentStage tier={tier} />
      <group ref={rig}>
        <GarmentMesh
          asset={asset}
          detail={detail}
          richMaterial={tier !== "low"}
          castShadow={settings.shadows}
        />
      </group>
    </>
  );
}
