import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LotExperience from "@/components/lot/LotExperience";
import { getAllProducts, getProductByHandle } from "@/lib/shopify/catalog";

/**
 * PROTOTYPE B.
 *
 * Sits alongside Prototype A at /virtual-store rather than replacing it —
 * the two are alternative answers to the same question and the choice
 * between them has not been made. Neither route knows the other exists.
 */

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  // See the note on the product route: a missing handle 404s.
  if (!product) return { title: "Not found" };
  return {
    title: `${product.title} — ${product.lotCode}`,
    description: product.description,
  };
}

export default async function LotPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  return <LotExperience product={product} />;
}
