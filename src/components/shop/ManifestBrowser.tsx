"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ui/ProductCard";
import { pad2 } from "@/lib/shopify/format";
import type { Collection, Product } from "@/lib/shopify/types";

/**
 * Filtering and sorting for the manifest.
 *
 * Split out of the page so the page can be a Server Component that awaits
 * the catalog. This half needs interactivity and nothing else: it receives
 * the lots already fetched and mapped, and never learns whether they came
 * from Shopify or from placeholder data.
 *
 * Filters are stated as plain rows of text rather than dropdowns and chips.
 * At this catalogue size a select element is more chrome than the choice
 * deserves, and a filled pill is a heavy shape next to a page of hairlines.
 */

type SortKey = "manifest" | "price-asc" | "price-desc" | "scarcity";

const SORT_LABELS: Record<SortKey, string> = {
  manifest: "Manifest Order",
  scarcity: "Fewest Remaining",
  "price-asc": "Price — Low to High",
  "price-desc": "Price — High to Low",
};

export default function ManifestBrowser({
  products,
  collections,
  sizes,
}: {
  products: Product[];
  collections: Collection[];
  sizes: string[];
}) {
  const [activeCollection, setActiveCollection] = useState("all");
  const [activeSizes, setActiveSizes] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("manifest");

  function toggleSize(size: string) {
    setActiveSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  }

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCollection !== "all") {
      list = list.filter((p) => p.collectionHandles.includes(activeCollection));
    }

    if (activeSizes.length > 0) {
      list = list.filter((p) =>
        p.variants.some(
          (v) =>
            v.availableForSale &&
            v.selectedOptions.some(
              (o) => o.name === "Size" && activeSizes.includes(o.value),
            ),
        ),
      );
    }

    if (sort === "price-asc") {
      list.sort(
        (a, b) => Number(a.priceRange.min.amount) - Number(b.priceRange.min.amount),
      );
    } else if (sort === "price-desc") {
      list.sort(
        (a, b) => Number(b.priceRange.min.amount) - Number(a.priceRange.min.amount),
      );
    } else if (sort === "scarcity") {
      // Open lots by how little is left; closed lots sink to the bottom,
      // since "0 remaining" is not scarcity, it is history.
      list.sort((a, b) => {
        if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
        // Unknown counts sort last among open lots: treating null as 0
        // would rank an untracked lot as the scarcest thing on the page.
        const left = a.quantityRemaining ?? Number.POSITIVE_INFINITY;
        const right = b.quantityRemaining ?? Number.POSITIVE_INFINITY;
        return left - right;
      });
    }

    return list;
  }, [products, activeCollection, activeSizes, sort]);

  const openCount = filtered.filter((p) => p.status === "OPEN").length;

  return (
    <>
      <p className="eos-meta-sm mt-8 text-taupe">
        <span className="tabular-nums text-bone">{pad2(filtered.length)}</span> lots shown
        <span className="mx-3 text-hairline-strong">/</span>
        <span className="tabular-nums text-bone">{pad2(openCount)}</span> open
      </p>

      <div className="mt-12 flex flex-col gap-8 border-y border-hairline py-8 lg:flex-row lg:justify-between">
        <div className="flex flex-col gap-7 lg:flex-row lg:gap-12">
          <Filter
            label="Collection"
            options={[
              { value: "all", label: "All" },
              ...collections.map((c) => ({ value: c.handle, label: c.title })),
            ]}
            isActive={(value) => activeCollection === value}
            onSelect={setActiveCollection}
          />

          <Filter
            label="Size"
            options={sizes.map((s) => ({ value: s, label: s }))}
            isActive={(value) => activeSizes.includes(value)}
            onSelect={toggleSize}
          />
        </div>

        <Filter
          label="Order"
          options={(Object.keys(SORT_LABELS) as SortKey[]).map((key) => ({
            value: key,
            label: SORT_LABELS[key],
          }))}
          isActive={(value) => sort === value}
          onSelect={(value) => setSort(value as SortKey)}
        />
      </div>

      {filtered.length === 0 ? (
        // Two different nothings, and conflating them is a small lie: one is
        // the visitor's filters, the other is the shop.
        <p className="eos-meta mt-24 text-taupe">
          {products.length === 0
            ? "The manifest is empty. Nothing is listed yet."
            : "No lots match those filters."}
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * A row of text options.
 *
 * Selected state is an oxblood underline rather than a filled pill: at this
 * type size a filled chip is a heavy shape, and a page of them looks like a
 * search interface rather than an index.
 */
function Filter({
  label,
  options,
  isActive,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  isActive: (value: string) => boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <p className="eos-meta-sm text-hairline-strong">{label}</p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        {options.map((option) => {
          const active = isActive(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(option.value)}
              className={`eos-meta-sm relative pb-1.5 transition-colors duration-300 ${
                active ? "text-bone" : "text-taupe hover:text-bone"
              }`}
            >
              {option.label}
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-px transition-colors duration-300 ${
                  active ? "bg-oxblood" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
