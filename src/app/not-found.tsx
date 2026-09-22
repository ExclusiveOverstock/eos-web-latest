import Link from "next/link";
import { eosFontVariables } from "@/lib/design/fonts";

/**
 * 404 for URLs that match no route at all.
 *
 * Route groups do not create segments, so `(site)/not-found.tsx` only
 * catches `notFound()` thrown from inside the storefront. A typo'd or stale
 * URL never enters that group and lands here instead — against the bare root
 * layout, with no header, no footer, and none of the font variables the site
 * layout declares. Hence the explicit font wrapper: without it this page
 * arrives in Times New Roman, which looks less like a designed 404 than like
 * the site itself failing.
 *
 * Kept deliberately stark rather than reconstructing the chrome. The header
 * needs the cart and chrome providers, and standing those up for a 404 buys
 * a navigation bar at the cost of making the page dependent on the same
 * machinery that may be why the visitor is here. A short list of real links
 * does the same job with nothing that can break.
 */
export const metadata = {
  title: "Not found",
};

const EXITS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Open lots" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "The model" },
] as const;

export default function RootNotFound() {
  return (
    <div
      className={`${eosFontVariables} flex min-h-dvh flex-col justify-center bg-void px-6 py-24 font-body text-bone sm:px-10`}
    >
      <div className="mx-auto w-full max-w-5xl">
        <p className="eos-meta text-taupe">404 &mdash; No such address</p>

        <span aria-hidden className="mt-7 block h-px w-16 bg-oxblood" />

        <h1 className="eos-display mt-7 text-[clamp(2.75rem,9vw,6.5rem)] text-bone">
          Nothing at this address.
        </h1>

        <p className="eos-body mt-7 max-w-[46ch]">
          The link is wrong, or it points at something that has since closed.
          Everything that still exists is one of these.
        </p>

        <ul className="mt-14 border-t border-hairline">
          {EXITS.map((exit) => (
            <li key={exit.href}>
              <Link
                href={exit.href}
                className="group flex items-center justify-between border-b border-hairline py-6 transition-colors duration-500 hover:border-hairline-strong"
              >
                <span className="eos-display-sm text-2xl text-bone">
                  {exit.label}
                </span>
                <span
                  aria-hidden
                  className="eos-meta text-taupe transition-transform duration-500 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
