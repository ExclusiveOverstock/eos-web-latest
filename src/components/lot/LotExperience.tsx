"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import GarmentMount from "@/components/three/garment/GarmentMount";
import { LOT_SEQUENCE } from "@/components/three/garment/garment-config";
import AddToBag from "@/components/ui/AddToBag";
import LotStatus from "@/components/ui/LotStatus";
import { ImmersiveChrome } from "@/lib/chrome/ChromeContext";
import { formatMoney, pad2 } from "@/lib/shopify/format";
import type { Product } from "@/lib/shopify/types";

/**
 * PROTOTYPE B — the lot experience.
 *
 * The premise being tested: that a single garment, presented properly, can
 * carry the whole experience — and that if it can, a walkable virtual store
 * is answering a question nobody asked.
 *
 * So this is not a 3D product viewer with copy beside it. The garment is on
 * screen for the entire scroll and never stops being the subject; the camera
 * moves through seven framings, and each framing has exactly one thing to
 * say, arriving while the camera is already looking at the part of the piece
 * it describes. Construction is discussed at the shoulder. Material is
 * discussed with the cloth filling the frame. The price appears once, near
 * the end, after there is a reason to care what it is.
 *
 * The information is the same information the product page carries. What
 * changes is the order it arrives in and what you are looking at when it
 * does.
 */

export default function LotExperience({ product }: { product: Product }) {
  const track = useRef<HTMLDivElement>(null);
  const calm = useReducedMotion() ?? false;

  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });

  const beats = buildBeats(product);

  if (calm) return <StaticLot product={product} beats={beats} />;

  return (
    <div
      ref={track}
      // One viewport-height of scroll per beat. Less and the camera moves
      // faster than the eye can follow a garment; more and the piece hangs
      // motionless while people wonder if it has stopped working.
      style={{ height: `${LOT_SEQUENCE.length * 100}vh` }}
      className="relative"
    >
      <ImmersiveChrome />

      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-void">
        <GarmentMount
          handle={product.handle}
          assetSrc={product.garmentAsset}
          sequence={LOT_SEQUENCE}
          progress={scrollYProgress}
          entrance
          loadingLabel={`Preparing Lot ${product.lotCode.replace(/^EOS-/, "")}`}
          className="absolute inset-0 h-full w-full"
        />

        <div className="eos-vignette eos-grain pointer-events-none absolute inset-0" />

        <ProgressRail progress={scrollYProgress} />

        {/*
          Copy sits in a fixed column on the right at desktop width and along
          the bottom on a phone — in both cases clear of the garment, which
          the camera keeps roughly centred.
        */}
        <div className="pointer-events-none absolute inset-0 flex items-end px-6 pb-12 sm:px-10 lg:items-center lg:justify-end lg:pb-0 lg:pr-16">
          <div className="relative w-full lg:h-[26rem] lg:w-[26rem]">
            {beats.map((beat, i) => (
              <Beat key={beat.id} progress={scrollYProgress} index={i} total={beats.length}>
                {beat.content}
              </Beat>
            ))}
          </div>
        </div>

        <Link
          href={`/products/${product.handle}`}
          className="eos-meta-sm absolute bottom-6 left-6 z-20 text-taupe transition-colors duration-300 hover:text-bone sm:left-10"
        >
          ← Full Details
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Beats                                                               */
/* ------------------------------------------------------------------ */

type BeatContent = { id: string; content: ReactNode };

function buildBeats(product: Product): BeatContent[] {
  const spec = (label: string) =>
    product.specs.find((s) => s.label.toLowerCase() === label.toLowerCase())?.value;

  return [
    {
      id: "reveal",
      content: (
        <>
          <p className="eos-meta-sm text-taupe">{product.lotCode}</p>
          <h1 className="eos-display mt-5 text-[2rem] text-bone sm:text-[2.8rem]">
            {product.title}
          </h1>
        </>
      ),
    },
    {
      id: "presence",
      content: (
        <>
          <p className="eos-meta-sm text-taupe">Presence</p>
          <p className="eos-display-sm mt-5 text-[1.4rem] text-bone sm:text-[1.8rem]">
            Cut {spec("Fit")?.toLowerCase() ?? "to hang"}, and heavy enough to
            hold its own shape on the hanger.
          </p>
        </>
      ),
    },
    {
      id: "inspection",
      content: (
        <>
          <p className="eos-meta-sm text-taupe">Construction</p>
          <dl className="mt-5 border-t border-hairline">
            {product.specs.slice(0, 3).map((s) => (
              <div
                key={s.label}
                className="flex items-baseline justify-between gap-6 border-b border-hairline py-3.5"
              >
                <dt className="eos-meta-sm text-taupe">{s.label}</dt>
                <dd className="eos-meta-sm text-right text-bone">{s.value}</dd>
              </div>
            ))}
          </dl>
        </>
      ),
    },
    {
      id: "material",
      content: (
        <>
          <p className="eos-meta-sm text-taupe">Material</p>
          <p className="eos-display mt-5 text-[2.2rem] text-bone sm:text-[3rem]">
            {spec("Weight") ?? spec("Gauge") ?? spec("Composition")}
          </p>
          <p className="eos-body mt-5">
            {spec("Composition")}
            {spec("Origin") ? ` — milled in ${spec("Origin")}.` : "."}
          </p>
        </>
      ),
    },
    {
      id: "story",
      content: (
        <>
          <p className="eos-meta-sm text-taupe">The Lot</p>
          <p className="eos-body mt-5 text-[15px]">{product.description}</p>
        </>
      ),
    },
    {
      id: "lot",
      content: (
        <>
          <p className="eos-meta-sm text-taupe">Remaining</p>
          <div className="mt-5">
            <LotStatus
              status={product.status}
              quantity={product.quantityRemaining}
              size="lg"
            />
          </div>
          {product.status === "OPEN" && (
            <p className="eos-body mt-6">
              When these are gone the lot closes. There is no second run —
              the cloth this was cut from no longer exists.
            </p>
          )}
        </>
      ),
    },
    {
      id: "purchase",
      content: (
        <>
          <div className="flex items-baseline justify-between gap-6">
            <p className="eos-display-sm text-[1.3rem] text-bone">
              {product.title}
            </p>
            <p className="eos-meta text-bone">
              {formatMoney(product.priceRange.min)}
            </p>
          </div>
          <div className="mt-7">
            <AddToBag product={product} layout="inline" />
          </div>
        </>
      ),
    },
  ];
}

/**
 * One cross-faded panel.
 *
 * A component rather than an inline map so `useTransform` is called once per
 * mounted beat, and so the faded-out panels can be marked `inert` — a
 * screen reader or a Tab key running through seven invisible copies of the
 * product's information would make the experience unusable for anyone not
 * looking at it.
 */
function Beat({
  progress,
  index,
  total,
  children,
}: {
  progress: MotionValue<number>;
  index: number;
  total: number;
  children: ReactNode;
}) {
  const step = 1 / (total - 1);
  const centre = index * step;
  const first = index === 0;
  const last = index === total - 1;

  /**
   * Ranges are clamped into [0, 1], and the end beats get three stops
   * instead of four.
   *
   * Framer drives these off a native scroll timeline, which means the input
   * range becomes WAAPI keyframe offsets — and WAAPI rejects an offset below
   * 0 or above 1 outright. The naive symmetric window puts the first beat's
   * fade-in at a negative offset and the last beat's fade-out past 1, which
   * throws during commit and takes the whole route down with it. The end
   * beats do not need those halves anyway: the first is already on screen
   * when the experience starts, and the last has nothing to hand over to.
   */
  const opacityStops = first
    ? [0, centre + step * 0.16, centre + step * 0.5]
    : last
      ? [centre - step * 0.5, centre - step * 0.16, 1]
      : [
          centre - step * 0.5,
          centre - step * 0.16,
          centre + step * 0.16,
          centre + step * 0.5,
        ];
  const opacityValues = first ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0];

  const yStops = first
    ? [0, centre + step * 0.5]
    : last
      ? [centre - step * 0.5, 1]
      : [centre - step * 0.5, centre, centre + step * 0.5];
  const yValues = first ? [0, -26] : last ? [26, 0] : [26, 0, -26];

  const opacity = useTransform(progress, opacityStops, opacityValues);
  const y = useTransform(progress, yStops, yValues);

  const [active, setActive] = useState(index === 0);
  useMotionValueEvent(opacity, "change", (value) => {
    const next = value > 0.6;
    setActive((current) => (current === next ? current : next));
  });

  return (
    <motion.div
      style={{ opacity, y }}
      inert={!active}
      className={`w-full lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-1/2 ${
        active ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {children}
    </motion.div>
  );
}

/**
 * The chapter rail.
 *
 * Doubles as navigation: each mark scrolls to its beat, which gives the
 * experience a keyboard and screen-reader route through it that does not
 * depend on being able to scroll precisely.
 */
function ProgressRail({ progress }: { progress: MotionValue<number> }) {
  const [index, setIndex] = useState(0);

  useMotionValueEvent(progress, "change", (value) => {
    const next = Math.round(value * (LOT_SEQUENCE.length - 1));
    setIndex((current) => (current === next ? current : next));
  });

  function goTo(i: number) {
    const step = window.innerHeight;
    window.scrollTo({ top: i * step, behavior: "smooth" });
  }

  return (
    <nav
      aria-label="Lot experience chapters"
      className="absolute left-6 top-1/2 z-20 hidden -translate-y-1/2 lg:block"
    >
      <ol className="flex flex-col gap-4">
        {LOT_SEQUENCE.map((state, i) => (
          <li key={state.id}>
            <button
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === index ? "step" : undefined}
              className="group flex items-center gap-3"
            >
              <span
                aria-hidden="true"
                className={`h-px transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  i === index ? "w-7 bg-oxblood" : "w-3.5 bg-hairline-strong group-hover:w-5"
                }`}
              />
              <span
                className={`eos-meta-sm transition-colors duration-500 ${
                  i === index ? "text-bone" : "text-hairline-strong group-hover:text-taupe"
                }`}
              >
                {pad2(i + 1)} {state.label}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Reduced motion                                                      */
/* ------------------------------------------------------------------ */

/**
 * The same seven beats, stacked and still.
 *
 * The garment is present and can still be turned by hand; what is removed is
 * the scroll-driven camera, which is the part that causes trouble. Nothing
 * is withheld — every beat's content is here, in order, simply legible all
 * at once.
 */
function StaticLot({ product, beats }: { product: Product; beats: BeatContent[] }) {
  return (
    <div>
      <div className="relative h-[70dvh] w-full overflow-hidden bg-void">
        <GarmentMount
          handle={product.handle}
          assetSrc={product.garmentAsset}
          sequence={[LOT_SEQUENCE[1]]}
          loadingLabel={`Preparing Lot ${product.lotCode.replace(/^EOS-/, "")}`}
          className="absolute inset-0 h-full w-full"
        />
        <div className="eos-vignette pointer-events-none absolute inset-0" />
      </div>

      <div className="mx-auto max-w-[720px] px-6 py-20 sm:px-10">
        {beats.map((beat) => (
          <section key={beat.id} className="border-b border-hairline py-12 last:border-0">
            {beat.content}
          </section>
        ))}

        <Link
          href={`/products/${product.handle}`}
          className="eos-meta-sm text-taupe transition-colors duration-300 hover:text-bone"
        >
          ← Full Details
        </Link>
      </div>
    </div>
  );
}
