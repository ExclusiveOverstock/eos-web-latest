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
import { groupForHandle } from "@/lib/site/categories";

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
  const group = groupForHandle(handle);

  /**
   * Empty is not sold out.
   *
   * A collection's status is derived from its members, so one with no
   * members at all comes back CLOSED — and the page then told visitors
   * "every lot in this collection has sold. Nothing here returns." about a
   * collection that has never held anything. That is a lie with a
   * confident tone, and it appears the moment a new collection is created
   * in Shopify and before the first product is added to it.
   *
   * So the two are distinguished here: nothing listed yet is its own
   * state, and only a collection that has products, none of them
   * available, is sold out.
   */
  const empty = products.length === 0;
  const closed = !empty && collection.status === "CLOSED";

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
            {empty ? (
              /*
                Nothing listed yet — no count, no oxblood mark, no sold
                language. A "00 Lots" numeral would be as misleading as the
                sold-out notice it replaced: it states a fact about stock
                where the truth is simply that the collection has not been
                filled in.
              */
              <>
                <span className="eos-meta text-bone">Coming Soon</span>
                <p className="eos-meta-sm mt-4 text-taupe">
                  Nothing listed here yet.
                </p>
              </>
            ) : closed ? (
              <>
                <span className="eos-meta inline-block bg-oxblood px-3 py-1.5 text-bone">
                  Out of Stock
                </span>
                <p className="eos-meta-sm mt-4 text-taupe">
                  Every lot in this collection has sold.
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

        {/*
          Subcategory tabs, for collections that belong to a group.

          Shown on the parent and on every child, so a visitor who lands on
          Kids Tops from a search can still reach Bottoms. The active tab is
          the collection being viewed, matched by handle rather than by
          position, so reordering the group cannot mislabel it.

          Rendered above the empty-state message rather than inside the
          products branch: an empty subcategory still needs a way out of
          itself, and hiding the tabs there would strand the visitor.
        */}
        {group ? (
          <nav
            aria-label={`${group.label} categories`}
            className="mt-14 flex flex-wrap gap-x-7 gap-y-3 border-t border-hairline pt-7"
          >
            {group.children.map((child) => {
              const active = child.handle === handle;
              return (
                <Link
                  key={child.handle}
                  href={`/collections/${child.handle}`}
                  aria-current={active ? "page" : undefined}
                  className={`eos-meta-sm relative pb-1.5 transition-colors duration-300 ${
                    active ? "text-bone" : "text-taupe hover:text-bone"
                  }`}
                >
                  {child.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-px transition-colors duration-300 ${
                      active ? "bg-oxblood" : "bg-transparent"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        ) : null}

        {empty ? (
          /*
            One empty state, not two. The header above already says "Coming
            Soon / Nothing listed here yet", so repeating it here would say
            the same thing twice on a page with nothing else on it. This
            line points somewhere instead.
          */
          <p className="eos-body mt-20 max-w-md">
            This collection is being filled. In the meantime,{" "}
            <Link
              href="/shop"
              className="text-bone underline decoration-hairline-strong underline-offset-4 transition-colors duration-300 hover:decoration-bone"
            >
              everything currently listed
            </Link>{" "}
            is on the manifest.
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
