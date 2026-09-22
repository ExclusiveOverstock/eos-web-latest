import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * The document shell, and nothing else.
 *
 * Everything that used to live here — the header, the footer, the cursor,
 * the cart and chrome providers, the font variables — moved down into
 * `(site)/layout.tsx`. It is the only consumer of them, and keeping them at
 * the root meant any new experience added to the app inherited site A's
 * furniture whether or not it wanted it.
 *
 * The reorganisation moved no page: route groups do not appear in URLs, so
 * /shop, /virtual-store and the rest resolve exactly as before. It was
 * originally done to let a second experience — Prototype B — live alongside
 * the storefront without inheriting its furniture. That prototype has since
 * been removed, but the separation is worth keeping: this file should stay
 * the document shell and nothing else.
 */

export const metadata: Metadata = {
  title: {
    default: "EOS",
    template: "%s — EOS",
  },
  description:
    "Overproduction is fashion's quiet waste problem. EOS treats it as a discovery problem — limited lots of existing inventory, listed once, closed for good.",
};

export const viewport: Viewport = {
  themeColor: "#0a0909",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
