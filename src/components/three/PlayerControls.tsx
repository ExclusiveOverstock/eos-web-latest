import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { WALK_BOUNDS, EYE_HEIGHT } from "@/lib/three/room-config";
import { OBSTACLES, PLAYER_RADIUS } from "@/lib/three/store-layout";
import type { InputState } from "@/lib/three/input-state";

const MOVE_SPEED = 3.2; // meters/second at full input
const ACCEL = 10; // how quickly velocity approaches its target — smooths starts/stops
/**
 * Ceiling on the per-frame timestep.
 *
 * Movement is integrated as speed x delta, so a single long frame — a GC
 * pause, shader compilation on first entry, or returning to a tab that was
 * throttled in the background — advances the player by however many metres
 * that stall was worth. Unclamped, one 500ms hitch walks you 1.6m; a multi
 * second stall puts you straight through the display island and out the back
 * wall, because collision only ever sees the position after the jump. Capping
 * the step means a stall costs you distance rather than teleporting you
 * through the store.
 */
const MAX_DELTA = 0.1; // seconds
const TOUCH_LOOK_SENSITIVITY = 0.0025;
const PITCH_LIMIT = 1.3; // radians, keeps the player from flipping the view over

/**
 * Push the player out of any fixture they've walked into.
 *
 * Each obstacle is an axis-aligned footprint inflated by the player's radius;
 * if the camera lands inside one, it's ejected across whichever edge is
 * nearest. Resolving on the shallowest axis is what produces sliding: walking
 * diagonally into the display island moves you along its face instead of
 * stopping you dead, which is the difference between browsing a shop and
 * bumping around a level. Reused vector-free maths — this runs every frame.
 */
function resolveCollisions(x: number, z: number): [number, number] {
  let px = x;
  let pz = z;

  for (const obstacle of OBSTACLES) {
    const minX = obstacle.minX - PLAYER_RADIUS;
    const maxX = obstacle.maxX + PLAYER_RADIUS;
    const minZ = obstacle.minZ - PLAYER_RADIUS;
    const maxZ = obstacle.maxZ + PLAYER_RADIUS;
    if (px <= minX || px >= maxX || pz <= minZ || pz >= maxZ) continue;

    const toLeft = px - minX;
    const toRight = maxX - px;
    const toNear = pz - minZ;
    const toFar = maxZ - pz;
    const shallowest = Math.min(toLeft, toRight, toNear, toFar);

    if (shallowest === toLeft) px = minX;
    else if (shallowest === toRight) px = maxX;
    else if (shallowest === toNear) pz = minZ;
    else pz = maxZ;
  }

  return [px, pz];
}

const FORWARD_KEYS = ["KeyW", "ArrowUp"];
const BACK_KEYS = ["KeyS", "ArrowDown"];
const LEFT_KEYS = ["KeyA", "ArrowLeft"];
const RIGHT_KEYS = ["KeyD", "ArrowRight"];

export default function PlayerControls({
  input,
  isMobile,
  active,
  onLockChange,
}: {
  input: InputState;
  isMobile: boolean;
  active: boolean;
  onLockChange?: (locked: boolean) => void;
}) {
  const { camera, gl } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, "YXZ"));
  /**
   * Whether the pointer is currently captured.
   *
   * Held in a ref rather than state because the frame loop reads it every
   * frame and nothing about it should cause a render.
   */
  const locked = useRef(false);

  useEffect(() => {
    camera.position.y = EYE_HEIGHT;
  }, [camera]);

  // Desktop keyboard tracking.
  useEffect(() => {
    if (isMobile) return;
    function onKeyDown(e: KeyboardEvent) {
      input.keys.add(e.code);
    }
    function onKeyUp(e: KeyboardEvent) {
      input.keys.delete(e.code);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      input.keys.clear();
    };
  }, [input, isMobile]);

  /**
   * Drag-to-look, for whenever the pointer is not locked.
   *
   * Pointer Lock is not always available: any embedded or sandboxed context
   * refuses it outright, and the request can simply be denied. Prototype A
   * previously had no answer to that — the keyboard kept working while the
   * view froze, which reads as a broken build rather than a blocked API.
   *
   * The fallback writes into the same lookDelta fields the touch controls
   * use, so the frame loop needs no second code path: locked, the drei
   * controls own the view; unlocked, this does.
   */
  useEffect(() => {
    if (isMobile || !active) return;
    const element = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function onDown(e: PointerEvent) {
      if (locked.current || e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      element.setPointerCapture?.(e.pointerId);
    }

    function onMove(e: PointerEvent) {
      if (!dragging || locked.current) return;
      input.lookDeltaX += e.clientX - lastX;
      input.lookDeltaY += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
    }

    function onUp(e: PointerEvent) {
      dragging = false;
      element.releasePointerCapture?.(e.pointerId);
    }

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
    };
  }, [gl, input, isMobile, active]);

  useFrame((_, rawDelta) => {
    if (!active) return;
    const delta = Math.min(rawDelta, MAX_DELTA);

    // Camera rotation is the source of truth for "which way is forward".
    // On desktop, PointerLockControls already wrote it via its own mousemove
    // listener before this runs. On mobile, we apply our own drag delta.
    euler.current.setFromQuaternion(camera.quaternion);

    if (
      (isMobile || !locked.current) &&
      (input.lookDeltaX !== 0 || input.lookDeltaY !== 0)
    ) {
      euler.current.y -= input.lookDeltaX * TOUCH_LOOK_SENSITIVITY;
      euler.current.x -= input.lookDeltaY * TOUCH_LOOK_SENSITIVITY;
      euler.current.x = THREE.MathUtils.clamp(euler.current.x, -PITCH_LIMIT, PITCH_LIMIT);
      camera.quaternion.setFromEuler(euler.current);
      input.lookDeltaX = 0;
      input.lookDeltaY = 0;
    }

    // Movement input: mobile reads the joystick's continuous values,
    // desktop derives -1/0/1 straight from which keys are currently down.
    let forwardInput = input.forward;
    let strafeInput = input.strafe;

    if (!isMobile) {
      forwardInput = 0;
      strafeInput = 0;
      if (FORWARD_KEYS.some((k) => input.keys.has(k))) forwardInput += 1;
      if (BACK_KEYS.some((k) => input.keys.has(k))) forwardInput -= 1;
      if (RIGHT_KEYS.some((k) => input.keys.has(k))) strafeInput += 1;
      if (LEFT_KEYS.some((k) => input.keys.has(k))) strafeInput -= 1;
    }

    const target = new THREE.Vector3(strafeInput, 0, -forwardInput);
    if (target.lengthSq() > 1) target.normalize();
    target.multiplyScalar(MOVE_SPEED);

    velocity.current.x = THREE.MathUtils.damp(velocity.current.x, target.x, ACCEL, delta);
    velocity.current.z = THREE.MathUtils.damp(velocity.current.z, target.z, ACCEL, delta);

    // Rotate the local velocity into world space using yaw only, so
    // looking up/down never makes the player climb or sink.
    const yaw = euler.current.y;
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);
    const dx = (velocity.current.x * cosY + velocity.current.z * sinY) * delta;
    const dz = (velocity.current.z * cosY - velocity.current.x * sinY) * delta;

    const clampedX = THREE.MathUtils.clamp(
      camera.position.x + dx,
      WALK_BOUNDS.minX,
      WALK_BOUNDS.maxX,
    );
    const clampedZ = THREE.MathUtils.clamp(
      camera.position.z + dz,
      WALK_BOUNDS.minZ,
      WALK_BOUNDS.maxZ,
    );

    // The vestibule is narrower than the sales floor, so squeeze x to the
    // doorway until the player is through it.
    const doorwayLimit = 1.3;
    const inVestibule = clampedZ < WALK_BOUNDS.minZ + 3.4;

    const [resolvedX, resolvedZ] = resolveCollisions(
      inVestibule ? THREE.MathUtils.clamp(clampedX, -doorwayLimit, doorwayLimit) : clampedX,
      clampedZ,
    );

    camera.position.x = resolvedX;
    camera.position.z = resolvedZ;
    camera.position.y = EYE_HEIGHT;
  });

  // Pointer lock is only mounted once the player actually has control —
  // during the arrival dolly a click shouldn't grab the cursor.
  if (isMobile || !active) return null;

  return (
    <PointerLockControls
      onLock={() => {
        locked.current = true;
        onLockChange?.(true);
      }}
      onUnlock={() => {
        locked.current = false;
        onLockChange?.(false);
      }}
    />
  );
}
