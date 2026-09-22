import Link from "next/link";

/**
 * 404, inside the storefront.
 *
 * Reached when a route calls `notFound()` — a lot handle that no longer
 * exists, a collection that was removed. The root `not-found.tsx` handles
 * URLs that match no route at all; this one keeps the header, the footer and
 * the cart, because a visitor who followed a dead link to a sold piece is
 * still shopping and should not be dropped out of the site to find that out.
 *
 * The copy borrows the vocabulary the rest of the site already uses. On a
 * storefront whose whole premise is that things disappear permanently, a
 * missing page is not an error message — it is the most likely true
 * explanation, and saying so is both more honest and more on-brand than
 * "Oops! Something went wrong."
 */
export default function SiteNotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center px-6 py-28 sm:px-10">
      <p className="eos-meta text-taupe">404 &mdash; Not in the manifest</p>

      {/* The one oxblood mark on the page: a rule, never the type. */}
      <span aria-hidden className="mt-7 block h-px w-16 bg-oxblood" />

      <h1 className="eos-display mt-7 text-[clamp(2.75rem,9vw,6.5rem)] text-bone">
        This one is gone.
      </h1>

      <p className="eos-body mt-7 max-w-[46ch]">
        Either this piece sold and was struck from the manifest, or the address
        is wrong. Lots are listed once and closed for good, so a link that
        worked last month may simply have run out.
      </p>

      <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-5">
        <Link
          href="/shop"
          className="group flex items-center justify-between border border-hairline px-6 py-5 transition-colors duration-500 hover:border-hairline-strong hover:bg-charcoal sm:min-w-[17rem]"
        >
          <span className="eos-meta text-bone">What is still open</span>
          <span
            aria-hidden
            className="eos-meta text-taupe transition-transform duration-500 group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </Link>

        <Link
          href="/"
          className="group flex items-center justify-between border border-hairline px-6 py-5 transition-colors duration-500 hover:border-hairline-strong hover:bg-charcoal sm:min-w-[17rem]"
        >
          <span className="eos-meta text-bone">Back to the beginning</span>
          <span
            aria-hidden
            className="eos-meta text-taupe transition-transform duration-500 group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
