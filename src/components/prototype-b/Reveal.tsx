"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Reveals its children once, when they first enter the viewport.
 *
 * Prototype B's own, rather than site A's `Reveal`. It does the same job but
 * on B's motion curve and with B's stagger, and sharing one across both
 * experiences is how two prototypes start feeling like one product.
 *
 * Implemented with IntersectionObserver and a CSS class rather than a
 * scroll-position calculation: the observer costs nothing while nothing is
 * crossing the threshold, which matters on a page that is also driving a
 * WebGL camera off the same scroll.
 */
export default function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.dataset.shown = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          node.dataset.shown = "true";
          observer.unobserve(node);
        }
      },
      // Fires a little before the element is fully on screen, so the reveal
      // has finished by the time it is properly in view.
      { rootMargin: "-12% 0px -12% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal="" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
