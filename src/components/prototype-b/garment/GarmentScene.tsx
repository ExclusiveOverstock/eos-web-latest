"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { garmentMaterial } from "@/lib/prototype-b/fabric";
import { hoodieGeometry } from "@/lib/prototype-b/hoodie-geometry";
import {
  B_LIGHTING,
  B_QUALITY,
  type BQuality,
} from "@/lib/prototype-b/tokens";
import {
  CAMERA,
  EXPOSURE,
  sampleTrack,
  type GarmentInput,
} from "@/lib/prototype-b/interaction";
import { garmentAsset } from "./garment-asset";

/**
 * The scene: one garment, one lighting rig, and a camera on rails.
 *
 * Everything that moves is driven from the shared input object inside a
 * single `useFrame`. There is no React state in the loop and no per-frame
 * allocation — the vectors below are created once and mutated in place,
 * because at 60fps a `new Vector3()` per frame is a garbage-collection
 * pause, and a GC pause during a slow camera move is exactly where the
 * illusion of weight breaks.
 */

/** Damps a value toward a target, frame-rate independently. */
function damp(current: number, target: number, lambda: number, dt: number) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}

/**
 * Drops the garment so its middle sits on the origin.
 *
 * The geometry is authored hem-at-zero, which is the right convention for an
 * asset — a real GLB exported with its origin at the floor drops straight in.
 * It does mean the scene has to do this once, here, rather than every camera
 * keyframe carrying the same offset.
 */
const HANG_OFFSET = -0.48;

function ProceduralGarment({
  quality,
  material,
}: {
  quality: BQuality;
  material: THREE.Material;
}) {
  const geometry = useMemo(
    () => hoodieGeometry(B_QUALITY[quality].segments),
    [quality],
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      castShadow={B_QUALITY[quality].shadows}
      receiveShadow={B_QUALITY[quality].shadows}
    />
  );
}

function LoadedGarment({ src, scale = 1 }: { src: string; scale?: number }) {
  const { scene } = useGLTF(src);

  // Re-centre and normalise height so a real capture drops into the same
  // framing the camera was choreographed against, whatever its export origin.
  const prepared = useMemo(() => {
    const root = scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const centre = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(centre);

    const normalise = size.y > 0 ? 0.82 / size.y : 1;
    root.position.set(-centre.x * normalise, -box.min.y * normalise, -centre.z * normalise);
    root.scale.setScalar(normalise * scale);
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return root;
  }, [scene, scale]);

  return <primitive object={prepared} />;
}

export default function GarmentScene({
  input,
  quality,
  lotCode,
  reducedMotion,
}: {
  input: GarmentInput;
  quality: BQuality;
  lotCode: string;
  reducedMotion: boolean;
}) {
  const settings = B_QUALITY[quality];
  const asset = garmentAsset(lotCode);

  const { camera, gl } = useThree();
  const pivot = useRef<THREE.Group>(null);
  const keyLight = useRef<THREE.SpotLight>(null);
  const rimLight = useRef<THREE.PointLight>(null);

  const material = useMemo(
    () => garmentMaterial(settings.sheen),
    [settings.sheen],
  );
  useEffect(() => () => material.dispose(), [material]);

  // Smoothed copies of the tracked values, so the camera lags the scroll
  // slightly instead of being nailed to it. Scroll on a trackpad is jittery;
  // a camera that answers it exactly reads as nervous.
  const smoothed = useRef({
    distance: 3.5,
    height: -0.18,
    target: 0.02,
    orbit: -0.16,
    offsetX: 0,
    exposure: 0.55,
    yaw: 0,
    pitch: 0,
    zoom: 0,
  });

  // Reused per frame — see the note above about allocation in the loop.
  const lookAt = useRef(new THREE.Vector3());
  const targetPos = useRef(new THREE.Vector3());

  useFrame((state, rawDelta) => {
    // A stalled frame — shader compilation, a GC pause, a backgrounded tab —
    // otherwise lands as a jump-cut in what is meant to be one continuous
    // shot. Capping the step turns that into a slower move instead.
    const dt = Math.min(rawDelta, 0.1);
    const s = smoothed.current;
    const p = input.progress;

    // ---- Drag, and the throw after release --------------------------
    if (!input.dragging) {
      input.dragYaw += input.spinVelocity * dt;
      input.spinVelocity = damp(input.spinVelocity, 0, 3.2, dt);
    }

    s.yaw = damp(s.yaw, input.dragYaw, 9, dt);
    s.pitch = damp(s.pitch, input.dragPitch, 9, dt);
    s.zoom = damp(s.zoom, input.zoom, 6, dt);

    // ---- Camera on the scroll rails ---------------------------------
    const lag = reducedMotion ? 40 : 5.5;
    s.distance = damp(s.distance, sampleTrack(CAMERA.distance, p), lag, dt);
    s.height = damp(s.height, sampleTrack(CAMERA.height, p), lag, dt);
    s.target = damp(s.target, sampleTrack(CAMERA.target, p), lag, dt);
    s.orbit = damp(s.orbit, sampleTrack(CAMERA.orbit, p), lag, dt);
    s.offsetX = damp(s.offsetX, sampleTrack(CAMERA.offsetX, p), lag, dt);
    s.exposure = damp(s.exposure, sampleTrack(EXPOSURE, p), 4, dt);

    const time = state.clock.elapsedTime;

    // Idle: a garment hanging in still air is not perfectly still, but it is
    // very nearly so. Amplitudes here are deliberately at the threshold of
    // perception — enough that the piece reads as suspended rather than
    // pasted on, never enough to look like it is being animated at you.
    const breathing = reducedMotion ? 0 : Math.sin(time * 0.31) * 0.012;
    const swayY = reducedMotion ? 0 : Math.sin(time * 0.23) * 0.021;
    const swayZ = reducedMotion ? 0 : Math.cos(time * 0.19) * 0.011;

    // The garment is simply present, at rest, from the first frame. There is
    // no entrance animation: the page opens on the piece rather than on a
    // performance of the piece arriving.
    if (pivot.current) {
      const parallaxYaw = reducedMotion ? 0 : input.pointerX * 0.055;
      const parallaxPitch = reducedMotion ? 0 : input.pointerY * 0.03;

      pivot.current.rotation.y = s.orbit + s.yaw + swayY * 0.4 + parallaxYaw;
      pivot.current.rotation.x = s.pitch + swayZ * 0.3 + parallaxPitch;
      pivot.current.rotation.z = swayZ * 0.5;

      pivot.current.position.set(
        s.offsetX + swayZ * 0.05,
        breathing + HANG_OFFSET,
        0,
      );
    }

    // ---- Camera ------------------------------------------------------
    const distance = s.distance * (1 - s.zoom * 0.42);
    targetPos.current.set(0, s.height, distance);
    camera.position.lerp(targetPos.current, 1 - Math.exp(-8 * dt));

    // Aim at the garment's middle, not the world origin. The geometry is
    // built with its hem at y=0, so leaving this at zero pointed the camera
    // at the bottom hem and pushed the hood off the top of frame.
    lookAt.current.set(s.offsetX * 0.55, s.target, 0);
    camera.lookAt(lookAt.current);

    // ---- Exposure ----------------------------------------------------
    // Driving the renderer's exposure rather than every light's intensity:
    // one uniform, and the ratios inside the rig stay exactly as designed.
    gl.toneMappingExposure = s.exposure * (input.hovering ? 1.05 : 1);

    if (keyLight.current) {
      // The key drifts a few centimetres across the story so the highlight
      // travels over the cloth instead of sitting in one place.
      keyLight.current.position.x = B_LIGHTING.key.position[0] + Math.sin(p * 2.4) * 0.5;
    }
    if (rimLight.current) {
      rimLight.current.intensity =
        B_LIGHTING.rim.intensity * (0.75 + Math.min(1, p * 3) * 0.25);
    }
  });

  return (
    <>
      {/*
        A small studio built from emissive planes and baked once, rather than
        a downloaded HDRI. The garment's sheen and the faint specular on the
        cords need something to reflect, and this keeps the route's payload
        to the JS bundle alone — no environment file to fetch before the
        opening can start.
      */}
      <Environment resolution={settings.envResolution} frames={1}>
        <color attach="background" args={["#050505"]} />
        <Lightformer
          form="rect"
          intensity={2.0}
          color="#fff6ec"
          position={[3, 4, 3]}
          scale={[6, 8, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.85}
          color="#9fb0cc"
          position={[-4, 1, 2]}
          scale={[5, 6, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#e8dcd0"
          position={[-2, 2, -4]}
          scale={[4, 4, 1]}
          target={[0, 0, 0]}
        />
      </Environment>

      <ambientLight
        color={B_LIGHTING.ambient.color}
        intensity={B_LIGHTING.ambient.intensity}
      />

      {/* Key — hard, warm, high and camera-right. Carves the silhouette. */}
      <spotLight
        ref={keyLight}
        color={B_LIGHTING.key.color}
        intensity={B_LIGHTING.key.intensity}
        position={B_LIGHTING.key.position}
        angle={B_LIGHTING.key.angle}
        penumbra={B_LIGHTING.key.penumbra}
        distance={16}
        decay={2}
        castShadow={settings.shadows}
        shadow-mapSize={[settings.shadowMapSize, settings.shadowMapSize]}
        shadow-bias={-0.0012}
        shadow-normalBias={0.018}
      />

      {/* Fill — cool, soft, a fraction of the key. Keeps shadow readable. */}
      <directionalLight
        color={B_LIGHTING.fill.color}
        intensity={B_LIGHTING.fill.intensity}
        position={B_LIGHTING.fill.position}
      />

      {/* Rim — the most important light against a black ground. */}
      <pointLight
        ref={rimLight}
        color={B_LIGHTING.rim.color}
        intensity={B_LIGHTING.rim.intensity}
        position={B_LIGHTING.rim.position}
        distance={12}
        decay={2}
      />

      {settings.sheen && (
        <pointLight
          color={B_LIGHTING.kick.color}
          intensity={B_LIGHTING.kick.intensity}
          position={B_LIGHTING.kick.position}
          distance={7}
          decay={2}
        />
      )}

      <group ref={pivot}>
        {asset.src ? (
          <LoadedGarment src={asset.src} scale={asset.scale} />
        ) : (
          <ProceduralGarment quality={quality} material={material} />
        )}
      </group>
    </>
  );
}
