"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { COLOR, GARMENT_LIGHTING, QUALITY, type QualityTier } from "@/lib/design/tokens";

/**
 * The environment the garment lives in.
 *
 * Explicitly NOT a room. Prototype A is the walkable boutique; building a
 * second one around a single garment would put the set in competition with
 * the thing it is meant to present. What is here instead is a cyclorama —
 * an enclosing dark shell with no visible corners — which is what a fashion
 * studio actually looks like and which gives light somewhere to fall off to
 * without ever drawing an edge the eye can catch on.
 *
 * The lighting is a three-point rig, hard key and cool fill, with a warm rim
 * behind. The single brand note is a faint oxblood bounce off the floor: not
 * enough to read as a red light, enough that the garment's lower folds carry
 * a trace of it. That is the whole 5% accent budget, spent once.
 */

export default function GarmentStage({
  tier,
  radius = 6,
  floorY = -1.06,
}: {
  tier: QualityTier;
  /** Cyclorama radius. Larger reads as a bigger, emptier space. */
  radius?: number;
  floorY?: number;
}) {
  const settings = QUALITY[tier];

  const shellMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLOR.void,
        roughness: 0.96,
        metalness: 0,
        side: THREE.BackSide,
      }),
    [],
  );

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#121110",
        // Just glossy enough to return a pool of the key light, which is what
        // tells the eye there is a floor at all. Any lower and the garment
        // floats in undifferentiated black.
        roughness: 0.62,
        metalness: 0.1,
        envMapIntensity: 0.4,
      }),
    [],
  );

  return (
    <>
      {/* --- Image-based light -------------------------------------- */}
      {/*
        Built from lightformers rather than an HDRI: a downloaded environment
        map would be a network request on the critical path of the opening
        frame, and everything this scene needs from an env map is a couple of
        soft sources for the fabric's sheen to pick up.
        `frames={1}` bakes it once — nothing in it ever moves.
      */}
      <Environment resolution={settings.envResolution} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#fff1e0"
          position={[2, 3, 2]}
          scale={[4, 6, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#93a6c2"
          position={[-3, 1, 1]}
          scale={[3, 5, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="ring"
          intensity={0.9}
          color="#ffd8bd"
          position={[-1, 2, -3]}
          scale={3}
          target={[0, 0, 0]}
        />
      </Environment>

      {/* --- Direct light ------------------------------------------- */}
      <ambientLight
        color={GARMENT_LIGHTING.ambient.color}
        intensity={GARMENT_LIGHTING.ambient.intensity}
      />

      <spotLight
        color={GARMENT_LIGHTING.key.color}
        intensity={GARMENT_LIGHTING.key.intensity}
        position={GARMENT_LIGHTING.key.position}
        angle={GARMENT_LIGHTING.key.angle}
        penumbra={GARMENT_LIGHTING.key.penumbra}
        distance={14}
        decay={2}
        castShadow={settings.shadows}
        shadow-mapSize-width={settings.shadowMapSize}
        shadow-mapSize-height={settings.shadowMapSize}
        // Peter-panning versus acne is a close call on a surface this
        // crumpled; a small normal bias resolves both without the shadow
        // detaching from the hem.
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      />

      <directionalLight
        color={GARMENT_LIGHTING.fill.color}
        intensity={GARMENT_LIGHTING.fill.intensity}
        position={GARMENT_LIGHTING.fill.position}
      />

      {settings.accentLights && (
        <>
          <pointLight
            color={GARMENT_LIGHTING.rim.color}
            intensity={GARMENT_LIGHTING.rim.intensity}
            position={GARMENT_LIGHTING.rim.position}
            distance={9}
            decay={2}
          />
          <pointLight
            color={GARMENT_LIGHTING.bounce.color}
            intensity={GARMENT_LIGHTING.bounce.intensity}
            position={GARMENT_LIGHTING.bounce.position}
            distance={5}
            decay={2}
          />
        </>
      )}

      {/* --- Set ---------------------------------------------------- */}
      <mesh material={shellMaterial} position={[0, floorY + radius * 0.7, 0]}>
        <cylinderGeometry args={[radius, radius, radius * 1.6, 32, 1, true]} />
      </mesh>

      <mesh
        material={floorMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, floorY, 0]}
        receiveShadow={settings.shadows}
      >
        <circleGeometry args={[radius, 48]} />
      </mesh>

      {/*
        NO CONTACT-SHADOW PASS.

        drei's ContactShadows renders the scene from the floor upward into an
        offscreen depth target, and it has no way to exclude a mesh. The floor
        plane sits four millimetres below its capture plane and well inside
        its `far`, so the floor registered as an occluder covering the entire
        frame — the quad came out uniformly dark, with hard straight edges,
        and read as a riser the garment was standing on rather than as a
        shadow. Shrinking it or softening it only moved the rectangle.

        The key light already casts a real shadow: the garment's meshes set
        castShadow and the floor receiveShadow. That shadow has the right
        shape, falls in the right direction for the rig, and costs one map we
        are already paying for.
      */}
    </>
  );
}
