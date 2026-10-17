"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart/CartContext";
import { useChrome } from "@/lib/chrome/ChromeContext";
import { CATEGORY_GROUPS } from "@/lib/site/categories";
import { EASE_EOS } from "@/lib/design/tokens";

/**
 * `gold` marks one link and is not a general accent.
 *
 * The brief's standing rule is "never black-and-gold". That holds: gold does
 * not appear anywhere else on the site, and spreading it would turn a mark
 * into a scheme. It is here because the Exclusive collection is the one
 * thing in the navigation that is meant to look different from its
 * neighbours.
 */
const NAV_LINKS: {
  href: string;
  label: string;
  gold?: boolean;
  /** Subcategories, shown as a dropdown on desktop and nested on mobile. */
  children?: { href: string; label: string }[];
}[] = [
  { href: "/collections", label: "Collections" },
  { href: "/shop", label: "Shop" },
  ...CATEGORY_GROUPS.map((group) => ({
    href: `/collections/${group.handle}`,
    label: group.label,
    children: group.children.map((child) => ({
      href: `/collections/${child.handle}`,
      label: child.label,
    })),
  })),
  { href: "/collections/exclusive", label: "Exclusive", gold: true },
  { href: "/about", label: "About" },
];

/**
 * Site chrome.
 *
 * Three links and the bag. Everything a conventional storefront puts up here
 * — account, wishlist, currency, a promo bar — is either absent or lives in
 * the footer, because a header that competes with the first screen is the
 * fastest way to make a fashion site look like a marketplace.
 *
 * Over an immersive section the bar drops its background and its rule
 * entirely and the links fade back to taupe, leaving the mark and the bag as
 * the only things floating over the scene. It comes back the moment the
 * section is scrolled past.
 */
export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { totalQuantity } = useCart();
  const { immersive } = useChrome();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page while the mobile sheet is open — a sheet you can scroll
  // the page behind feels like a broken overlay.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const quiet = immersive && !scrolled;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
        quiet
          ? "border-transparent bg-transparent"
          : scrolled
            ? "border-hairline bg-void/85 backdrop-blur-xl"
            : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 sm:h-20 sm:px-10">
        <Link
          href="/"
          aria-label="EOS — home"
          className="eos-display text-lg tracking-[0.34em] text-bone transition-opacity duration-500 hover:opacity-70 sm:text-xl"
        >
          EOS
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            /*
              A link with children becomes a hover-and-focus group. The
              panel opens on `group-hover` and on `group-focus-within`, so
              it is reachable by keyboard as well as by pointer — a
              hover-only menu is invisible to anyone tabbing through.

              The parent stays a real link, not a toggle. "Kids" is a
              collection in its own right, so clicking it should go there
              rather than only opening a list.
            */
            <div key={link.href} className="group relative">
              <Link
                href={link.href}
                className={`eos-meta-sm group/link relative block transition-colors duration-500 ${
                  link.gold
                    ? "eos-gold"
                    : `hover:text-bone ${quiet ? "text-taupe/70" : "text-taupe"}`
                }`}
              >
                {link.label}
                <span
                  className={`absolute -bottom-2 left-0 h-px w-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/link:w-full ${
                    link.gold ? "bg-gold" : "bg-oxblood"
                  }`}
                />
              </Link>

              {link.children ? (
                <div
                  className={`invisible absolute left-0 top-full z-50 min-w-[11rem] translate-y-1 border border-hairline bg-void/95 opacity-0 backdrop-blur-xl transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100`}
                >
                  {/*
                    A transparent strip bridging the gap between the link
                    and the panel. Without it the pointer crosses dead space
                    on its way down, the hover drops, and the menu closes
                    under the cursor.
                  */}
                  <span aria-hidden="true" className="absolute -top-3 left-0 h-3 w-full" />
                  <ul className="py-2">
                    {link.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="eos-meta-sm block px-5 py-2.5 text-taupe transition-colors duration-300 hover:bg-charcoal hover:text-bone"
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href="/cart"
            aria-label={`Cart, ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`}
            className="eos-meta-sm flex items-center gap-2 text-taupe transition-colors duration-300 hover:text-bone"
          >
            <span>Cart</span>
            <span className="tabular-nums text-bone">
              {String(totalQuantity).padStart(2, "0")}
            </span>
          </Link>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 flex-col items-center justify-center gap-[6px] md:hidden"
          >
            <span
              className={`h-px w-5 bg-bone transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                open ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-5 bg-bone transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                open ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/*
        Mobile navigation as a full sheet rather than a dropdown list. At this
        size the links are the entire screen, so they get display type and
        room — the same treatment the desktop header gives the brand, instead
        of a stack of 14px rows.
      */}
      <AnimatePresence>
        {open && (
          <motion.nav
            className="eos-grain fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col justify-between bg-void px-6 pb-12 pt-14 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_EOS }}
          >
            <ul>
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.06 * i, ease: EASE_EOS }}
                  className="border-b border-hairline"
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`eos-display-sm block ${
                      link.children ? "pb-2 pt-6" : "py-6"
                    } text-[2rem] ${link.gold ? "eos-gold" : "text-bone"}`}
                  >
                    {link.label}
                  </Link>

                  {/*
                    Subcategories listed under the parent rather than behind
                    a second tap. The sheet has room, and a nested menu that
                    has to be opened hides the thing it exists to advertise.
                  */}
                  {link.children ? (
                    <ul className="pb-5">
                      {link.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="eos-meta-sm block py-2.5 pl-5 text-taupe transition-colors duration-300 hover:text-bone"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </motion.li>
              ))}
            </ul>

            <p className="eos-meta-sm text-taupe">
              EOS — Limited lots of existing inventory
            </p>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
