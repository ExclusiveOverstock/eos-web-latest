"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { QUALITY } from "@/lib/design/tokens";
import { useQuality } from "@/lib/three/quality";
import { useReducedMotion } from "framer-motion";
import GarmentScene, { type ProgressSource } from "./GarmentScene";
import { bindGarmentInput, createGarmentInput } from "./garment-input";
import { garmentAssetFor, type CameraState } from "./garment-config";

/**
 * The reusable garment experience.
 *
 * One component serves the homepage hero, the product page and Prototype B;
 * what differs between them is the choreography passed in, not the machinery.
 * It owns the WebGL context, the gesture bindings and the quality tier, and
 * nothing above it needs to know Three.js exists.
 *
 * Scroll progression is supplied by the host as a ref rather than a prop:
 * the host knows how its own layout maps to progress (a pinned section, a
 * tall scroller, a fixed value), and passing a ref keeps every update out of
 * React's render path.
 */

export type InteractiveGarmentProps = {
  /** Product handle — resolves the 3D asset through the registry. */
  handle: string;
  /** GLB path from the catalog, overriding the registry when present. */
  assetSrc?: string | null;
  sequence: readonly CameraState[];
  /**
   * 0–1 through `sequence`. A Framer Motion MotionValue satisfies this
   * directly. Omit it to hold on the sequence's first state.
   */
  progress?: ProgressSource;
  entrance?: boolean;
  /** Desktop wheel-zoom. Off by default; the page's scroll belongs to the page. */
  allowWheelZoom?: boolean;
  /** Fires once the first frame has been drawn — drives the loading curtain. */
  onReady?: () => void;
  className?: string;
};

/** Signals the first painted frame. */
function FirstFrame({ onReady }: { onReady?: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onReady?.();
  });
  return null;
}

export default function InteractiveGarment({
  handle,
  assetSrc,
  sequence,
  progress,
  entrance = false,
  allowWheelZoom = false,
  onReady,
  className = "",
}: InteractiveGarmentProps) {
  const container = useRef<HTMLDivElement>(null);
  const held = useMemo<ProgressSource>(() => ({ get: () => 0 }), []);
  const input = useMemo(() => createGarmentInput(), []);
  const asset = useMemo(() => garmentAssetFor(handle, assetSrc), [handle, assetSrc]);
  const { tier, supported } = useQuality();
  const calm = useReducedMotion() ?? false;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element || !tier) return;
    return bindGarmentInput(element, input, { allowWheelZoom });
  }, [input, tier, allowWheelZoom]);

  // A context loss on a weak device should degrade to the still frame rather
  // than leave a black rectangle where the hero was.
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const onLost = () => setFailed(true);
    element.addEventListener("webglcontextlost", onLost, true);
    return () => element.removeEventListener("webglcontextlost", onLost, true);
  }, []);

  const unavailable = !supported || failed;

  useEffect(() => {
    if (unavailable) onReady?.();
  }, [unavailable, onReady]);

  return (
    <div
      ref={container}
      className={`relative ${className}`}
      // The page keeps the vertical axis; only sideways gestures reach the
      // garment. This one line is what makes the experience usable on a phone.
      style={{ touchAction: "pan-y" }}
      aria-hidden="true"
    >
      {tier && !unavailable && (
        <Canvas
          dpr={QUALITY[tier].dpr}
          gl={{
            antialias: QUALITY[tier].antialias,
            alpha: false,
            powerPreference: "high-performance",
            // The garment is the only thing in frame and it never moves fast;
            // preserving the buffer costs memory for nothing.
            preserveDrawingBuffer: false,
          }}
          shadows={QUALITY[tier].shadows}
          camera={{ position: [0, 0, 4.6], fov: 32, near: 0.1, far: 40 }}
          onCreated={({ gl, scene }) => {
            // Filmic roll-off. A hard key light on pale cloth against black
            // clips instantly under linear tone mapping, and a clipped
            // highlight on fabric reads as a rendering error.
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = sequence[0]?.exposure ?? 1;
            // PCFSoftShadowMap is deprecated as of three r185 and silently
            // downgrades to this anyway. This is the garment's only shadow —
            // see the note in GarmentStage on why the contact-shadow pass
            // was removed.
            gl.shadowMap.type = THREE.PCFShadowMap;
            scene.background = new THREE.Color("#0a0909");
          }}
        >
          <FirstFrame onReady={onReady} />
          <GarmentScene
            asset={asset}
            sequence={sequence}
            progress={progress ?? held}
            input={input}
            tier={tier}
            calm={calm}
            entrance={entrance && !calm}
          />
        </Canvas>
      )}

      {/*
        The no-WebGL frame. Not an apology and not an empty box: the same
        void, the same vignette, and the type still lands on top of it, so a
        device that cannot run the scene still gets an EOS page rather than a
        broken one.
      */}
      {unavailable && (
        <div className="eos-grain eos-vignette absolute inset-0 bg-void">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(60% 55% at 50% 38%, #211e1d 0%, transparent 70%)",
            }}
          />
        </div>
      )}
    </div>
  );
}
