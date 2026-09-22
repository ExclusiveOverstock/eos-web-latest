"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { shopifyImageLoader } from "@/lib/shopify/image-loader";
import type { ProductImage } from "@/lib/shopify/types";

/**
 * The product gallery.
 *
 * Replaces a vertical stack of full-width photographs. The stack was honest —
 * every frame at full size, in store order — but on a desktop column it ran
 * several screens tall and made the page feel like a scroll to get through
 * rather than a thing to look at.
 *
 * TWO DECISIONS WORTH KEEPING.
 *
 * `object-contain`, not `cover`. EOS's photography is mixed: the hero is a
 * 6000x4000 flat lay and the second frame is usually a 4000x6000 detail. Any
 * fixed frame has to crop one orientation or the other, and on a product page
 * — the one screen where someone is deciding whether to buy — cropping the
 * garment is the wrong trade. Contained on a void background, the letterbox
 * is invisible, because the background it letterboxes against is the page.
 *
 * A fixed frame, not per-image ratios. The slide changes under the cursor, so
 * a frame that resized per photograph would shift the thumbnails and the buy
 * panel every time somebody clicked. Consistency beats tightness here.
 */
export default function ProductGallery({
  images,
  title,
}: {
  images: ProductImage[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const frame = useRef<HTMLDivElement>(null);

  const count = images.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  /**
   * Arrow keys, but only while the gallery has focus.
   *
   * Bound to the frame rather than the document: a global listener would
   * hijack the arrow keys for anyone using them to scroll the page, which is
   * most keyboard users most of the time.
   */
  useEffect(() => {
    const el = frame.current;
    if (!el || count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [count, go, index]);

  return (
    <div>
      <div
        ref={frame}
        tabIndex={count > 1 ? 0 : -1}
        role={count > 1 ? "group" : undefined}
        aria-label={count > 1 ? `${title} — image ${index + 1} of ${count}` : undefined}
        className="group relative aspect-[4/3] w-full overflow-hidden border border-hairline bg-void outline-none focus-visible:border-hairline-strong"
      >
        {/*
          Every frame is mounted and cross-faded rather than swapping one
          `src`. Swapping makes the browser fetch on first click, so the
          gallery flashes empty at exactly the moment someone asked to see
          the next photograph.
        */}
        {images.map((image, i) =>
          image.url ? (
            <Image
              key={image.id}
              src={image.url}
              alt={image.altText}
              fill
              loader={shopifyImageLoader}
              sizes="(min-width: 1024px) 55vw, 100vw"
              priority={i === 0}
              className={`object-contain transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : (
            <div
              key={image.id}
              aria-hidden="true"
              className={`absolute inset-0 bg-gradient-to-b ${image.tone} transition-opacity duration-500 ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            />
          ),
        )}

        {count > 1 && (
          <>
            {/*
              Controls sit on the frame and stay visible on touch, where there
              is no hover to reveal them. On a pointer device they fade up
              with the frame so a still photograph is not permanently wearing
              two arrows.
            */}
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous image"
              className="absolute left-0 top-0 flex h-full w-14 items-center justify-center text-bone opacity-60 transition-opacity duration-300 hover:bg-gradient-to-r hover:from-void/70 hover:to-transparent hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-70 sm:group-hover:hover:opacity-100"
            >
              <span aria-hidden className="eos-meta text-lg">&#8592;</span>
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next image"
              className="absolute right-0 top-0 flex h-full w-14 items-center justify-center text-bone opacity-60 transition-opacity duration-300 hover:bg-gradient-to-l hover:from-void/70 hover:to-transparent hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-70 sm:group-hover:hover:opacity-100"
            >
              <span aria-hidden className="eos-meta text-lg">&#8594;</span>
            </button>

            <p className="eos-meta-sm pointer-events-none absolute bottom-4 right-5 text-taupe">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </p>
          </>
        )}
      </div>

      {/* --- Thumbnails ------------------------------------------- */}
      {count > 1 && (
        <div className="mt-3 flex gap-3">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show image ${i + 1} of ${count}`}
              aria-current={i === index}
              className={`relative aspect-square w-16 shrink-0 overflow-hidden border bg-void transition-colors duration-300 sm:w-20 ${
                i === index
                  ? "border-bone"
                  : "border-hairline hover:border-hairline-strong"
              }`}
            >
              {image.url ? (
                <Image
                  src={image.url}
                  alt=""
                  fill
                  loader={shopifyImageLoader}
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 bg-gradient-to-b ${image.tone}`}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/*
        Announced out of band so a screen reader hears the slide change
        without the focus moving. The visible counter above is decorative by
        comparison — it is positioned over the photograph and easy to miss.
      */}
      <p aria-live="polite" className="sr-only">
        {count > 1 ? `Image ${index + 1} of ${count}` : ""}
      </p>
    </div>
  );
}
