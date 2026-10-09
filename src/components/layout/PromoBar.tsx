import Link from "next/link";
import { PROMO, promoIsVisible } from "@/lib/site/promo";

/**
 * The announcement bar.
 *
 * Sits above the header on every page. Oxblood ground with bone type, which
 * is the sanctioned use of the accent — a fill, never text on black. It is
 * the one loud surface the site allows itself, and it earns that by being a
 * single line that scrolls away and never comes back.
 *
 * There is no dismiss button. A bar a visitor can close needs somewhere to
 * remember the choice, and a strip this thin does not justify writing to a
 * visitor's browser. It leaves the screen on the first scroll regardless.
 *
 * Everything it says lives in lib/site/promo.ts so the offer can be changed
 * without opening this file. Returns null when there is nothing to say, so
 * switching the promo off removes the element entirely rather than leaving
 * an empty strip.
 */
export default function PromoBar() {
  if (!promoIsVisible) return null;

  const body = (
    <>
      <span>{PROMO.text}</span>
      {PROMO.code ? (
        <>
          <span aria-hidden="true" className="mx-2 opacity-50">
            ·
          </span>
          <span className="whitespace-nowrap">
            Code <span className="font-medium tracking-[0.2em]">{PROMO.code}</span>
          </span>
        </>
      ) : null}
    </>
  );

  return (
    <div className="bg-oxblood text-bone">
      {PROMO.href ? (
        <Link
          href={PROMO.href}
          className="eos-meta-sm block px-6 py-2.5 text-center transition-opacity duration-300 hover:opacity-80 sm:px-10"
        >
          {body}
        </Link>
      ) : (
        <p className="eos-meta-sm px-6 py-2.5 text-center sm:px-10">{body}</p>
      )}
    </div>
  );
}
