"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { EASE_EOS } from "@/lib/design/tokens";

/**
 * The house reveal: a short rise and a fade, once, on entry.
 *
 * Deliberately the only scroll animation in the 2D parts of the site. Motion
 * reads as luxury when it is rare and consistent; a page where every element
 * arrives with its own gesture reads as a template with the animations
 * turned on.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const calm = useReducedMotion();

  if (calm) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      // Fires a little before the element reaches the fold, so content is
      // already settled by the time it is properly in view — an element that
      // starts animating once you are looking at it feels late.
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.85, delay, ease: EASE_EOS }}
    >
      {children}
    </motion.div>
  );
}
