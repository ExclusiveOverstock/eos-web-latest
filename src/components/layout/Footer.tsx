import Link from "next/link";
import { STORE } from "@/lib/site/store";

const YEAR = new Date().getFullYear();

/** The EOS Instagram. */
const INSTAGRAM_HANDLE = "exclusive_overstock";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

const COLUMNS: {
  heading: string;
  links: { href?: string; label: string; note?: string }[];
}[] = [
  {
    heading: "Shop",
    links: [
      { href: "/shop", label: "The Manifest" },
      { href: "/collections", label: "Collections" },
    ],
  },
  {
    heading: "EOS",
    links: [
      { href: "/about", label: "The Model" },
      { label: "The Boutique", note: "Coming Soon" },
    ],
  },
  {
    heading: "Service",
    links: [
      { href: "/about", label: "Sizing & Fit" },
      { href: "/about", label: "Shipping" },
      { href: "/returns", label: "Returns & Exchanges" },
    ],
  },
];

/**
 * The Instagram mark, drawn rather than imported.
 *
 * An icon library for a single glyph would be the largest dependency in the
 * project for the smallest reason. It is line art at the same 1.4 stroke the
 * rest of the site's icons use, so it sits in the same family as the chrome
 * around it instead of arriving as a foreign brand asset — and because it
 * inherits `currentColor`, the hover transition is the same one every other
 * footer link uses.
 */
function InstagramMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      {/* The lens highlight. Drawn as a dot rather than a stroked circle so
          it holds its weight at 20px, where a 1.4 stroke would close up. */}
      <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="eos-grain relative border-t border-hairline bg-void">
      <div className="mx-auto max-w-[1600px] px-6 py-20 sm:px-10 sm:py-24">
        <div className="grid gap-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,0.6fr)]">
          <div>
            <p className="eos-display text-xl tracking-[0.34em] text-bone">EOS</p>
            <p className="eos-body mt-6 max-w-[30ch] text-sm">
              Limited quantities of fashion inventory that already exists.
              Listed once. Closed for good.
            </p>

            {/*
              A plain anchor, not next/link: this leaves the app, so there is
              no route to prefetch. `noreferrer` accompanies `noopener`
              because Instagram has no business knowing which page sent the
              visitor.

              The mark carries no visible text, so the accessible name comes
              from aria-label — without it a screen reader announces a link
              with no destination at all.
            */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="EOS on Instagram (opens in a new tab)"
              className="mt-8 inline-flex text-taupe transition-colors duration-300 hover:text-bone"
            >
              <InstagramMark />
            </a>

            {/*
              The shop, when there is one to give.
              
              Marked up as an <address> because that is what the element is
              for, and the street lines are a real address rather than a
              paragraph that looks like one. Rendered only when STORE is set,
              so the footer never carries a half-filled "Visit" heading with
              nothing under it.
            */}
            {STORE ? (
              <div className="mt-10">
                <p className="eos-meta-sm text-hairline-strong">Visit</p>
                <address className="eos-meta-sm mt-4 not-italic text-taupe">
                  {STORE.lines.map((line) => (
                    <span key={line} className="block leading-relaxed">
                      {line}
                    </span>
                  ))}
                </address>
                {STORE.hours ? (
                  <p className="eos-meta-sm mt-3 text-hairline-strong">
                    {STORE.hours}
                  </p>
                ) : null}
                {STORE.mapsUrl ? (
                  <a
                    href={STORE.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eos-meta-sm mt-4 inline-block text-taupe underline decoration-hairline-strong underline-offset-4 transition-colors duration-300 hover:text-bone"
                  >
                    Directions
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <p className="eos-meta-sm text-hairline-strong">{column.heading}</p>
              <ul className="mt-5 space-y-3.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="eos-meta-sm text-taupe transition-colors duration-300 hover:text-bone"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="eos-meta-sm text-hairline-strong">
                        {link.label}
                        {link.note ? (
                          // The space is inside the string, not just CSS
                          // margin: a screen reader reads the text content,
                          // where `ml-2` does not exist.
                          <span className="text-hairline-strong">
                            {" "}&mdash; {link.note}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-20 flex flex-col gap-8 border-t border-hairline pt-10 sm:flex-row sm:items-end sm:justify-between">
          {/*
            One field, no framing copy about offers or discounts. The only
            thing worth being told about is a lot opening, so that is what it
            says it is for.
          */}
          <form
            className="w-full max-w-sm"
            // No endpoint yet; submission is prevented rather than faked.
            action="/about"
          >
            <label htmlFor="manifest-email" className="eos-meta-sm text-hairline-strong">
              Notified when a lot opens
            </label>
            <div className="mt-3 flex items-center gap-4 border-b border-hairline pb-2 transition-colors duration-300 focus-within:border-bone">
              <input
                id="manifest-email"
                type="email"
                name="email"
                placeholder="you@email.com"
                className="w-full bg-transparent text-sm text-bone placeholder:text-hairline-strong focus:outline-none"
              />
              <button
                type="submit"
                className="eos-meta-sm shrink-0 text-taupe transition-colors duration-300 hover:text-bone"
              >
                Join
              </button>
            </div>
          </form>

          <p className="eos-meta-sm text-hairline-strong">
            EOS © {YEAR}
            <span className="mx-3">/</span>
            All lots final
          </p>
        </div>
      </div>
    </footer>
  );
}
