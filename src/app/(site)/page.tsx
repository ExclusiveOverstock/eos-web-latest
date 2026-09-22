import Image from "next/image";
import Link from "next/link";
import banner from "@/assets/editorial/the-model-campaign.webp";
import HeroExperience from "@/components/home/HeroExperience";
import CollectionIndex from "@/components/ui/CollectionIndex";
import ManifestStrip from "@/components/ui/ManifestStrip";
import ProductCard from "@/components/ui/ProductCard";
import Reveal from "@/components/ui/Reveal";
import { getHeroProduct, getManifest } from "@/lib/shopify/catalog";

/**
 * The homepage.
 *
 * Curiosity first, commerce second. The opening is three screens of one
 * continuous camera move with almost no words on it; the explanation only
 * arrives once someone has scrolled past the piece, which is the point at
 * which they have chosen to want it explained.
 *
 * After that the page is deliberately plain: a statement, the archive as an
 * index, four open lots, and the other prototype. No carousels, no social
 * proof, no newsletter interstitial.
 */
export default async function Home() {
  const [hero, manifest] = await Promise.all([getHeroProduct(), getManifest()]);
  const openLots = manifest.filter((p) => p.status === "OPEN").slice(0, 4);

  /**
   * An empty catalog is a real state, not an error.
   *
   * A store before its first lot is published returns nothing, and this page
   * used to answer that by rendering nothing at all — a blank homepage under
   * a working header. Everything above the product grid is brand rather than
   * inventory, so it all still plays; only the parts that describe actual
   * lots step aside.
   */
  return (
    <>
      <HeroExperience lotCode={hero?.lotCode} />

      {/* --- The model ------------------------------------------- */}
      <section className="relative isolate overflow-hidden border-t border-hairline px-6 py-28 sm:px-10 sm:py-44">
        {/*
          The campaign frame, second appearance — a harder problem than the
          one on /about, and the scrim is shaped by measurement rather than
          taste.
          
          At desktop width the copy occupies x 3–36% (the statement) and
          58–97% (the four blocks), from 31% to 80% of the section's height.
          That leaves exactly one region genuinely free of text: the band
          across the top. So the photograph lives there and the gradient goes
          solid by 30% height, before the first line of type — the section
          emerges out of the image rather than sitting on top of it.
          
          A second, gentle scrim runs left instead. It is there for the
          "The Model" label, which is taupe on a 10px line and sat at 65/255
          luminance over the blown-out studio wall — 3.2:1, under AA. Pulling
          the left down to 38 takes it to about 4.6:1, and it improves the
          picture as a side effect by killing the white wall the photograph
          did not need.
          
          The body copy is taupe too, which is what makes the band the only
          honest answer here rather than a lighter wash over everything:
          taupe over a lit photograph fails contrast at almost any exposure.
        */}
        {/*
          The image is sized to the band it actually occupies, not to the
          whole section.
          
          `fill` across the section made the frame roughly square, and
          `object-cover` against a 3:2 photograph then cropped about 15% off
          each side — which on a three-figure campaign shot removed two of
          the three figures. Constraining it to the visible band makes the
          band wider than the photograph instead of taller, so the crop moves
          to the vertical axis, where there is ceiling and floor to lose.
        */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[58%]">
          <Image
            src={banner}
            alt=""
            fill
            sizes="100vw"
            placeholder="blur"
            className="object-cover object-center"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-void/10 via-void/88 via-38% to-void to-56%"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-void/60 via-void/12 via-45% to-transparent"
        />
        {/*
          The top edge.

          The vertical scrim opens at 10% alpha, so without this the
          photograph began at almost full strength directly against the black
          hero above it — a hard horizontal seam straight across the page,
          which read as two screenshots stacked rather than as one document.
          A short fade back to void gives the band something to emerge from.

          It is a separate element rather than another stop on the vertical
          gradient because that gradient already uses all three of Tailwind's
          colour stops, and this needs a fourth.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-void to-transparent sm:h-32"
        />
        <div aria-hidden="true" className="eos-grain absolute inset-0" />

        <div className="relative mx-auto max-w-[1600px]">
          <Reveal>
            <p className="eos-meta-sm text-taupe">The Model</p>
          </Reveal>

          <div className="mt-12 grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-24">
            <Reveal>
              <p className="eos-display max-w-[23ch] text-[2rem] text-bone sm:text-[3.2rem]">
                A mill produces more than the order. We buy what is left,
                whole.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid gap-10 sm:grid-cols-2 lg:pt-4">
                <div>
                  <p className="eos-meta-sm text-taupe">01 — Acquisition</p>
                  <p className="eos-body mt-4">
                    Cloth, cut or finished garments a maker produced beyond
                    what its own order required. Instead of liquidation or
                    landfill, the lot moves once, intact.
                  </p>
                </div>
                <div>
                  <p className="eos-meta-sm text-taupe">02 — Listing</p>
                  <p className="eos-body mt-4">
                    Listed once, at the size the lot allows. No reorder, no
                    restock, no second production run — because there is
                    nothing to reorder from.
                  </p>
                </div>
                <div>
                  <p className="eos-meta-sm text-taupe">03 — Closure</p>
                  <p className="eos-body mt-4">
                    A lot that sells out is struck from the manifest
                    permanently. It stays listed, marked closed. That is the
                    only kind of exclusivity we are willing to promise.
                  </p>
                </div>
                <div>
                  <p className="eos-meta-sm text-taupe">04 — Provenance</p>
                  <p className="eos-body mt-4">
                    What we know about a lot, we state. What we do not, we
                    leave blank. Surplus does not always arrive with its
                    paperwork, and inventing the missing half would defeat
                    the point of selling it.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <ManifestStrip />

      {/* --- The archive ----------------------------------------- */}
      <section className="px-6 py-28 sm:px-10 sm:py-40">
        <div className="mx-auto max-w-[1600px]">
          <Reveal>
            <div className="mb-12 flex items-baseline justify-between gap-6">
              <p className="eos-meta-sm text-taupe">The Archive</p>
              <Link
                href="/collections"
                className="eos-meta-sm text-taupe transition-colors duration-300 hover:text-bone"
              >
                All Collections
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <CollectionIndex />
          </Reveal>
        </div>
      </section>

      {/* --- Open lots -------------------------------------------- */}
      <section className="px-6 pb-28 sm:px-10 sm:pb-40">
        <div className="mx-auto max-w-[1600px]">
          <Reveal>
            <div className="mb-10 flex items-baseline justify-between gap-6">
              <p className="eos-meta-sm text-taupe">Open Lots</p>
              <Link
                href="/shop"
                className="eos-meta-sm text-taupe transition-colors duration-300 hover:text-bone"
              >
                Full Manifest
              </Link>
            </div>
          </Reveal>

          {openLots.length === 0 ? (
            <Reveal>
              <p className="eos-display-sm max-w-[26ch] border-t border-hairline pt-10 text-[1.3rem] text-bone sm:text-[1.7rem]">
                Nothing is open right now.
              </p>
              <p className="eos-body mt-5 max-w-md">
                Lots are listed as they are acquired, and close when they sell.
                There is no schedule — that is rather the point.
              </p>
            </Reveal>
          ) : (
            <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline sm:grid-cols-4">
              {openLots.map((product, i) => (
                <Reveal key={product.id} delay={i * 0.06}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

    </>
  );
}
