import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import { pad2 } from "@/lib/shopify/format";
import {
  getAllCollections,
  getCollectionByHandle,
  getProductsByCollection,
} from "@/lib/shopify/catalog";

export async function generateStaticParams() {
  return (await getAllCollections()).map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle);
  return {
    title: collection?.title ?? "Collection",
    description: collection?.description,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle);
  if (!collection) notFound();

  const products = await getProductsByCollection(handle);
  const closed = collection.status === "CLOSED";

  return (
    <section className="px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-[1600px]">
        <Link
          href="/collections"
          className="eos-meta-sm text-taupe transition-colors duration-300 hover:text-bone"
        >
          ← All Collections
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-20">
          <div>
            <p className="eos-meta-sm text-taupe">Collection</p>
            <h1 className="eos-display mt-5 max-w-[21ch] text-[2.2rem] text-bone sm:text-[3.4rem]">
              {collection.title}
            </h1>
            <p className="eos-body mt-6 max-w-lg">{collection.description}</p>
          </div>

          {/*
            The count is the headline fact about a collection here, so it is
            set at display size rather than tucked into a badge.
          */}
          <div className="border-t border-hairline pt-6">
            {closed ? (
              <>
                <span className="eos-meta inline-block bg-oxblood px-3 py-1.5 text-bone">
                  Fully Closed
                </span>
                <p className="eos-meta-sm mt-4 text-taupe">
                  Every lot in this collection has sold. Nothing here returns.
                </p>
              </>
            ) : (
              <>
                {/*
                  Lots, not pieces. The piece count that stood here was
                  removed with every other stock figure on the site; how many
                  lots a collection holds is a fact about the catalogue
                  rather than about inventory.
                */}
                <p className="flex items-baseline gap-4">
                  <span className="eos-display text-[3rem] leading-none text-bone tabular-nums sm:text-[4rem]">
                    {pad2(products.length)}
                  </span>
                  <span className="eos-meta text-taupe">
                    {products.length === 1 ? "Lot" : "Lots"}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <p className="eos-meta mt-24 text-taupe">
            No lots in this collection yet.
          </p>
        ) : (
          <div className="mt-16 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
  {/*
    Fills out the last row.

    The grid draws its separators by painting the container hairline
    and letting a 1px gap show through. That works for every complete
    row and fails on the last one: where there are no cards, there is
    nothing painting over the container, so the leftover cells render
    as a solid grey block.

    Padding to a multiple of four closes it. Four also covers the
    two-column breakpoint, since any multiple of four is even.
  */}
  {Array.from({ length: (4 - (products.length % 4)) % 4 }).map((_, i) => (
    <div key={`filler-${i}`} aria-hidden="true" className="bg-void" />
  ))}
          </div>
        )}
      </div>
    </section>
  );
}
