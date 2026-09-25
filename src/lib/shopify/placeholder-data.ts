import type { Collection, Product, ProductSpec, ProductVariant } from "./types";

/**
 * Stand-in for the Shopify Storefront API.
 *
 * Every field here is one Shopify will own. Nothing that consumes this
 * module knows it is placeholder data — components import the accessors at
 * the bottom, never the arrays — so Milestone 3 replaces this file with a
 * fetch layer and touches no UI.
 *
 * `tone` is the exception and is temporary: it stands in for product
 * photography that does not exist yet. It is a Tailwind gradient pair, not
 * an image URL, so that no component ends up written against a hardcoded
 * asset path it would later have to unlearn.
 */

export const COLLECTIONS: Collection[] = [
  {
    id: "col-heavyweight",
    handle: "heavyweight",
    title: "Heavyweight Jersey",
    description:
      "Loopback and fleece from mills that ran past their order. Dense, dry, and cut boxy.",
    tone: "from-[#201c1a] to-[#0a0909]",
    status: "OPEN",
  },
  {
    id: "col-outerwear",
    handle: "outerwear",
    title: "Outerwear",
    description:
      "Overcoats, shells and tailored jackets pulled from mill overruns.",
    tone: "from-[#1c1a16] to-[#0a0909]",
    status: "OPEN",
  },
  {
    id: "col-tailoring",
    handle: "tailoring",
    title: "Tailoring",
    description:
      "Suiting and shirting cut from deadstock cloth, never reordered.",
    tone: "from-[#1a1613] to-[#0a0909]",
    status: "OPEN",
  },
  {
    id: "col-denim",
    handle: "denim",
    title: "Selvage & Denim",
    description:
      "Raw and washed selvage from small-batch Japanese and Italian mills.",
    tone: "from-[#181614] to-[#0a0909]",
    status: "OPEN",
  },
  {
    id: "col-knitwear",
    handle: "knitwear",
    title: "Knitwear",
    description:
      "Merino and lambswool from a single closed lot. Sold in full.",
    tone: "from-[#151311] to-[#0a0909]",
    status: "CLOSED",
  },
];

function buildVariants(
  lotCode: string,
  price: string,
  sizes: string[],
  soldOut = false,
): ProductVariant[] {
  return sizes.map((size, i) => ({
    id: `${lotCode}-${size}`,
    title: size,
    sku: `${lotCode}-${size}`,
    price: { amount: price, currencyCode: "USD" },
    availableForSale: !soldOut,
    selectedOptions: [{ name: "Size", value: size }],
  }));
}

function sizeOption(sizes: string[]) {
  return [{ id: "opt-size", name: "Size", values: sizes }];
}

function specs(...pairs: [string, string][]): ProductSpec[] {
  return pairs.map(([label, value]) => ({ label, value }));
}

export const PRODUCTS: Product[] = [
  {
    // The hero piece. Its handle is what the homepage's 3D asset resolves
    // against in garment-config, so if this product is renamed the hero
    // falls back to the default placeholder material rather than breaking.
    id: "prod-heavyweight-hoodie",
    handle: "heavyweight-hoodie",
    title: "Heavyweight Hooded Sweat",
    description:
      "480gsm loopback cotton from an overrun at a Portuguese mill, cut boxy with a dropped shoulder and a lined hood. The lot was produced against an order that was cut in half after the cloth had already been knitted. Six pieces remain.",
    lotCode: "EOS-014.7",
    status: "OPEN",
    // Six knitted, six remaining — nothing has sold yet.
    lotTotal: 6,
    collectionHandles: ["heavyweight"],
    specs: specs(
      ["Weight", "480 GSM"],
      ["Composition", "100% Cotton"],
      ["Fit", "Relaxed"],
      ["Construction", "Loopback, flatlock seams"],
      ["Origin", "Portugal"],
    ),
    images: [
      { id: "img-1", altText: "Heavyweight hooded sweat, front", url: null, width: null, height: null, tone: "from-[#221e1c] to-[#0a0909]" },
      { id: "img-2", altText: "Heavyweight hooded sweat, hood detail", url: null, width: null, height: null, tone: "from-[#282320] to-[#0a0909]" },
    ],
    options: sizeOption(["S", "M", "L", "XL"]),
    variants: buildVariants("EOS-014.7", "285.00", ["S", "M", "L", "XL"]),
    priceRange: { min: { amount: "285.00", currencyCode: "USD" }, max: { amount: "285.00", currencyCode: "USD" } },
  },
  {
    id: "prod-wool-overcoat-charcoal",
    handle: "wool-overcoat-charcoal",
    title: "Wool Overcoat — Charcoal",
    description:
      "Double-faced wool overcoat cut from a mill overrun originally produced for a European ready-to-wear house. Full canvas construction, horn buttons, notch lapel. This lot is closed — all six pieces have sold.",
    lotCode: "EOS-014.2",
    status: "CLOSED",
    collectionHandles: ["outerwear"],
    specs: specs(
      ["Weight", "740 GSM"],
      ["Composition", "Double-faced wool"],
      ["Fit", "Straight"],
      ["Construction", "Full canvas, horn buttons"],
      ["Origin", "Italy"],
    ),
    images: [
      { id: "img-1", altText: "Wool overcoat, front", url: null, width: null, height: null, tone: "from-[#1c1a16] to-[#0a0909]" },
      { id: "img-2", altText: "Wool overcoat, detail", url: null, width: null, height: null, tone: "from-[#211d18] to-[#0a0909]" },
    ],
    options: sizeOption(["S", "M", "L", "XL"]),
    variants: buildVariants("EOS-014.2", "480.00", ["S", "M", "L", "XL"], true),
    priceRange: { min: { amount: "480.00", currencyCode: "USD" }, max: { amount: "480.00", currencyCode: "USD" } },
  },
  {
    id: "prod-leather-moto-jacket",
    handle: "leather-moto-jacket",
    title: "Leather Moto Jacket",
    description:
      "Lambskin moto jacket from a leather goods atelier's surplus run. Asymmetric zip, quilted shoulder panel, satin lining. Nine pieces remain in this lot.",
    lotCode: "EOS-033.2",
    status: "OPEN",
    collectionHandles: ["outerwear"],
    specs: specs(
      ["Composition", "Lambskin"],
      ["Fit", "Slim"],
      ["Construction", "Asymmetric zip, satin lining"],
      ["Hardware", "Antiqued nickel"],
      ["Origin", "Spain"],
    ),
    images: [
      { id: "img-1", altText: "Leather moto jacket, front", url: null, width: null, height: null, tone: "from-[#191614] to-[#0a0909]" },
      { id: "img-2", altText: "Leather moto jacket, detail", url: null, width: null, height: null, tone: "from-[#1e1a17] to-[#0a0909]" },
    ],
    options: sizeOption(["S", "M", "L"]),
    variants: buildVariants("EOS-033.2", "690.00", ["S", "M", "L"]),
    priceRange: { min: { amount: "690.00", currencyCode: "USD" }, max: { amount: "690.00", currencyCode: "USD" } },
  },
  {
    id: "prod-waxed-field-jacket",
    handle: "waxed-field-jacket",
    title: "Waxed Field Jacket",
    description:
      "Waxed cotton field jacket from a British outerwear mill's overrun. Corduroy collar, bellows pockets, brass hardware. Five pieces remain.",
    lotCode: "EOS-041.2",
    status: "OPEN",
    collectionHandles: ["outerwear"],
    specs: specs(
      ["Weight", "8 OZ"],
      ["Composition", "Waxed cotton"],
      ["Fit", "Regular"],
      ["Construction", "Bellows pockets, corduroy collar"],
      ["Origin", "United Kingdom"],
    ),
    images: [
      { id: "img-1", altText: "Waxed field jacket, front", url: null, width: null, height: null, tone: "from-[#1a1815] to-[#0a0909]" },
      { id: "img-2", altText: "Waxed field jacket, detail", url: null, width: null, height: null, tone: "from-[#201c18] to-[#0a0909]" },
    ],
    options: sizeOption(["S", "M", "L", "XL"]),
    variants: buildVariants("EOS-041.2", "340.00", ["S", "M", "L", "XL"]),
    priceRange: { min: { amount: "340.00", currencyCode: "USD" }, max: { amount: "340.00", currencyCode: "USD" } },
  },
  {
    id: "prod-tailored-wool-suit",
    handle: "tailored-wool-suit",
    title: "Tailored Wool Suiting — Two Piece",
    description:
      "Half-canvas two-piece suit cut from deadstock Italian wool. Single-breasted, side vents, flat-front trouser. This lot is closed — all four pieces have sold.",
    lotCode: "EOS-026.1",
    status: "CLOSED",
    collectionHandles: ["tailoring"],
    specs: specs(
      ["Weight", "280 GSM"],
      ["Composition", "Wool"],
      ["Fit", "Tailored"],
      ["Construction", "Half canvas, side vents"],
      ["Origin", "Italy"],
    ),
    images: [
      { id: "img-1", altText: "Wool suit, front", url: null, width: null, height: null, tone: "from-[#181614] to-[#0a0909]" },
      { id: "img-2", altText: "Wool suit, detail", url: null, width: null, height: null, tone: "from-[#1d1a16] to-[#0a0909]" },
    ],
    options: sizeOption(["38R", "40R", "42R", "44R"]),
    variants: buildVariants("EOS-026.1", "780.00", ["38R", "40R", "42R", "44R"], true),
    priceRange: { min: { amount: "780.00", currencyCode: "USD" }, max: { amount: "780.00", currencyCode: "USD" } },
  },
  {
    id: "prod-silk-shirting-ivory",
    handle: "silk-shirting-ivory",
    title: "Silk Shirting — Ivory",
    description:
      "Silk-cotton blend shirting from a shirtmaker's surplus bolt. Mother-of-pearl buttons, single-needle stitching. This lot is closed — all three pieces have sold.",
    lotCode: "EOS-009.1",
    status: "CLOSED",
    collectionHandles: ["tailoring"],
    specs: specs(
      ["Composition", "Silk / Cotton"],
      ["Fit", "Regular"],
      ["Construction", "Single-needle, MOP buttons"],
      ["Origin", "Italy"],
    ),
    images: [
      { id: "img-1", altText: "Silk shirt, front", url: null, width: null, height: null, tone: "from-[#1c1a17] to-[#0a0909]" },
      { id: "img-2", altText: "Silk shirt, detail", url: null, width: null, height: null, tone: "from-[#211e19] to-[#0a0909]" },
    ],
    options: sizeOption(["S", "M", "L"]),
    variants: buildVariants("EOS-009.1", "165.00", ["S", "M", "L"], true),
    priceRange: { min: { amount: "165.00", currencyCode: "USD" }, max: { amount: "165.00", currencyCode: "USD" } },
  },
  {
    id: "prod-cotton-poplin-shirt-slate",
    handle: "cotton-poplin-shirt-slate",
    title: "Cotton Poplin Shirt — Slate",
    description:
      "Fine poplin shirting in slate grey, cut from a shirtmaker's overrun. Point collar, barrel cuff. Eleven pieces remain in this lot.",
    lotCode: "EOS-048.4",
    status: "OPEN",
    collectionHandles: ["tailoring"],
    specs: specs(
      ["Composition", "100% Cotton poplin"],
      ["Fit", "Regular"],
      ["Construction", "Point collar, barrel cuff"],
      ["Origin", "Portugal"],
    ),
    images: [
      { id: "img-1", altText: "Poplin shirt, front", url: null, width: null, height: null, tone: "from-[#191a1c] to-[#0a0909]" },
      { id: "img-2", altText: "Poplin shirt, detail", url: null, width: null, height: null, tone: "from-[#1d1e20] to-[#0a0909]" },
    ],
    options: sizeOption(["S", "M", "L", "XL"]),
    variants: buildVariants("EOS-048.4", "145.00", ["S", "M", "L", "XL"]),
    priceRange: { min: { amount: "145.00", currencyCode: "USD" }, max: { amount: "145.00", currencyCode: "USD" } },
  },
  {
    id: "prod-raw-selvage-denim-straight",
    handle: "raw-selvage-denim-straight",
    title: "Raw Selvage Denim — Straight",
    description:
      "14oz raw selvage denim from a small-batch Japanese mill, cut straight. Chain-stitched hem, copper rivets. Fourteen pieces remain — the largest open lot on the manifest.",
    lotCode: "EOS-021.3",
    status: "OPEN",
    collectionHandles: ["denim"],
    specs: specs(
      ["Weight", "14 OZ"],
      ["Composition", "Raw selvage cotton"],
      ["Fit", "Straight"],
      ["Construction", "Chain-stitched hem, copper rivets"],
      ["Origin", "Japan"],
    ),
    images: [
      { id: "img-1", altText: "Raw selvage denim, front", url: null, width: null, height: null, tone: "from-[#161a1e] to-[#0a0909]" },
      { id: "img-2", altText: "Raw selvage denim, detail", url: null, width: null, height: null, tone: "from-[#1b1f23] to-[#0a0909]" },
    ],
    options: sizeOption(["28", "30", "32", "34", "36"]),
    variants: buildVariants("EOS-021.3", "260.00", ["28", "30", "32", "34", "36"]),
    priceRange: { min: { amount: "260.00", currencyCode: "USD" }, max: { amount: "260.00", currencyCode: "USD" } },
  },
  {
    id: "prod-washed-selvage-denim-tapered",
    handle: "washed-selvage-denim-tapered",
    title: "Washed Selvage Denim — Tapered",
    description:
      "Stone-washed selvage denim from an Italian mill's surplus roll, cut tapered. Eight pieces remain in this lot.",
    lotCode: "EOS-052.1",
    status: "OPEN",
    collectionHandles: ["denim"],
    specs: specs(
      ["Weight", "12.5 OZ"],
      ["Composition", "Washed selvage cotton"],
      ["Fit", "Tapered"],
      ["Construction", "Stone wash, chain-stitched hem"],
      ["Origin", "Italy"],
    ),
    images: [
      { id: "img-1", altText: "Washed selvage denim, front", url: null, width: null, height: null, tone: "from-[#181a1d] to-[#0a0909]" },
      { id: "img-2", altText: "Washed selvage denim, detail", url: null, width: null, height: null, tone: "from-[#1d1f22] to-[#0a0909]" },
    ],
    options: sizeOption(["28", "30", "32", "34"]),
    variants: buildVariants("EOS-052.1", "275.00", ["28", "30", "32", "34"]),
    priceRange: { min: { amount: "275.00", currencyCode: "USD" }, max: { amount: "275.00", currencyCode: "USD" } },
  },
  {
    id: "prod-merino-knit-crewneck",
    handle: "merino-knit-crewneck",
    title: "Merino Knit Crewneck",
    description:
      "Fully-fashioned merino crewneck from a single closed knitwear lot. Ribbed collar, cuff and hem. This lot is closed — sold in full.",
    lotCode: "EOS-017.5",
    status: "CLOSED",
    collectionHandles: ["knitwear"],
    specs: specs(
      ["Gauge", "12 GG"],
      ["Composition", "Extra-fine merino"],
      ["Fit", "Regular"],
      ["Construction", "Fully fashioned"],
      ["Origin", "Scotland"],
    ),
    images: [
      { id: "img-1", altText: "Merino crewneck, front", url: null, width: null, height: null, tone: "from-[#17191a] to-[#0a0909]" },
      { id: "img-2", altText: "Merino crewneck, detail", url: null, width: null, height: null, tone: "from-[#1c1e1f] to-[#0a0909]" },
    ],
    options: sizeOption(["S", "M", "L", "XL"]),
    variants: buildVariants("EOS-017.5", "210.00", ["S", "M", "L", "XL"], true),
    priceRange: { min: { amount: "210.00", currencyCode: "USD" }, max: { amount: "210.00", currencyCode: "USD" } },
  },
  {
    id: "prod-merino-half-zip",
    handle: "merino-half-zip",
    title: "Merino Half-Zip",
    description:
      "Merino half-zip pullover from the same closed knitwear lot as the crewneck. This lot is closed — sold in full.",
    lotCode: "EOS-017.6",
    status: "CLOSED",
    collectionHandles: ["knitwear"],
    specs: specs(
      ["Gauge", "12 GG"],
      ["Composition", "Extra-fine merino"],
      ["Fit", "Regular"],
      ["Construction", "Fully fashioned, half zip"],
      ["Origin", "Scotland"],
    ),
    images: [
      { id: "img-1", altText: "Merino half-zip, front", url: null, width: null, height: null, tone: "from-[#17191a] to-[#0a0909]" },
      { id: "img-2", altText: "Merino half-zip, detail", url: null, width: null, height: null, tone: "from-[#1c1e1f] to-[#0a0909]" },
    ],
    options: sizeOption(["S", "M", "L"]),
    variants: buildVariants("EOS-017.6", "230.00", ["S", "M", "L"], true),
    priceRange: { min: { amount: "230.00", currencyCode: "USD" }, max: { amount: "230.00", currencyCode: "USD" } },
  },
];

/** The piece the homepage opens on. */
export const HERO_HANDLE = "heavyweight-hoodie";

export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProductByHandle(handle: string): Product | undefined {
  return PRODUCTS.find((p) => p.handle === handle);
}

export function getHeroProduct(): Product {
  const hero = getProductByHandle(HERO_HANDLE);
  if (!hero) throw new Error(`Hero product "${HERO_HANDLE}" is missing from the manifest`);
  return hero;
}

export function getAllCollections(): Collection[] {
  return COLLECTIONS;
}

export function getCollectionByHandle(handle: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.handle === handle);
}

export function getProductsByCollection(handle: string): Product[] {
  return PRODUCTS.filter((p) => p.collectionHandles.includes(handle));
}

export function getAllSizes(): string[] {
  const sizes = new Set<string>();
  PRODUCTS.forEach((p) =>
    p.variants.forEach((v) =>
      v.selectedOptions
        .filter((o) => o.name === "Size")
        .forEach((o) => sizes.add(o.value)),
    ),
  );
  return Array.from(sizes);
}

/** Open lots first, then closed — the manifest reads as availability. */
export function getManifest(): Product[] {
  return [...PRODUCTS].sort((a, b) => {
    if (a.status !== b.status) return a.status === "OPEN" ? -1 : 1;
    return a.lotCode.localeCompare(b.lotCode);
  });
}
