"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import HeroVideo from "./HeroVideo";
import { ImmersiveChrome } from "@/lib/chrome/ChromeContext";

/**
 * The opening.
 *
 * A tall scroll track with a pinned viewport inside it. Scrolling does not
 * move the page past the hero — it moves the *camera*, and the editorial
 * copy is cross-faded against that move. The first three screens of
 * scrolling are one continuous shot rather than three sections going by.
 *
 * The sequence: black, the mark, the film, the statement, the
 * counter-statement, then the hand-off, where the copy clears and the only
 * things left are the piece and a way in. Nothing here explains the brand —
 * that happens further down, after there is a reason to care.
 *
 * Scrolling no longer drives a camera, because there is no longer a camera:
 * the frame holds a film that plays on its own and the scroll track drives
 * only the copy. That is a quieter effect than a scrubbed 3D move and a more
 * honest one — the piece on screen is now an actual garment being worn.
 *
 * The first beat is deliberately unaccompanied. Type over a reveal tells the
 * visitor what to think about an image they have not finished looking at.
 */

/** Copy beats on the 0–1 scroll track: in over [a,b], out over [c,d]. */
const BEATS = {
  marker: [0.02, 0.08, 0.13, 0.19],
  statement: [0.15, 0.25, 0.38, 0.46],
  counter: [0.47, 0.56, 0.68, 0.77],
} as const;

function useBeat(progress: MotionValue<number>, range: readonly [number, number, number, number]) {
  return useTransform(progress, [...range], [0, 1, 1, 0]);
}

const STATEMENT = "Overproduction is fashion's quiet waste problem.";

/**
 * @param lotCode omitted when the manifest is empty. The opening is the
 *   brand, not the inventory: a store with nothing published yet should
 *   still get the black screen, the mark, the film and the statement. Only
 *   the lot marker knows the difference.
 */
export default function HeroExperience({ lotCode }: { lotCode?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const calm = useReducedMotion() ?? false;

  // Handed straight to the scene, which samples it once per frame. No state,
  // no subscription, nothing that can fall out of step with the render loop.
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });

  const marker = useBeat(scrollYProgress, BEATS.marker);
  const statement = useBeat(scrollYProgress, BEATS.statement);
  const counter = useBeat(scrollYProgress, BEATS.counter);
  const handoff = useTransform(scrollYProgress, [0.78, 0.88], [0, 1]);
  const scrollCue = useTransform(scrollYProgress, [0, 0.06, 0.11], [0, 1, 0]);

  const film = <HeroVideo className="absolute inset-0 h-full w-full" />;

  /**
   * Reduced motion gets a still frame, not a stripped one.
   *
   * The film holds on its first frame rather than playing, and every line of
   * copy is simply present at once. Cross-fading text on scroll is precisely
   * the effect that makes vestibular symptoms worse, so it is removed rather
   * than shortened — but nothing is withheld.
   */
  if (calm) {
    return (
      <section className="relative min-h-[100dvh] overflow-hidden bg-void" aria-label="EOS">
        <ImmersiveChrome />
        {film}
        <div className="eos-vignette eos-grain pointer-events-none absolute inset-0" />

        <div className="relative mx-auto flex min-h-[100dvh] max-w-[1600px] flex-col justify-end gap-10 px-6 pb-16 pt-32 sm:px-10">
          <div>
            {lotCode && (
              <p className="eos-meta-sm text-taupe">{lotCode} / Archive</p>
            )}
            <h1 className="eos-display mt-6 max-w-[26ch] text-[1.75rem] text-bone sm:text-[2.6rem]">
              {STATEMENT}
            </h1>
            <p className="eos-display mt-6 max-w-[26ch] text-[1.75rem] text-taupe sm:text-[2.6rem]">
              We treat it as a{" "}
              {/*
                Emphasis as a rule, not an italic. Bebas Neue ships no
                italic, so `font-style: italic` would hand the browser a
                synthesised oblique — a mechanical skew of a condensed
                gothic, which reads as a rendering fault rather than as
                stress. An oxblood rule under the word carries the same
                emphasis and spends the accent the way the palette allows:
                as a mark, never as text colour.
              */}
              <span className="box-decoration-clone border-b-[0.07em] border-oxblood">
                discovery
              </span>{" "}
              problem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/shop" className="eos-btn eos-btn-primary">
              Enter the Archive
            </Link>
            <Link href="/about" className="eos-btn eos-btn-quiet">
              The Model
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={track}
      // Three and a bit viewport-heights of track for one pinned viewport:
      // room for the camera move to breathe without the visitor feeling they
      // are scrolling through treacle.
      className="relative h-[340vh]"
      aria-label="EOS opening"
    >
      <ImmersiveChrome />

      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-void">
        {film}

        {/*
          Vignette and grain in CSS rather than in the scene: free per frame,
          and it keeps the shader budget for the cloth.
        */}
        <div className="eos-vignette eos-grain pointer-events-none absolute inset-0" />

        {/* --- Beat 1: the piece, named, and nothing else --------- */}
        <motion.div
          style={{ opacity: marker }}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-10 sm:px-10 sm:pb-12"
        >
          <p className="eos-meta-sm text-taupe">
            {lotCode ? (
              <>
                {lotCode}
                <span className="mx-2 text-hairline-strong">/</span>
              </>
            ) : null}
            Archive
          </p>
          <p className="eos-meta-sm hidden text-taupe sm:block">Exclusive Overstock</p>
        </motion.div>

        {/* --- Beats 2 and 3: statement, counter-statement -------- */}
        {/*
          Both lines occupy the same grid cell so they cross-fade in place
          instead of one being absolutely positioned against a parent that
          might resize. At these type sizes a few pixels of drift between the
          two would read as a mistake.
        */}
        <div className="pointer-events-none absolute inset-0 flex items-center px-6 sm:px-10">
          <div className="mx-auto grid w-full max-w-[1600px]">
            <motion.h1
              style={{ opacity: statement, gridArea: "1 / 1" }}
              className="eos-display max-w-[26ch] text-[1.75rem] text-bone sm:text-[2.6rem] lg:text-[3.2rem]"
            >
              {STATEMENT}
            </motion.h1>

            <motion.p
              style={{ opacity: counter, gridArea: "1 / 1" }}
              className="eos-display max-w-[26ch] text-[1.75rem] text-bone sm:text-[2.6rem] lg:text-[3.2rem]"
            >
              We treat it as a{" "}
              {/*
                Emphasis as a rule, not an italic. Bebas Neue ships no
                italic, so `font-style: italic` would hand the browser a
                synthesised oblique — a mechanical skew of a condensed
                gothic, which reads as a rendering fault rather than as
                stress. An oxblood rule under the word carries the same
                emphasis and spends the accent the way the palette allows:
                as a mark, never as text colour.
              */}
              <span className="box-decoration-clone border-b-[0.07em] border-oxblood">
                discovery
              </span>{" "}
              problem.
            </motion.p>
          </div>
        </div>

        {/* --- Beat 4: hand over control -------------------------- */}
        <motion.div
          style={{ opacity: handoff }}
          className="absolute inset-x-0 bottom-0 px-6 pb-12 sm:px-10 sm:pb-16"
        >
          <div className="mx-auto flex max-w-[1600px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {/*
                This used to read "Drag to turn the piece", which was true of
                a 3D garment and is a broken promise over a film. Naming what
                the archive is beats inviting an interaction that does not
                answer.
              */}
              <p className="eos-meta-sm text-taupe">The Archive</p>
              <p className="eos-display-sm mt-4 max-w-[33ch] text-[1.35rem] text-bone sm:text-[1.9rem]">
                Every lot is what already exists. Listed once. Never made again.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link href="/shop" className="eos-btn eos-btn-primary">
                Enter the Archive
              </Link>
              <Link href="/about" className="eos-btn eos-btn-quiet">
                The Model
              </Link>
            </div>
          </div>
        </motion.div>

        {/* --- The scroll invitation, shown once ------------------ */}
        <motion.div
          style={{ opacity: scrollCue }}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center"
        >
          <div className="eos-drift flex flex-col items-center gap-3">
            <span className="eos-meta-sm text-taupe">Scroll</span>
            <span className="h-8 w-px bg-gradient-to-b from-taupe to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
