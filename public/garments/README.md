# EOS 3D garment assets

GLB files for the interactive garment experiences live here.

## How a product gets a real garment

1. Drop the file in this folder, named after its lot — `hoodie-014.glb`.
2. Register it in `src/components/three/garment/garment-config.ts`, against
   the product's **Shopify handle**:

   ```ts
   const ASSETS: Record<string, Partial<GarmentAsset>> = {
     "heavyweight-hoodie": { src: "/garments/hoodie-014.glb" },
   };
   ```

That is the whole swap. No component changes, no route changes. Until a
product has an entry with a `src`, it renders the procedural garment from
`src/lib/three/garment-geometry.ts`, which is a deliberate fallback rather
than a failure state — most of the manifest will never get a bespoke capture
and should still get a credible hero.

While a GLB streams in, the procedural garment stands in as the Suspense
fallback, so the composition is never empty.

## What Shopify owns, and what does not live here

Shopify owns the product: photography, price, variants, inventory,
description. A GLB is an EOS-side production artefact with its own materials
and framing, which is why the link between them is a lookup by handle rather
than a field on the product.

## Authoring notes

- **Scale and origin are handled for you.** The loader re-centres the model
  on its own bounding box, so an export with its origin at the floor is fine.
  Use `scale` in the registry only if an asset was authored in the wrong unit.
- **Materials come from the GLB.** The registry's `color` / `sheen` fields
  apply to the procedural placeholder only; a real asset keeps its own PBR
  setup.
- **Compress before committing.** Run assets through `gltf-transform optimize`
  or Draco. This folder is served to every visitor who opens a lot, and the
  garment is the only thing on screen — a 40MB export will cost more than it
  adds.
- **Budget.** Aim under ~150k triangles and 2K textures. The scene is lit by
  one hard key against black; texture resolution buys far less here than
  silhouette and normal detail do.
- **Animation clips** are optional. Name an idle loop and reference it as
  `idleClip` in the registry to have it play automatically.
