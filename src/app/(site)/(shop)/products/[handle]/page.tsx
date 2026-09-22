import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ui/ProductDetail";
import { getAllProducts, getProductByHandle } from "@/lib/shopify/catalog";

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
  // This handle 404s below, so the tab should say so rather than
  // inherit a generic title the visitor never asked for.
  if (!product) return { title: "Not found" };
  return {
    title: `${product.title} — ${product.lotCode}`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
