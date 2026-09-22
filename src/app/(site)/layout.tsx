import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Cursor from "@/components/ui/Cursor";
import { eosFontVariables } from "@/lib/design/fonts";
import { CartProvider } from "@/lib/cart/CartContext";
import { ChromeProvider } from "@/lib/chrome/ChromeContext";

/**
 * Site A: the existing EOS storefront, including Prototype A's boutique.
 *
 * This layout owns everything the storefront needs and nothing else needs —
 * its chrome and its providers. It used to be the root layout; it now sits
 * inside a route group so a second, independent experience can exist
 * alongside it without inheriting any of it.
 *
 * The typefaces moved to `@/lib/design/fonts` because the error and
 * not-found pages render outside this layout and still have to be set in
 * them. See the note there.
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`${eosFontVariables} flex min-h-dvh flex-col bg-void font-body text-bone`}
    >
      <CartProvider>
        <ChromeProvider>
          <Cursor />
          <a
            href="#main"
            className="eos-meta sr-only bg-bone px-4 py-2 text-void focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </ChromeProvider>
      </CartProvider>
    </div>
  );
}
