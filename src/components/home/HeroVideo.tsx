"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * The hero film.
 *
 * This replaced an interactive 3D garment. The reasoning is the same one that
 * took the procedural garment off the product pages: EOS sells clothing that
 * already physically exists, and a synthesised stand-in argues against the
 * only claim the brand is making. Footage of the actual piece, worn, argues
 * for it.
 *
 * UNGRADED, BY INSTRUCTION.
 *
 * The film briefly carried a desaturating, darkening filter so it would sit
 * inside a #0A0909 site. That was removed on request: the footage plays at
 * its own colour and exposure, warm interior and all.
 *
 * The consequence to keep in mind if this is ever touched again — the scrims
 * below are now doing *all* of the legibility work rather than sharing it
 * with the grade. Weaken them and the bone headlines start to fail against
 * the cream wall in the second shot. Anything that changes them should be
 * checked against the statement beat specifically, which is where the type
 * sits over the brightest part of the frame.
 */

export default function HeroVideo({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const calm = useReducedMotion() ?? false;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /**
     * `muted` is set here as well as in the markup on purpose.
     *
     * React does not reliably apply `muted` as a DOM *property* — it renders
     * the attribute, which several browsers evaluate too late — and a video
     * that is not muted at the moment play() is called is refused autoplay
     * everywhere. Setting the property first is the difference between a
     * playing hero and a frozen first frame on Safari.
     */
    el.muted = true;

    if (calm) {
      el.pause();
      return;
    }

    /**
     * Autoplay can be refused — a data-saver mode, a battery policy, a tab
     * that was not foregrounded when the effect ran. The rejection is not an
     * error worth reporting: the first frame stays on screen and the page is
     * entirely usable, which is the designed fallback rather than a failure.
     *
     * But one attempt at mount is not enough, and this was caught in
     * testing: the hero mounted while the tab was still in the background,
     * the single play() was refused, and the film sat frozen on frame one
     * for the rest of the visit with no second chance. So it is retried once
     * the element actually has frames, and again whenever it scrolls back
     * into view.
     */
    const attempt = () => {
      void el.play().catch(() => {});
    };

    el.addEventListener("canplay", attempt);

    /**
     * Also stops the film when it is off screen.
     *
     * The hero is one screen of a long page. Decoding 15 seconds of video on
     * a loop while someone reads the archive four screens down costs real
     * battery on a phone and buys nothing, since nobody can see it.
     */
    const visibility = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) attempt();
        else el.pause();
      },
      { threshold: 0.05 },
    );
    visibility.observe(el);

    attempt();

    return () => {
      el.removeEventListener("canplay", attempt);
      visibility.disconnect();
    };
  }, [calm]);

  return (
    <div className={`overflow-hidden bg-void ${className}`}>
      <video
        ref={ref}
        src="/video/hero.mp4"
        /**
         * A poster, reversing an earlier decision.
         *
         * This deliberately had none: the element sat transparent over
         * `bg-void` until the first frame decoded, which matched the opening
         * beat — black, then the piece.
         *
         * That reasoning only held while the film was guaranteed to play. It
         * is not. A browser refuses muted autoplay under battery saver, data
         * saver, or an explicit user setting, and when it does the hero is a
         * black rectangle with the browser's own play glyph on it — the
         * worst possible first impression, and nothing the site can override.
         *
         * With a poster the same visitor gets the frame as a still image and
         * the page reads as designed whether or not the video ever runs.
         * Drawn from the film itself at 1.4s, 1200x675, 67KB.
         */
        poster="/video/hero-poster.jpg"
        muted
        loop
        playsInline
        autoPlay={!calm}
        // The file is under 2MB and it is the first thing anyone sees, so it
        // is worth the connection. `metadata` would hold the first frame back.
        preload="auto"
        disablePictureInPicture
        // Decorative: the film carries no information the copy does not, and
        // announcing it would interrupt a screen reader mid-headline.
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/*
        Legibility scrims, in two directions because the copy sits in two
        places: the statements run down the left at mid-height, and the
        hand-off sits along the bottom edge.

        Deliberately gradients rather than one flat wash — a uniform veil
        over the whole frame would cost the film its depth, which is most of
        what it is here to provide.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-void via-void/55 via-45% to-void/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-void via-void/60 to-transparent"
      />
      {/* Ties the top edge into the header, which floats over this section. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-void/80 to-transparent"
      />
    </div>
  );
}
