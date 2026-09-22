"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createGarmentInput } from "@/lib/prototype-b/interaction";
import type { Lot } from "@/lib/prototype-b/tokens";
import Reveal from "./Reveal";

/**
 * Prototype B.
 *
 * The page is a single continuous shot. A fixed WebGL stage holds one
 * garment for the whole scroll; the type moves past it. Nothing here is a
 * section with its own image — there is one subject, seen from seven
 * distances, and the scroll position is the camera operator.
 *
 * The order is deliberate and it is the argument the brand wants to make:
 * you meet the piece before you are told anything, you are told what it is
 * before you are told what it costs, and the only place commerce appears is
 * at the very bottom, after the case has been made.
 */

/**
 * Client-only: WebGL has no server rendering, and this keeps the entire
 * three/R3F bundle out of every other route's payload — it is fetched when
 * someone opens this experience and never otherwise.
 */
const GarmentStage = dynamic(() => import("./garment/GarmentStage"), {
  ssr: false,
});

/**
 * @param lot mapped from the catalog by the route above, never assembled
 *   here. Prototype B is a way of presenting a lot, not a place that decides
 *   what the lot is.
 */
export default function Experience({ lot }: { lot: Lot }) {
  // Stable, non-reactive buffer shared with the render loop. Held in state
  // purely so passing it down doesn't trip the "no ref access during render"
  // lint rule; its identity never changes and the setter is never called.
  const [input] = useState(createGarmentInput);

  const [size, setSize] = useState<string | null>(null);
  const [turned, setTurned] = useState(false);

  /**
   * Construction detail, and only what is actually known.
   *
   * This beat used to state a 480gsm loopback, a two-panel hood and a
   * kangaroo pocket. None of that came from anywhere: it was written against
   * an imagined hero product, and once the catalog became real it was both
   * unverifiable and — for the crewnecks that make up most of the manifest —
   * describing a garment with a hood that does not exist.
   *
   * So the rows come from the lot, and a lot that carries no specs shows no
   * table rather than a column of dashes. Saying less is the honest option
   * on a site whose entire argument is that its numbers are real.
   */
  const details = (
    [
      ["Composition", lot.composition],
      ["Weight", lot.weight],
      ["Fit", lot.fit],
      ["Construction", lot.construction],
      ["Origin", lot.origin],
    ] as const
  ).filter(([, value]) => value && value !== "—");

  const spineFill = useRef<HTMLDivElement>(null);

  /* ---- Scroll ------------------------------------------------------ */
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      input.progress = progress;
      // Written straight to the DOM rather than through state: this fires on
      // every scroll frame, and a re-render here would fight the camera for
      // the same frame budget.
      if (spineFill.current) {
        spineFill.current.style.transform = `scaleY(${progress})`;
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [input]);

  /* ---- Retire the drag hint once it has been used ------------------ */
  useEffect(() => {
    if (turned) return;
    const id = window.setInterval(() => {
      if (input.hasInteracted) setTurned(true);
    }, 400);
    return () => window.clearInterval(id);
  }, [input, turned]);

  const SIZES = lot.sizes;

  /**
   * Three states, not two.
   *
   * `closed` is only true when the count is known to be zero — a null
   * remaining means Shopify would not say, which is emphatically not the
   * same as sold out. `taken` needs both numbers, so it is null whenever
   * either is missing, and every surface below that would have stated a
   * figure steps aside instead of inventing one.
   */
  const closed = lot.remaining === 0;
  const taken =
    lot.total !== null && lot.remaining !== null ? lot.total - lot.remaining : null;

  return (
    <>
      <GarmentStage input={input} lotCode={lot.code} />
      <div className="pb-vignette" aria-hidden="true" />

      <div className="pb-frame" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* --- Navigation ---------------------------------------------- */}
      <nav className="pb-nav" aria-label="Primary">
        <Link href="/b" className="pb-wordmark">
          EOS
        </Link>
        <ul className="pb-nav-links">
          <li>
            <Link href="/collections" className="pb-nav-link">
              Collections
            </Link>
          </li>
          <li>
            <Link href="/shop" className="pb-nav-link">
              Shop
            </Link>
          </li>
          <li>
            <Link href="/about" className="pb-nav-link">
              About
            </Link>
          </li>
        </ul>
        <span className="pb-nav-link" aria-live="polite">
          {closed ? "Closed" : `Bag (0)`}
        </span>
      </nav>

      {/* --- Lot spine ------------------------------------------------ */}
      <div className="pb-spine-rail" aria-hidden="true">
        <span className="pb-spine-code">{lot.code}</span>
        <div className="pb-spine-track">
          <div ref={spineFill} className="pb-spine-fill" style={{ inset: 0 }} />
        </div>
      </div>

      {/* --- The story ------------------------------------------------ */}
      <div className="pb-scroll">
        {/* 01 — REVEAL ------------------------------------------------ */}
        <section className="pb-section" aria-label="Reveal">
          <div className="pb-inner">
            {/* No entrance animation and no delay. The first screen is
                readable the instant it paints. */}
            <div className="pb-col">
              <p className="pb-meta">
                {lot.code} — {lot.name}
              </p>
              <p className="pb-lead" style={{ maxWidth: "26ch" }}>
                One garment. Photographed once, lit against nothing, and listed
                until it is gone.
              </p>
            </div>
          </div>
        </section>

        {/* 02 — PRESENCE ---------------------------------------------- */}
        <section className="pb-section" aria-label="Presence">
          <div className="pb-inner">
            <Reveal>
              <p className="pb-numeral">02</p>
            </Reveal>
            <div className="pb-col">
              <Reveal delay={80}>
                <h1 className="pb-statement">
                  Overproduction is fashion&rsquo;s quiet waste{" "}
                  <span className="pb-italic">problem.</span>
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="pb-body">
                  A mill runs the order, then runs a little more. What is left
                  is not defective and not unsold — it simply has nowhere to
                  go. Most of it is destroyed to protect a price.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 03 — INSPECTION -------------------------------------------- */}
        <section className="pb-section" aria-label="Inspection">
          <div className="pb-inner">
            <div className="pb-col pb-col-right">
              <Reveal>
                <div className="pb-marker">
                  <span className="pb-meta">03</span>
                  <span className="pb-meta">Construction</span>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="pb-title">Look closer. It holds up.</h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="pb-body">
                  Drag to turn the piece. What is on screen is this lot, at
                  the quantity that exists &mdash; not a render of a sample we
                  hope to produce.
                </p>
              </Reveal>
              {details.length > 0 ? (
                <>
                  <Reveal delay={240}>
                    <hr className="pb-rule" />
                  </Reveal>
                  <Reveal delay={300}>
                    <ul
                      className="pb-meta"
                      style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.75rem" }}
                    >
                      {details.map(([label, value]) => (
                        <li key={label}>
                          {label} &mdash; {value}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* 04 — PHILOSOPHY -------------------------------------------- */}
        <section className="pb-section" aria-label="Philosophy">
          <div className="pb-inner">
            <Reveal>
              <p className="pb-numeral">04</p>
            </Reveal>
            <div className="pb-col">
              <Reveal delay={80}>
                <h2 className="pb-statement">
                  We treat it as a discovery{" "}
                  <span className="pb-italic">problem.</span>
                </h2>
              </Reveal>
              <Reveal delay={200}>
                <p className="pb-body">
                  The cloth already exists. Nothing here was made to be sold —
                  it was made, and then it needed somewhere to go. EOS buys the
                  lot whole, lists it once, and closes it permanently when it
                  is gone. There is no reorder, because there is nothing to
                  reorder from.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 05 — LOT ---------------------------------------------------- */}
        <section className="pb-section" aria-label="Lot">
          <div className="pb-inner">
            <div className="pb-col">
              <Reveal>
                <div className="pb-marker">
                  <span className="pb-meta">05</span>
                  <span className="pb-meta">The lot</span>
                </div>
              </Reveal>
              <Reveal delay={60}>
                <h2 className="pb-title">{lot.code}</h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="pb-lead">{lot.name}</p>
              </Reveal>

              {/*
                One tick per garment in the original lot. It renders only
                when both numbers are real — a row of marks standing for
                nothing would be the most dishonest object on the page.
              */}
              {lot.total !== null && lot.remaining !== null && (
                <Reveal delay={200}>
                  <ul className="pb-ticks" aria-hidden="true">
                    {Array.from({ length: lot.total }, (_, i) => (
                      <li
                        key={i}
                        className="pb-tick"
                        data-state={i < lot.remaining! ? "remaining" : "taken"}
                      />
                    ))}
                  </ul>
                </Reveal>
              )}

              <Reveal delay={260}>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}
                >
                  <span className="pb-count">
                    {lot.remaining === null
                      ? "—"
                      : String(lot.remaining).padStart(2, "0")}
                  </span>
                  <span className="pb-meta">
                    {closed
                      ? "Lot closed"
                      : lot.remaining === null
                        ? "Available"
                        : "Remaining"}
                  </span>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <p className="pb-body">
                  {closed
                    ? "This piece will not return."
                    : taken === null
                      ? "Listed once, at the size the lot allows. When the last one goes, the lot is struck from the manifest and stays listed, marked closed."
                      : taken === 0
                        ? `All ${lot.total} are still here. When the last one goes, the lot is struck from the manifest and stays listed, marked closed.`
                        : `${taken} of ${lot.total} have gone. When the last one does, the lot is struck from the manifest and stays listed, marked closed.`}
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 06 — PRODUCT ------------------------------------------------ */}
        <section className="pb-section" aria-label="Specification">
          <div className="pb-inner">
            <div className="pb-col pb-col-right">
              <Reveal>
                <div className="pb-marker">
                  <span className="pb-meta">06</span>
                  <span className="pb-meta">Specification</span>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <table className="pb-spec">
                  <tbody>
                    <tr>
                      <th scope="row">Material</th>
                      <td>{lot.composition}</td>
                    </tr>
                    <tr>
                      <th scope="row">Weight</th>
                      <td>{lot.weight}</td>
                    </tr>
                    <tr>
                      <th scope="row">Fit</th>
                      <td>{lot.fit}</td>
                    </tr>
                    <tr>
                      <th scope="row">Construction</th>
                      <td>{lot.construction}</td>
                    </tr>
                    <tr>
                      <th scope="row">Origin</th>
                      <td>{lot.origin}</td>
                    </tr>
                    <tr>
                      <th scope="row">Price</th>
                      <td>{lot.price}</td>
                    </tr>
                  </tbody>
                </table>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 07 — PURCHASE ------------------------------------------------ */}
        <section className="pb-section" aria-label="Purchase">
          <div className="pb-inner">
            <div className="pb-col">
              <Reveal>
                <div className="pb-marker">
                  <span className="pb-meta">07</span>
                  <span className="pb-meta">Take it</span>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h2 className="pb-title">
                  {lot.name}
                  <br />
                  <span className="pb-italic">{lot.price}</span>
                </h2>
              </Reveal>

              <Reveal delay={160}>
                <div style={{ display: "grid", gap: "0.9rem" }}>
                  <span className="pb-meta" id="size-label">
                    Size
                  </span>
                  <ul className="pb-sizes" aria-labelledby="size-label">
                    {SIZES.map((option) => (
                      <li key={option}>
                        <button
                          type="button"
                          className="pb-size"
                          aria-pressed={size === option}
                          onClick={() => setSize(size === option ? null : option)}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={240}>
                <button type="button" className="pb-cta" disabled={closed}>
                  <span>{closed ? "Lot closed" : "Add to bag"}</span>
                  <span aria-hidden="true">→</span>
                </button>
              </Reveal>

              <Reveal delay={300}>
                <p className="pb-meta">
                  Prototype B — commerce is not wired. Shopify supplies price,
                  variants and inventory when it is switched on.
                </p>
              </Reveal>

              <Reveal delay={360}>
                <hr className="pb-rule" />
              </Reveal>

              <Reveal delay={400}>
                <Link href="/" className="pb-cta pb-cta-ghost">
                  <span>Site A</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </Reveal>
            </div>
          </div>
        </section>
      </div>

      {/* --- Drag hint ------------------------------------------------- */}
      <div className={`pb-hint${turned ? " pb-fade-out" : ""}`}>
        <span className="pb-hint-dot" aria-hidden="true" />
        <span className="pb-meta">Drag to turn</span>
      </div>

    </>
  );
}
