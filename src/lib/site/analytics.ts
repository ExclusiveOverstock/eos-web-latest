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
