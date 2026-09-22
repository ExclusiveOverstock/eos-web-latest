"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart/CartContext";
import { useChrome } from "@/lib/chrome/ChromeContext";
import { EASE_EOS } from "@/lib/design/tokens";

const NAV_LINKS = [
  { href: "/collections", label: "Collections" },
  { href: "/shop", label: "Shop" },
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
            <Link
              key={link.href}
              href={link.href}
              className={`eos-meta-sm group relative transition-colors duration-500 hover:text-bone ${
                quiet ? "text-taupe/70" : "text-taupe"
              }`}
            >
              {link.label}
              <span className="absolute -bottom-2 left-0 h-px w-0 bg-oxblood transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href="/cart"
            aria-label={`Bag, ${totalQuantity} ${totalQuantity === 1 ? "item" : "items"}`}
            className="eos-meta-sm flex items-center gap-2 text-taupe transition-colors duration-300 hover:text-bone"
          >
            <span>Bag</span>
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
                    className="eos-display-sm block py-6 text-[2rem] text-bone"
                  >
                    {link.label}
                  </Link>
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
