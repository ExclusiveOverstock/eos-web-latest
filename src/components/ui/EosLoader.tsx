"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_EOS } from "@/lib/design/tokens";

/**
 * The EOS loading curtain.
 *
 * Black screen, the mark, a line. It doubles as the first beat of the
 * homepage's opening sequence rather than sitting in front of it, which is
 * why it is styled as a title card and not as a spinner.
 *
 * There is no percentage. A percentage on a scene that is generated rather
 * than downloaded would be a number invented to look busy, and inventing one
 * is the difference between a brand that is confident and a brand that is
 * performing confidence. What is shown instead is a line that travels — an
 * honest "working" signal — and the curtain lifts the moment the first frame
 * is actually on screen.
 *
 * Everything inside the curtain animates in CSS. Only the lift itself is
 * scripted, because only the lift has to be timed against React state.
 */
export default function EosLoader({
  show,
  label,
}: {
  show: boolean;
  /** e.g. "Preparing Lot 014.7". Kept short — this is a title card. */
  label?: string;
}) {
  const calm = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="eos-grain absolute inset-0 z-30 flex flex-col items-center justify-center bg-void"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // A long lift. The curtain is the last thing standing between the
          // visitor and the garment, so it should feel drawn away rather than
          // switched off.
          transition={{ duration: calm ? 0.2 : 1.1, ease: EASE_EOS }}
        >
          <p className="eos-display eos-mark-settle text-[2rem] text-bone sm:text-[2.6rem]">
            {/* Trailing space balances the tracked-out final letter. */}
            EOS&nbsp;
          </p>

          <div className="relative mt-8 h-px w-28 overflow-hidden bg-hairline">
            <div className="eos-sweep absolute inset-y-0 w-1/3 bg-oxblood" />
          </div>

          {label && <p className="eos-meta-sm mt-6 text-taupe">{label}</p>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
