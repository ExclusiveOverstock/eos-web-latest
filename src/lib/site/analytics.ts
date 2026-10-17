/**
 * Third-party tracking.
 *
 * ──────────────────────────────────────────────────────────────────────
 *  TO TURN THE PIXEL OFF, SET THE ID TO AN EMPTY STRING.
 *
 *    META_PIXEL_ID = ""      nothing loads, no script, no request
 *
 *  To point it at a different Meta account, replace the digits between
 *  the quote marks with the new Pixel ID.
 * ──────────────────────────────────────────────────────────────────────
 *
 * Held here rather than pasted into a layout so it can be changed or
 * removed without touching a component, and so there is one obvious place
 * to look when someone asks what this site tracks.
 *
 * A pixel ID is not a secret — it ships to every visitor's browser by
 * design and is readable in the page source — so it belongs in the repo
 * rather than in an environment variable. Putting it in .env would imply a
 * confidentiality it does not have, and would mean the site behaved
 * differently on a machine where the variable was missing.
 */
export const META_PIXEL_ID = "1161239459548668";

export const metaPixelEnabled = META_PIXEL_ID.trim().length > 0;

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fire a standard Meta event, if the pixel is there to hear it.
 *
 * Every call site is a commercial moment — something was added, someone
 * went to pay — and none of them may break because a tracker did not load.
 * Ad blockers remove `fbq` entirely, the pixel can be switched off above,
 * and the script loads after the page is interactive, so there is a window
 * where a fast click lands before it exists. All three are the same case
 * and all three are survivable: no pixel, no event, no error.
 *
 * Wrapped in try/catch as well as guarded. A tracking script is third-party
 * code that can throw for reasons we never see, and a thrown analytics call
 * inside an add-to-cart handler would break the thing the customer actually
 * asked for.
 */
export function trackMeta(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", event, params);
  } catch {
    // Deliberately silent. Analytics must never interrupt a purchase.
  }
}
