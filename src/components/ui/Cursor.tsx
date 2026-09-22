"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The EOS cursor.
 *
 * A ring that trails the pointer — it does not replace the system cursor.
 * Replacing it is where custom cursors turn gimmicky and start costing
 * people clicks; accompanying it reads as attention rather than novelty.
 *
 * Three states, opted into per element:
 *   (nothing)                    quiet ring
 *   data-cursor="interactive"    ring expands, oxblood ground
 *   data-cursor="discover"       ring expands further and carries a label,
 *                                set with data-cursor-label
 *
 * Renders nothing at all on coarse pointers or under reduced motion.
 */

type CursorMode = "default" | "interactive" | "discover";

export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>("default");
  const [label, setLabel] = useState("");
  const [visible, setVisible] = useState(false);

  const ringRef = useRef<HTMLDivElement>(null);
  // Pointer target and the ring's eased position. Kept in refs so the
  // animation loop never triggers a React render — at 60fps it would
  // otherwise re-render the tree 60 times a second for a transform.
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => setEnabled(fine.matches && !calm.matches);

    decide();
    fine.addEventListener("change", decide);
    calm.addEventListener("change", decide);
    return () => {
      fine.removeEventListener("change", decide);
      calm.removeEventListener("change", decide);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function onMove(e: PointerEvent) {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      setVisible(true);
    }

    function onOver(e: PointerEvent) {
      const el = (e.target as Element | null)?.closest?.(
        "[data-cursor], a, button, input, select, textarea, [role='button']",
      );
      if (!el) {
        setMode("default");
        setLabel("");
        return;
      }
      const declared = el.getAttribute("data-cursor");
      if (declared === "discover") {
        setMode("discover");
        setLabel(el.getAttribute("data-cursor-label") ?? "View");
        return;
      }
      setMode(declared === "none" ? "default" : "interactive");
      setLabel("");
    }

    function onLeave() {
      setVisible(false);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let frame = 0;
    const tick = () => {
      // Critically-damped-feeling follow. 0.18 is slow enough to read as
      // weight and fast enough that the ring never feels detached.
      current.current.x += (target.current.x - current.current.x) * 0.18;
      current.current.y += (target.current.y - current.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [enabled]);

  if (!enabled) return null;

  const size = mode === "discover" ? 78 : mode === "interactive" ? 44 : 22;

  return (
    <div
      ref={ringRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] flex items-center justify-center rounded-full border transition-[width,height,background-color,border-color,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] mix-blend-difference"
      style={{
        width: size,
        height: size,
        opacity: visible ? 1 : 0,
        borderColor: mode === "default" ? "#7a736a" : "#f1e9dc",
        backgroundColor: mode === "discover" ? "rgba(241,233,220,0.1)" : "transparent",
      }}
    >
      {mode === "discover" && label ? (
        <span className="eos-meta-sm select-none text-[9px] text-bone">
          {label}
        </span>
      ) : null}
    </div>
  );
}
