"use client";

import { useEffect } from "react";
import { eosFontVariables } from "@/lib/design/fonts";
import "./globals.css";

/**
 * Last resort: the root layout itself failed.
 *
 * This replaces the entire document, which is why it renders its own <html>
 * and <body> and imports the stylesheet directly — the root layout is the
 * thing that broke, so nothing it normally provides is available, including
 * its `globals.css` import and the <head> metadata.
 *
 * It only ever runs in production; in development the error overlay takes
 * precedence, so the way to see this page is a production build. There is
 * no Link here and no router-driven retry beyond `reset()` — at this level
 * the router is not something to rely on, so the escape hatch is a plain
 * anchor that reloads the document from scratch.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[eos] fatal error", error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body
        className={`${eosFontVariables} min-h-full bg-void font-body text-bone`}
      >
        <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-6 py-24 sm:px-10">
          <p className="eos-meta text-taupe">EOS</p>

          <span aria-hidden className="mt-7 block h-px w-16 bg-oxblood" />

          <h1 className="eos-display mt-7 text-[clamp(2.75rem,9vw,6.5rem)] text-bone">
            The site is down.
          </h1>

          <p className="eos-body mt-7 max-w-[46ch]">
            Not a page &mdash; the whole thing. We would rather say that
            plainly than show you a half-loaded storefront. Reload in a
            moment, and if it persists it is being looked at.
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

            <a
              href="/"
              className="group flex items-center justify-between border border-hairline px-6 py-5 transition-colors duration-500 hover:border-hairline-strong hover:bg-charcoal sm:min-w-[17rem]"
            >
              <span className="eos-meta text-bone">Reload the site</span>
              <span
                aria-hidden
                className="eos-meta text-taupe transition-transform duration-500 group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </a>
          </div>

          {error.digest ? (
            <p className="eos-meta-sm mt-14 text-taupe/60">
              Reference {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
