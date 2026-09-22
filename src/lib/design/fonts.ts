import { Bebas_Neue, Inter, IBM_Plex_Mono } from "next/font/google";

/**
 * The typefaces, and the class that switches them on.
 *
 * These used to live in the site layout, which was fine while every page was
 * inside it. Error and not-found pages are the exception: an unmatched URL
 * renders against the *root* layout, and a crash serious enough to reach
 * `global-error` replaces the document entirely. Neither sees the site
 * layout, so neither would see its font variables — a 404 would arrive in
 * Times New Roman, which on this site reads as a broken page rather than a
 * designed one.
 *
 * So the declarations sit here and both worlds import them. next/font
 * deduplicates, so loading them in two places costs one download.
 */

/**
 * Bebas Neue is the display voice: a tall condensed gothic, all caps, one
 * weight. It changes the register from fashion *house* to fashion
 * *magazine* — the masthead rather than the Didone — and it is doing the
 * job Ostrich Sans was asked for, which is not on Google Fonts and would
 * have to be self-hosted.
 *
 * Two consequences the rest of the system has to respect. It has no
 * lowercase: any string set in it renders as capitals whatever the markup
 * says, so the markup keeps proper case and screen readers still hear a
 * sentence. And it has no italic, so nothing may ask for one — a
 * synthesised oblique on a condensed gothic looks like a mistake.
 */
const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/** Interface voice: navigation, product copy, forms. Deliberately neutral. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/** Metadata voice: lot codes, quantities, prices, technical detail. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/**
 * Put this on the element that wraps the typography.
 *
 * It declares the three font variables. It deliberately does NOT set colour,
 * layout or background — callers differ on those, and a class that quietly
 * imposed `flex min-h-dvh` would be wrong for the ones that do not want it.
 */
export const eosFontVariables = `${bebas.variable} ${inter.variable} ${plexMono.variable}`;
