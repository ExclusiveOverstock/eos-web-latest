"use client";

import { useRef } from "react";
import type { InputState } from "@/lib/three/input-state";

/**
 * `input` is the same non-reactive per-frame buffer described in
 * TouchJoystick.tsx — writing directly to its fields on every touchmove
 * avoids routing high-frequency drag events through React state.
 */
export default function TouchLook({ input }: { input: InputState }) {
  const activeTouch = useRef<number | null>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  function handleStart(e: React.TouchEvent) {
    const touch = e.changedTouches[0];
    activeTouch.current = touch.identifier;
    lastPos.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleMove(e: React.TouchEvent) {
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === activeTouch.current,
    );
    if (!touch || !lastPos.current) return;
    input.lookDeltaX += touch.clientX - lastPos.current.x;
    input.lookDeltaY += touch.clientY - lastPos.current.y;
    lastPos.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleEnd(e: React.TouchEvent) {
    const touch = Array.from(e.changedTouches).find(
      (t) => t.identifier === activeTouch.current,
    );
    if (!touch) return;
    activeTouch.current = null;
    lastPos.current = null;
  }

  return (
    <div
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onTouchCancel={handleEnd}
      style={{ touchAction: "none" }}
      className="absolute inset-0"
    />
  );
}
