import type { Metadata } from "next";
import ManifestBrowser from "@/components/shop/ManifestBrowser";
import { getAllCollections, getAllSizes, getManifest } from "@/lib/shopify/catalog";

export const metadata: Metadata = {
  title: "The Manifest",
};

/**
 * The full manifest.
 *
 * Closed lots stay listed. They are not filtered out, greyed into
 * illegibility or moved to an archive page — a manifest that only shows what
 * is still available is a catalogue, and the fact that a piece is gone for
 * good is the most persuasive thing this site has to say.
 *
 * A Server Component that awaits the catalog and hands it to a client child.
 * The filtering needs interactivity; the fetching must not happen in the
 * browser.
 */
export default async function ShopPage() {
  const [products, collections, sizes] = await Promise.all([
    getManifest(),
    getAllCollections(),
    getAllSizes(),
  ]);

  return (
    <section className="px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-[1600px]">
        <p className="eos-meta-sm text-taupe">The Manifest</p>
        <h1 className="eos-display mt-6 max-w-[21ch] text-[2.2rem] text-bone sm:text-[3.6rem]">
          Everything that exists, and what is left of it.
        </h1>

        <ManifestBrowser
          products={products}
          collections={collections}
          sizes={sizes}
        />
      </div>
    </section>
  );
}
