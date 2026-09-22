"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import EosLoader from "@/components/ui/EosLoader";
import type { InteractiveGarmentProps } from "./InteractiveGarment";

/**
 * Mount point for a garment experience.
 *
 * The dynamic import lives here, in a Client Component, because `ssr: false`
 * is only permitted inside one — and keeping the wrapper this thin is the
 * whole point of the split. Three.js, drei and the garment system together
 * are the largest thing this project ships; every route that does not show a
 * garment should never download a byte of it.
 *
 * It also owns the loading curtain, so a caller gets the complete
 * "black screen → mark → garment" opening from a single element.
 */
const InteractiveGarment = dynamic(() => import("./InteractiveGarment"), {
  ssr: false,
  // No fallback markup: the curtain below already covers this element, and
  // two stacked loading states would flicker against each other.
  loading: () => null,
});

/**
 * Minimum time the curtain stays up.
 *
 * On a fast machine the first frame arrives in well under 300ms, and a title
 * card that appears and vanishes inside a third of a second reads as a
 * glitch. Holding it makes the opening deliberate — the one place where
 * making the site feel slower makes it feel better.
 */
const MIN_CURTAIN_MS = 1400;

export default function GarmentMount({
  loadingLabel,
  className = "",
  ...props
}: InteractiveGarmentProps & { loadingLabel?: string }) {
  const [ready, setReady] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHeld(true), MIN_CURTAIN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const onReady = useCallback(() => setReady(true), []);

  return (
    <div className={`relative ${className}`}>
      <InteractiveGarment {...props} className="h-full w-full" onReady={onReady} />
      <EosLoader show={!(ready && held)} label={loadingLabel} />
    </div>
  );
}
