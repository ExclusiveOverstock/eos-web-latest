import Experience from "@/components/prototype-b/Experience";
import { lotFromProduct } from "@/lib/prototype-b/lot";
import { getHeroProduct } from "@/lib/shopify/catalog";

/**
 * Prototype B.
 *
 * Lives at its own route rather than replacing `/`. The brief asks for a
 * homepage built from zero, and this is it — but the project has no version
 * control, so overwriting the existing homepage would destroy site A's
 * opening with no way back. Promoting this to `/` is a one-line change once
 * the direction is signed off.
 *
 * It reads the same catalog the storefront reads. It used to carry its own
 * hard-coded lot, which drifted the moment real data arrived: B said four of
 * six at £240 while the product page said six remaining at $285, for the
 * same garment. Whichever prototype wins, they have to agree about stock.
 *
 * It opens on the hero lot for the same reason — whatever the homepage
 * presents, this presents.
 */
export default async function PrototypeBPage() {
  const lot = lotFromProduct(await getHeroProduct());
  return <Experience lot={lot} />;
}
