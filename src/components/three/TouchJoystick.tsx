"use client";

import { useRef, useState } from "react";
import type { InputState } from "@/lib/three/input-state";

const BASE_RADIUS = 44;

/**
 * `input` is a deliberately non-reactive, per-frame mutable buffer (see
 * lib/three/input-state.ts) shared with the movement loop in
 * PlayerControls. Writing to its fields directly — rather than going
 * through setState — is intentional: this fires on every touchmove, and
 * routing 60+ events/second through React state would trigger a
 * re-render storm the frame loop doesn't need. PlayerControls reads and
 * resets these fields itself inside useFrame, outside React's render
 * cycle, so no rendered output ever depends on this mutation directly.
 */
export default function TouchJoystick({ input }: { input: InputState }) {
  const baseRef = useRef<HTMLDivElement>(null);
  const activeTouch = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function updateFromTouch(touch: React.Touch) {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rawX = touch.clientX - cx;
    const rawY = touch.clientY - cy;
    const dist = Math.min(Math.hypot(rawX, rawY), BASE_RADIUS);
    const angle = Math.atan2(rawY, rawX);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;

    setKnob({ x, y });
    input.strafe = x / BASE_RADIUS;
    input.forward = -y / BASE_RADIUS;
  }

  function handleStart(e: React.TouchEvent) {
    const touch = e.changedTouches[0];
    activeTouch.current = touch.identifier;
    updateFromTouch(touch);
  }

  function handleMove(e: React.TouchEvent) {
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === activeTouch.current,
    );
    if (touch) updateFromTouch(touch);
  }

  function handleEnd(e: React.TouchEvent) {
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === activeTouch.current,
    );
    if (!touch) return;
    activeTouch.current = null;
    setKnob({ x: 0, y: 0 });
    input.forward = 0;
    input.strafe = 0;
  }

  return (
    <div
      ref={baseRef}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      style={{ touchAction: "none" }}
      className="absolute bottom-8 left-8 h-28 w-28 rounded-full border border-bone/25 bg-void/40 backdrop-blur-sm"
    >
      <div
        className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-bone/40 bg-bone/70"
        style={{
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
        }}
      />
    </div>
  );
}
