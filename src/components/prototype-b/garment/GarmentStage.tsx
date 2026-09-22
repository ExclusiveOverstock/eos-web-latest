"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { B_QUALITY, resolveQuality, type BQuality } from "@/lib/prototype-b/tokens";
import {
  DRAG_SENSITIVITY,
  TOUCH_SENSITIVITY,
  clampPitch,
  type GarmentInput,
} from "@/lib/prototype-b/interaction";
import GarmentScene from "./GarmentScene";

/**
 * The fixed canvas the whole story is told over.
 *
 * It sits behind the page for its entire length rather than being pinned to
 * a hero section, which is what makes the experience read as one continuous
 * shot: the type scrolls past the garment, the garment never leaves.
 *
 * This component owns everything the DOM knows about — pointer capture,
 * wheel, pinch — and writes it into the shared input object. The scene
 * inside reads that object and never re-renders.
 */
export default function GarmentStage({
  input,
  lotCode,
}: {
  input: GarmentInput;
  lotCode: string;
}) {
  // This component is loaded with `ssr: false`, so it only ever renders on
  // the client — both of these can be resolved synchronously in the state
  // initialiser rather than corrected by an effect after first paint. That
  // matters beyond tidiness: picking the quality tier a frame late would
  // build the garment at the wrong resolution and then rebuild it.
  const [quality] = useState<BQuality>(resolveQuality);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const surface = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  /* ---- Pointer ----------------------------------------------------- */
  useEffect(() => {
    const el = surface.current;
    if (!el) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastT = 0;
    /** Active touches, for pinch. */
    const touches = new Map<number, { x: number; y: number }>();
    let pinchStart = 0;
    let zoomStart = 0;

    const onPointerDown = (e: PointerEvent) => {
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (touches.size === 2) {
        const [a, b] = [...touches.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        zoomStart = input.zoom;
        dragging = false;
        input.dragging = false;
        return;
      }

      dragging = true;
      input.dragging = true;
      input.spinVelocity = 0;
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = performance.now();
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      input.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      input.pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      if (touches.has(e.pointerId)) {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Pinch takes precedence over rotation while two fingers are down.
      if (touches.size === 2) {
        const [a, b] = [...touches.values()];
        const spread = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStart > 0) {
          const ratio = spread / pinchStart;
          input.zoom = Math.min(1, Math.max(0, zoomStart + (ratio - 1) * 0.9));
          input.hasInteracted = true;
        }
        return;
      }

      if (!dragging) return;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const sensitivity = e.pointerType === "touch" ? TOUCH_SENSITIVITY : DRAG_SENSITIVITY;

      input.dragYaw += dx * sensitivity;
      input.dragPitch = clampPitch(input.dragPitch + dy * sensitivity * 0.5);

      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      // Throw velocity, so a flick keeps turning after release. Capped
      // because a garment that spins fast stops reading as heavy.
      input.spinVelocity = THREE.MathUtils.clamp((dx * sensitivity) / (dt / 1000), -2.4, 2.4);

      lastX = e.clientX;
      lastY = e.clientY;
      lastT = now;
      if (Math.abs(dx) > 2) input.hasInteracted = true;
    };

    const endPointer = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      if (touches.size < 2) pinchStart = 0;
      if (dragging) {
        dragging = false;
        input.dragging = false;
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      }
    };

    const onEnter = () => {
      input.hovering = true;
    };
    const onLeave = () => {
      input.hovering = false;
      input.pointerX = 0;
      input.pointerY = 0;
    };

    const onWheel = (e: WheelEvent) => {
      // Only zoom on a deliberate pinch-zoom gesture (ctrlKey is what a
      // trackpad pinch reports). A plain wheel must stay as page scroll —
      // hijacking it is the fastest way to make an experience feel broken.
      if (!e.ctrlKey) return;
      e.preventDefault();
      input.zoom = Math.min(1, Math.max(0, input.zoom - e.deltaY * 0.004));
      input.hasInteracted = true;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endPointer);
    el.addEventListener("pointercancel", endPointer);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endPointer);
      el.removeEventListener("pointercancel", endPointer);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("wheel", onWheel);
    };
  }, [input]);

  const settings = B_QUALITY[quality];

  return (
    <div ref={surface} className="pb-stage" aria-hidden="true">
      <Canvas
        shadows={settings.shadows}
        dpr={settings.dpr}
        gl={{
          antialias: settings.antialias,
          powerPreference: "high-performance",
          alpha: false,
        }}
        camera={{ fov: 34, near: 0.1, far: 40, position: [0, -0.18, 3.5] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.9;
          gl.setClearColor("#0a0909", 1);
        }}
      >
        <Suspense fallback={null}>
          <GarmentScene
            input={input}
            quality={quality}
            lotCode={lotCode}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
