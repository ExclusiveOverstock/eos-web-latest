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
 * Turn tracking diagnostics on.
 *
 * Off by default, because a storefront should not narrate its analytics to
 * every visitor's console. Switch it on for a session in either way:
 *
 *   add ?pixeldebug=1 to any URL
 *   run  localStorage.eosPixelDebug = "1"  in the console, then reload
 *
 * With it on, every tracking attempt prints what happened — sent, queued,
 * or failed, and why. This exists because the previous version failed
 * silently in all three cases, which is indistinguishable from not being
 * called at all.
 *
 * THE FLAG IS STICKY, AND HAS TO BE. The previous version read the query
 * string at the moment of logging, which looks equivalent and is not: this
 * is a single-page app, so clicking from the page you opened with
 * ?pixeldebug=1 to the product you want to test replaces the URL and takes
 * the query with it. By the time Add to Cart runs there is no flag left to
 * find, so the event fires correctly and prints nothing — which reads
 * exactly like tracking being broken, and sent us looking for a bug in the
 * wrong place.
 *
 * Seeing the query once therefore writes the flag down, and it stays on
 * until switched off:
 *
 *   delete localStorage.eosPixelDebug
 */
function debugging(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).has("pixeldebug")) {
      window.localStorage.setItem("eosPixelDebug", "1");
      return true;
    }
    return window.localStorage.getItem("eosPixelDebug") === "1";
  } catch {
    // Private mode and blocked storage both throw here. Honour the query
    // string anyway rather than losing the session's diagnostics with it.
    try {
      return new URLSearchParams(window.location.search).has("pixeldebug");
    } catch {
      return false;
    }
  }
}

/**
 * Notice the flag while the URL that carries it is still the current one.
 *
 * Nothing calls `trackMeta` on page load — the two call sites are Add to
 * Cart and Checkout — so without this the query string is never read on
 * the page it was typed on. Open /shop?pixeldebug=1, click a product, and
 * the flag is gone before anything thinks to look for it.
 *
 * It must be called from a component mounted on every page, because this
 * module is not on every page: the pixel component that imports it is a
 * server component, so on most routes `analytics.ts` never reaches the
 * browser at all. Reading the flag from module scope here looks like it
 * would work and does nothing.
 *
 * Calling `debugging()` is the whole implementation — reading the flag is
 * what writes it down.
 */
export function capturePixelDebugFlag() {
  debugging();
}

function log(...args: unknown[]) {
  if (debugging()) console.info("[eos pixel]", ...args);
}

/**
 * Events that arrived before the pixel did.
 *
 * THE BUG THIS FIXES. `fbq` is defined by an inline script that runs
 * `afterInteractive` — deliberately, so analytics never delays the page.
 * React hydrates before that, so there is a real window in which the Add to
 * Cart button works and `window.fbq` does not yet exist. The old guard
 * returned early in that window and the event was gone for good: the
 * customer added something, the cart updated, and Meta never heard about
 * it. Nothing logged, because the guard was silent.
 *
 * Queueing instead of dropping closes it. Anything fired early waits here
 * and is flushed the moment the pixel appears.
 */
const pending: { event: string; params?: Record<string, unknown> }[] = [];
let flushTimer: ReturnType<typeof setInterval> | undefined;

/** Poll briefly for the pixel, then give up rather than spin forever. */
function flushWhenReady() {
  if (typeof window === "undefined" || flushTimer) return;

  let attempts = 0;
  flushTimer = setInterval(() => {
    attempts += 1;

    if (window.fbq) {
      log(`pixel ready after ${attempts * 250}ms, flushing ${pending.length}`);
      clearInterval(flushTimer);
      flushTimer = undefined;
      const queued = pending.splice(0, pending.length);
      for (const item of queued) send(item.event, item.params);
      return;
    }

    // 20 × 250ms = five seconds. Past that the pixel is blocked or absent
    // rather than slow, and holding events for a customer who will never
    // be tracked is pointless.
    if (attempts >= 20) {
      clearInterval(flushTimer);
      flushTimer = undefined;
      log(`pixel never appeared; dropping ${pending.length} queued event(s)`, pending.map((p) => p.event));
      pending.length = 0;
    }
  }, 250);
}

function send(event: string, params?: Record<string, unknown>) {
  try {
    window.fbq?.("track", event, params);
    log("sent", event, params ?? {});
  } catch (error) {
    // Still swallowed — analytics must never interrupt a purchase — but no
    // longer invisible. A tracking script is third-party code that can
    // throw for reasons we never see, and the old version left no trace.
    log("FAILED", event, error);
  }
}

/**
 * Fire a standard Meta event.
 *
 * Never throws, by design: every call site is a commercial moment, and a
 * tracker must not be able to break an add to cart. But "never throws" used
 * to mean "never says anything either", which made a missing event
 * impossible to diagnose. Now failures are swallowed and logged.
 */
export function trackMeta(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  if (!metaPixelEnabled) {
    log("skipped — pixel disabled in analytics.ts", event);
    return;
  }

  if (!window.fbq) {
    log("queued — fbq not loaded yet", event);
    pending.push({ event, params });
    flushWhenReady();
    return;
  }

  send(event, params);
}
