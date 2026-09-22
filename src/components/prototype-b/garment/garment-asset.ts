/**
 * Which 3D asset stands in for a lot.
 *
 * The whole point of this indirection is that the garment on screen can be
 * replaced by a real capture without touching the experience around it. A
 * production GLB arrives, gets an entry here, and the scene picks it up —
 * no component changes, no route changes, no re-choreographing the camera.
 *
 * Until then every lot renders the procedural garment, which is a deliberate
 * fallback rather than a failure state: most of the manifest will never be
 * worth a bespoke capture and still needs a credible hero.
 *
 * Shopify owns the product — photography, price, variants, inventory. A GLB
 * is an EOS-side production artefact with its own materials and framing,
 * which is why the link between them is a lookup by lot code rather than a
 * field on the product.
 */

export type GarmentAsset = {
  /** Path under /public. Absent means render the procedural garment. */
  src?: string;
  /** Only if an asset was authored in the wrong unit; the loader re-frames. */
  scale?: number;
  /** Name of an animation clip in the GLB to play as an idle loop. */
  idleClip?: string;
};

const ASSETS: Record<string, GarmentAsset> = {
  // "EOS-014.7": { src: "/garments/hoodie-014.glb" },
};

export function garmentAsset(lotCode: string): GarmentAsset {
  return ASSETS[lotCode] ?? {};
}

export function hasModel(lotCode: string): boolean {
  return Boolean(garmentAsset(lotCode).src);
}
