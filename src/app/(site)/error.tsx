"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary for the storefront.
 *
 * The overwhelmingly likely cause here is the catalog: every page on this
 * site reads from the Storefront API during the server render, so a Shopify
 * outage, an expired token or a revoked scope takes pages down. That is a
 * temporary condition and `reset()` genuinely fixes it once the upstream
 * recovers, which is why retry is the primary action rather than a polite
 * afterthought.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO: print `error.message`. In production
 * Next replaces server error messages with an opaque digest precisely so
 * internals do not reach visitors, and re-rendering whatever is left would
 * either show nothing useful or leak something that should not be public.
 * The digest is shown instead — it is the string that correlates with the
 * server log, so it is the one piece a person reporting the fault can
 * usefully quote. The full error still goes to the console for the dev
 * overlay and for whatever reporting is wired up later.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[eos] route error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center px-6 py-28 sm:px-10">
      <p className="eos-meta text-taupe">Error &mdash; The manifest is unreachable</p>

      <span aria-hidden className="mt-7 block h-px w-16 bg-oxblood" />

      <h1 className="eos-display mt-7 text-[clamp(2.75rem,9vw,6.5rem)] text-bone">
        Something broke.
      </h1>

      <p className="eos-body mt-7 max-w-[46ch]">
        This is on our side, not yours. The stock record could not be read, so
        rather than show you counts we cannot stand behind, we are showing you
        nothing. Try again in a moment.
      </p>

      <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:gap-5">
        <button
          type="button"
          onClick={reset}
          className="group flex items-center justify-between border border-bone bg-bone px-6 py-5 text-void transition-colors duration-500 hover:border-taupe hover:bg-taupe sm:min-w-[17rem]"
        >
          <span className="eos-meta">Try again</span>
          <span
            aria-hidden
            className="eos-meta transition-transform duration-500 group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </button>

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

      {error.digest ? (
        <p className="eos-meta-sm mt-14 text-taupe/60">
          Reference {error.digest}
        </p>
      ) : null}
    </div>
  );
}
