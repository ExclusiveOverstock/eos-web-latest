"use client";

import { useMemo, useSyncExternalStore } from "react";
import { QUALITY, type QualityTier } from "@/lib/design/tokens";

/**
 * Device capability tiering for the 3D experiences.
 *
 * Resolved once, from hints that are cheap and available before the first
 * frame. There is deliberately no benchmark-then-downgrade pass: measuring
 * frame time for a second and then swapping the renderer's settings is
 * visible, and a visible quality drop three seconds into a cinematic opening
 * is worse than simply starting at the right tier.
 *
 * The hints are crude on purpose. `deviceMemory` and `hardwareConcurrency`
 * are unreliable individually but they are directionally right in
 * aggregate, and the cost of guessing one tier low is a slightly softer
 * scene, not a broken one.
 */
export function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "medium";

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;

  if (memory <= 4 || cores <= 4) return "low";
  if (coarse || small || memory <= 6 || cores <= 6) return "medium";
  return "high";
}

/**
 * Three has required WebGL2 since r163, so this is a hard gate rather than a
 * quality question: without it there is no scene to degrade, and the caller
 * has to show the 2D experience instead.
 */
export function hasWebGL2(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

export type QualityResult = {
  /** `null` until resolved on the client. */
  tier: QualityTier | null;
  settings: (typeof QUALITY)[QualityTier] | null;
  supported: boolean;
};

/**
 * Both probes, resolved once and memoised at module scope.
 *
 * useSyncExternalStore calls the snapshot on every render and bails out only
 * if the value is referentially equal, so re-probing would loop forever on
 * the tier string alone. Caching also means the WebGL2 test allocates one
 * throwaway canvas per session rather than one per render.
 */
let probed: { tier: QualityTier; supported: boolean } | null = null;

function clientSnapshot() {
  if (!probed) probed = { tier: detectQualityTier(), supported: hasWebGL2() };
  return probed;
}

/** Nothing to subscribe to — device capability does not change mid-session. */
const noSubscribe = () => () => {};
const serverSnapshot = () => null;

/**
 * React binding.
 *
 * Holds `tier` at null through the server render and the hydrating client
 * render, then resolves. That deliberate one-commit delay is what stops the
 * canvas mounting at a guessed tier and having to re-create its WebGL
 * context a moment later — context loss and recreation shows as a black
 * flash, which is an expensive thing to put in a cinematic opening.
 */
export function useQuality(): QualityResult {
  const probe = useSyncExternalStore(noSubscribe, clientSnapshot, serverSnapshot);

  return useMemo(
    () => ({
      tier: probe?.tier ?? null,
      settings: probe ? QUALITY[probe.tier] : null,
      supported: probe?.supported ?? true,
    }),
    [probe],
  );
}
