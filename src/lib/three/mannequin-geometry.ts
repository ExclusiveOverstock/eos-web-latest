import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * A faceless full-body fashion mannequin, built procedurally and merged into
 * a single BufferGeometry.
 *
 * Built as ~20 separate primitives this figure would cost 20 draw calls
 * apiece; merged once and shared by every instance in the store it costs one.
 * The proportions come from a real 1.80m display form rather than a game
 * character: the torso is a revolved profile squashed on z so its section is
 * elliptical (people are wider than they are deep), limbs taper along their
 * length, and the head is a smooth featureless ovoid.
 */

const HEAD_TOP = 1.8;

/**
 * Torso profile, as (half-width, height) pairs from upper thigh to neck.
 *
 * The profile runs all the way down through the hips so the pelvis is part of
 * the same revolved surface as the chest. Modelling it as a separate sphere
 * leaves a crease where the two meet, and a crease at the hip is the single
 * clearest tell of an articulated artist's dummy rather than a display form.
 */
const TORSO_PROFILE: [number, number][] = [
  // The bottom stays nearly as wide as the thighs' outer envelope and then
  // stops, instead of tapering to a point above them. A profile that narrows
  // faster than the legs widen leaves the thigh tops poking out through the
  // pelvis, which puts a hard step right across the hip.
  [0.0, 0.788], // flat cap, hidden between and behind the thighs
  [0.156, 0.792],
  [0.171, 0.83],
  [0.178, 0.89],
  [0.176, 0.96], // hip, widest point below the waist
  [0.168, 1.04],
  [0.139, 1.13], // waist
  [0.152, 1.23],
  [0.181, 1.33], // chest
  [0.199, 1.415], // shoulder line
  [0.194, 1.452], // held wide before it breaks, so the shoulder reads flat
  [0.156, 1.487], // a profile that rounds straight off the chest to the neck
  [0.098, 1.512], // gives the sloped silhouette of a chess pawn

  [0.062, 1.55], // neck
  [0.061, 1.63],
];

function taperedLimb(
  topRadius: number,
  bottomRadius: number,
  length: number,
  segments = 12,
) {
  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, length, segments, 1);
  geometry.translate(0, -length / 2, 0);
  return geometry;
}

function joint(radius: number) {
  return new THREE.SphereGeometry(radius, 12, 8);
}

/**
 * @param side -1 for the figure's left, +1 for its right. Both halves are
 *   generated from the same code so the form stays symmetrical.
 */
/**
 * Joints are the whole problem with a limb built from primitives: put a
 * sphere at the elbow that is wider than the arm and you get the segmented
 * look of a drawing mannequin. So every filler sphere here is sized at or
 * just under the radius of the narrower limb meeting it, and the two limb
 * sections overlap through it. The sphere fills the inside of the bend and
 * contributes no silhouette of its own.
 */
/**
 * Where a limb section's far end lands.
 *
 * `taperedLimb` hangs down from its origin and is then rotated about z, so a
 * positive tilt swings the free end toward +x for the figure's right side.
 * Deriving the next joint's position from the same formula that placed the
 * limb is the only way to keep them attached — hand-guessing the offset puts
 * the elbow sphere a couple of centimetres off the end of the arm, and the
 * seam that opens up is exactly what makes a figure read as an assembly of
 * parts instead of a body.
 */
function limbEndX(startX: number, side: number, length: number, tilt: number) {
  return startX + side * length * Math.sin(tilt);
}

// The upper arm has to clear the ribcage by enough to leave visible daylight
// between arm and torso. Tucked closer the two silhouettes merge into a
// single mass and the figure stops reading as a body with limbs.
const UPPER_ARM = { length: 0.37, tilt: 0.155 }; // splays out from the ribcage
const FOREARM = { length: 0.35, tilt: -0.055 }; // and comes gently back in
const THIGH = { length: 0.5, tilt: -0.026 };
const CALF = { length: 0.44, tilt: 0.008 };

function buildArm(side: number) {
  const parts: THREE.BufferGeometry[] = [];

  // Deltoid: the one joint allowed to read, because a shoulder genuinely is
  // wider than the arm below it.
  const shoulderX = side * 0.199;
  const shoulderY = 1.425;
  const shoulder = joint(0.058);
  shoulder.scale(1.05, 1.15, 0.85);
  shoulder.translate(shoulderX, 1.412, 0);
  parts.push(shoulder);

  const upper = taperedLimb(0.056, 0.045, UPPER_ARM.length, 14);
  upper.rotateZ(side * UPPER_ARM.tilt);
  upper.translate(shoulderX, shoulderY, 0);
  parts.push(upper);

  const elbowX = limbEndX(shoulderX, side, UPPER_ARM.length, UPPER_ARM.tilt);
  const elbowY = shoulderY - UPPER_ARM.length * Math.cos(UPPER_ARM.tilt);
  const elbow = joint(0.0445);
  elbow.translate(elbowX, elbowY, 0);
  parts.push(elbow);

  // Starts above the elbow so the two sections overlap rather than abut.
  const fore = taperedLimb(0.0455, 0.034, FOREARM.length, 14);
  fore.rotateZ(side * FOREARM.tilt);
  fore.translate(elbowX, elbowY + 0.022, 0);
  parts.push(fore);

  const handX = limbEndX(elbowX, side, FOREARM.length, FOREARM.tilt);
  const hand = joint(0.036);
  hand.scale(0.8, 1.75, 0.52);
  hand.translate(handX, elbowY - 0.3, 0);
  parts.push(hand);

  return parts;
}

function buildLeg(side: number) {
  const parts: THREE.BufferGeometry[] = [];
  const hipX = side * 0.079;
  const hipY = 0.94;

  // Top of the thigh starts up inside the pelvis so there's no seam at the
  // hip — the torso lathe carries the silhouette down past it.
  const thigh = taperedLimb(0.085, 0.061, THIGH.length, 16);
  thigh.rotateZ(side * THIGH.tilt);
  thigh.translate(hipX, hipY, 0);
  parts.push(thigh);

  const kneeX = limbEndX(hipX, side, THIGH.length, THIGH.tilt);
  const kneeY = hipY - THIGH.length * Math.cos(THIGH.tilt);
  const knee = joint(0.0595);
  knee.scale(1, 1.08, 1);
  knee.translate(kneeX, kneeY, 0);
  parts.push(knee);

  const calf = taperedLimb(0.0615, 0.039, CALF.length, 16);
  calf.rotateZ(side * CALF.tilt);
  calf.translate(kneeX, kneeY + 0.024, 0);
  parts.push(calf);

  // Ankle down to a small, simple foot — display forms have no toes.
  const ankleX = limbEndX(kneeX, side, CALF.length, CALF.tilt);
  const ankle = joint(0.038);
  ankle.translate(ankleX, 0.072, 0);
  parts.push(ankle);

  const foot = joint(0.05);
  foot.scale(0.78, 0.5, 1.85);
  foot.translate(ankleX, 0.037, 0.042);
  parts.push(foot);

  return parts;
}

function build(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  const torso = new THREE.LatheGeometry(
    TORSO_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)),
    22,
  );
  // Squash front-to-back: a revolved profile alone gives a cylindrical body.
  torso.scale(1, 1, 0.63);
  parts.push(torso);

  // Featureless ovoid, narrower than a sphere and slightly egg-shaped —
  // a plain ball on a neck reads as a doll.
  const head = joint(0.1);
  head.scale(0.92, 1.32, 1.02);
  head.translate(0, HEAD_TOP - 0.132, 0.005);
  parts.push(head);

  parts.push(...buildArm(-1), ...buildArm(1), ...buildLeg(-1), ...buildLeg(1));

  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error("Failed to merge mannequin geometry");
  merged.computeBoundingSphere();
  return merged;
}

let cache: THREE.BufferGeometry | null = null;

export function mannequinGeometry(): THREE.BufferGeometry {
  if (!cache) cache = build();
  return cache;
}
