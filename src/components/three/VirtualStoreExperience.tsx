"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Link from "next/link";
import Scene from "./Scene";
import TouchJoystick from "./TouchJoystick";
import TouchLook from "./TouchLook";
import { createInputState } from "@/lib/three/input-state";

function detectMobile(): boolean {
  if (typeof window === "undefined") return false;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isNarrow = window.matchMedia("(max-width: 820px)").matches;
  return hasTouch && isNarrow;
}

export default function VirtualStoreExperience() {
  // Stable, non-reactive input buffer shared with the touch controls and
  // the per-frame movement loop — read via useState (not useRef) purely so
  // passing it down doesn't trip the "no ref access during render" lint
  // rule; its identity never changes and its setter is never called.
  const [input] = useState(createInputState);
  // This component is loaded with `ssr: false`, so it only ever renders on
  // the client — safe to compute this synchronously instead of via an
  // effect-triggered setState.
  const [isMobile] = useState(detectMobile);
  const [entered, setEntered] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hintExpired, setHintExpired] = useState(false);
  /**
   * Pointer Lock refused.
   *
   * Embedded and sandboxed contexts reject the request outright, and a
   * visitor there would otherwise be told to "click to look around" by an
   * interface where clicking does nothing. PlayerControls falls back to
   * drag-to-look; this just makes the copy tell the truth.
   */
  const [lockBlocked, setLockBlocked] = useState(false);

  useEffect(() => {
    const onError = () => setLockBlocked(true);
    document.addEventListener("pointerlockerror", onError);
    return () => document.removeEventListener("pointerlockerror", onError);
  }, []);

  // Once the visitor is walking, the interface gets out of the way. The one
  // line of control copy retires after a few seconds and does not come back.
  useEffect(() => {
    if (!introDone) return;
    const timer = window.setTimeout(() => setHintExpired(true), 6000);
    return () => window.clearTimeout(timer);
  }, [introDone]);

  const showIntro = !entered;
  const showLockHint = introDone && !isMobile && !locked;
  const showControlsHint = introDone && !hintExpired;

  return (
    <div className="relative h-[calc(100dvh-64px)] w-full overflow-hidden bg-void sm:h-[calc(100dvh-80px)]">
      <Canvas
        shadows={!isMobile}
        // Capped below the display's full density on purpose. The scene is
        // fragment-bound, so on a 2x panel a dpr of 2 quadruples the shaded
        // pixels versus 1 — the single largest cost in the whole experience,
        // for a difference in edge quality that antialiasing mostly covers.
        dpr={[1, isMobile ? 1.25 : 1.6]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          // Slightly hot, so the store reads as warm and legible rather than
          // merely dark. The mood comes from the light hierarchy, not from
          // starving the exposure.
          toneMappingExposure: 1.15,
        }}
      >
        <Suspense fallback={null}>
          <Scene
            input={input}
            isMobile={isMobile}
            entered={entered}
            introDone={introDone}
            onIntroComplete={() => setIntroDone(true)}
            onLockChange={setLocked}
          />
        </Suspense>
      </Canvas>

      {/* Mobile touch controls — mounted only once the arrival shot ends */}
      {introDone && isMobile && (
        <>
          <TouchLook input={input} />
          <TouchJoystick input={input} />
        </>
      )}

      {/* Exit, kept as a near-invisible hairline until it's wanted. */}
      {entered && (
        <Link
          href="/shop"
          className="absolute left-6 top-6 z-10 eos-meta-sm text-bone/35 transition-colors duration-500 hover:text-bone"
        >
          ← Exit
        </Link>
      )}

      {/* Desktop "click to look around" hint — pointer-events-none so the
          click reaches the canvas underneath and engages pointer lock. */}
      {showLockHint && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center">
          <p className="eos-meta-sm text-bone/45">
            {lockBlocked ? "Drag to look around" : "Click to look around"}
          </p>
        </div>
      )}

      {showControlsHint && !showLockHint && (
        <p className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 eos-meta-sm text-bone/30 transition-opacity duration-1000">
          {isMobile ? "Drag to look · stick to walk" : "WASD to walk · drag to look"}
        </p>
      )}

      {/* Intro overlay */}
      {showIntro && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/85 px-6 text-center backdrop-blur-sm">
          <p className="eos-meta text-taupe">
            EOS — Virtual Store
          </p>
          <h1 className="eos-display mt-6 max-w-lg text-[1.9rem] text-bone sm:text-[2.8rem]">
            Walk the floor before you buy.
          </h1>
          <p className="eos-body mt-6 max-w-sm">
            {isMobile
              ? "Drag anywhere to look around. Use the stick in the corner to walk."
              : "Click or drag to look around, and use WASD to walk through the boutique."}
          </p>
          <button
            type="button"
            onClick={() => setEntered(true)}
            className="eos-btn eos-btn-primary mt-8"
          >
            Enter Store
          </button>
          <Link
            href="/shop"
            className="mt-5 eos-meta-sm text-taupe transition-colors hover:text-bone"
          >
            Skip to Shop
          </Link>
        </div>
      )}
    </div>
  );
}
