/**
 * The announcement bar at the top of every page.
 *
 * ──────────────────────────────────────────────────────────────────────
 *  TO CHANGE THE OFFER, EDIT THIS FILE AND NOTHING ELSE.
 *
 *    active  false hides the bar completely. Nothing else needs touching.
 *    text    what the bar says. Keep it to one short line — it sits above
 *            the header on a phone and two lines of it push the whole site
 *            down the screen.
 *    code    optional. Shown as the code to use at checkout. Leave it as
 *            undefined if the discount applies automatically.
 *    href    optional. Where the bar links. /shop is the usual answer.
 *
 *  Change only what is between the quote marks, and keep the quote marks,
 *  the commas and the semicolon exactly where they are.
 * ──────────────────────────────────────────────────────────────────────
 *
 * Deliberately a plain object rather than anything cleverer. This is the
 * one file on the site most likely to be edited by somebody who does not
 * write code, and it has to be safe to change without reading anything
 * else: no JSX, no dates to get wrong, no conditions.
 *
 * The bar renders only when `active` is true AND `text` is not empty, so
 * emptying the text is a second way to switch it off.
 */
export const PROMO: {
  active: boolean;
  text: string;
  code?: string;
  href?: string;
} = {
  active: true,
  text: "20% off everything but Exclusive",
  code: undefined,
  href: "/shop",
};

/** True when there is something worth showing. Used by the bar itself. */
export const promoIsVisible = PROMO.active && PROMO.text.trim().length > 0;
