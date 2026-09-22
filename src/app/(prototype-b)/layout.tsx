import type { Metadata } from "next";
import { Archivo, DM_Mono, Instrument_Serif } from "next/font/google";
import "./prototype-b.css";

/**
 * Prototype B's root.
 *
 * It deliberately renders no header, no footer and none of site A's
 * providers. B is a separate visual world, and inheriting the storefront's
 * chrome is precisely what made the previous attempt read as a new page on
 * an old site rather than a new experience.
 *
 * Typography is the other half of that separation. Site A is set in Bodoni
 * Moda — a two-century-old Didone, the traditional fashion-title register.
 * B goes somewhere else on purpose: Instrument Serif is a contemporary
 * high-contrast face whose thin strokes hold at enormous sizes, which is
 * what this layout asks of it. Reusing A's pairing would have made the two
 * prototypes indistinguishable at a glance, which defeats running them side
 * by side.
 */

/** Statements and the wordmark. High contrast, set very large. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-b-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

/** Interface and running copy. A grotesque, kept quiet. */
const archivo = Archivo({
  variable: "--font-b-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/** Lot codes, counts, specifications. */
const dmMono = DM_Mono({
  variable: "--font-b-mono",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EOS — Lot 014.7",
  description:
    "One garment, lit against nothing. EOS lists what already exists, once.",
};

export default function PrototypeBLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      data-eos-b=""
      className={`${instrumentSerif.variable} ${archivo.variable} ${dmMono.variable}`}
    >
      {children}
    </div>
  );
}
