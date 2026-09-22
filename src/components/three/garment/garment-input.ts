/**
 * Pointer state for the interactive garment.
 *
 * Deliberately a plain mutable object rather than React state. Every value
 * here is read inside useFrame at 60fps and written by pointer events that
 * can fire faster than that; routing either through React would re-render the
 * scene tree hundreds of times a second to move a number that only the
 * animation loop ever looks at.
 *
 * GESTURE MODEL
 *   desktop   drag horizontally    rotate
 *             move                 slight parallax on the camera
 *             wheel                zoom, only where `allowWheelZoom` is set
 *   touch     one finger, sideways rotate
 *             one finger, upward   scroll the page — never intercepted
 *             two fingers          pinch to zoom
 *
 * The vertical axis belongs to the page. Hijacking it to spin a garment is
 * how 3D sections end up feeling broken on a phone, so the container sets
 * `touch-action: pan-y` and lets the browser keep it.
 */

export type GarmentInput = {
  /** User-added yaw, in radians. Persists after release — the user is in control. */
  yaw: number;
  /** Momentum carried out of a flick. */
  yawVelocity: number;
  /** Dolly offset in metres, negative pulls the camera in. */
  zoom: number;
  /** Cursor position, -1..1, for parallax. */
  pointerX: number;
  pointerY: number;
  dragging: boolean;
  /** True once the user has actually touched the thing — gates the "take control" cue. */
  engaged: boolean;
};

export function createGarmentInput(): GarmentInput {
  return {
    yaw: 0,
    yawVelocity: 0,
    zoom: 0,
    pointerX: 0,
    pointerY: 0,
    dragging: false,
    engaged: false,
  };
}

const ZOOM_MIN = -0.85;
const ZOOM_MAX = 1.1;
/** Radians of rotation per pixel dragged. Tuned so a full turn is a comfortable swipe. */
const DRAG_SENSITIVITY = 0.0062;

export type InputBindings = {
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  onWheel: (e: WheelEvent) => void;
};

/**
 * Attaches gesture handling to a container element.
 *
 * @returns a teardown function.
 */
export function bindGarmentInput(
  element: HTMLElement,
  input: GarmentInput,
  options: { allowWheelZoom?: boolean } = {},
): () => void {
  const active = new Map<number, { x: number; y: number }>();
  let lastPinch = 0;

  function pointerNormalised(e: PointerEvent) {
    const rect = element.getBoundingClientRect();
    input.pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    input.pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  }

  function onPointerDown(e: PointerEvent) {
    active.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (active.size === 1) {
      input.dragging = true;
      input.yawVelocity = 0;
    }
    if (active.size === 2) lastPinch = pinchDistance();
    element.setPointerCapture?.(e.pointerId);
  }

  function pinchDistance() {
    const [a, b] = [...active.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerMove(e: PointerEvent) {
    pointerNormalised(e);

    const previous = active.get(e.pointerId);
    if (!previous) return;
    const dx = e.clientX - previous.x;
    active.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (active.size >= 2) {
      const distance = pinchDistance();
      if (lastPinch > 0) {
        // Negative because spreading the fingers should bring the garment
        // closer, matching every photo viewer on the device.
        input.zoom = clamp(input.zoom - (distance - lastPinch) * 0.004);
        input.engaged = true;
      }
      lastPinch = distance;
      return;
    }

    if (!input.dragging) return;
    input.yaw -= dx * DRAG_SENSITIVITY;
    input.yawVelocity = -dx * DRAG_SENSITIVITY;
    if (Math.abs(dx) > 1) input.engaged = true;
  }

  function onPointerUp(e: PointerEvent) {
    active.delete(e.pointerId);
    if (active.size < 2) lastPinch = 0;
    if (active.size === 0) input.dragging = false;
    element.releasePointerCapture?.(e.pointerId);
  }

  function onWheel(e: WheelEvent) {
    if (!options.allowWheelZoom) return;
    e.preventDefault();
    input.zoom = clamp(input.zoom + e.deltaY * 0.0012);
    input.engaged = true;
  }

  function clamp(value: number) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
  }

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", onPointerUp);
  element.addEventListener("pointercancel", onPointerUp);
  element.addEventListener("pointerleave", onPointerUp);
  // Passive only when we are not going to preventDefault, so the browser can
  // keep fast-path scrolling everywhere zoom is not enabled.
  element.addEventListener("wheel", onWheel, { passive: !options.allowWheelZoom });

  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerUp);
    element.removeEventListener("pointercancel", onPointerUp);
    element.removeEventListener("pointerleave", onPointerUp);
    element.removeEventListener("wheel", onWheel);
  };
}
