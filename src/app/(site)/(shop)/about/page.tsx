import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import banner from "@/assets/editorial/the-model.png";
import Reveal from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "The Model",
  description:
    "How EOS acquires surplus lots from mills and ateliers, lists them once, and closes them for good.",
};

/**
 * About.
 *
 * The one page allowed to explain itself, and even here it stays short and
 * factual. The brief's instruction not to look like a sustainability website
 * is really an instruction about tone: the argument for buying what already
 * exists is stronger stated as arithmetic than as virtue, so this page
 * states the arithmetic and stops.
 */

const STEPS = [
  {
    n: "01",
    title: "A mill produces more than the order",
    body: "Minimums, yield allowances and cancelled orders all leave finished goods behind. Fabric is knitted or woven to a quantity, not to a promise, and the surplus is real inventory sitting in a warehouse — already made, already paid for in materials and labour and water.",
  },
  {
    n: "02",
    title: "We buy the lot whole",
    body: "Not a selection from it. The whole lot, at the size it happens to be, which is why an EOS lot is six pieces or fourteen rather than a round number. Buying selectively would leave the awkward sizes behind, and the awkward sizes are the reason the lot was stranded.",
  },
  {
    n: "03",
    title: "It is listed once",
    body: "At the quantity that exists. There is no reorder, because there is nothing to reorder from — the production run is finished and the mill has moved on. Every count on this site is a physical count of garments in a room.",
  },
  {
    n: "04",
    title: "Then it closes",
    body: "A lot that sells out is marked closed and stays listed. We do not remove it, and we do not source a replacement to fill the gap. That is the whole promise, and it is a small one, which is why we can keep it.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/*
        The campaign frame.

        The photograph is bright — a near-white studio wall and a saturated
        orange panel — which is the opposite of everything else on this site.
        Dropping a flat black tint over it would only produce grey. So it is
        treated in three passes: desaturated and darkened by filter to pull
        the orange back toward the palette, then covered by a horizontal
        gradient that is solid void on the left and thin on the right, then
        grained to match the rest of the site.

        The horizontal gradient is doing the art direction. The image is shot
        with the group on the right and an empty wall on the left, so the
        copy sits over near-solid black while the figures stay legible in the
        part of the frame that carries no text. Nothing is fighting anything.
      */}
      <section className="relative isolate overflow-hidden">
        <Image
          src={banner}
          alt=""
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          /*
            object-right keeps the group in frame as the viewport narrows —
            with object-center a phone crops to the empty wall and the
            section becomes a dark rectangle.
          */
          className="object-cover object-right"
        />

        {/*
          The scrim changes axis with the viewport, because the copy does.

          On a wide screen the type sits in the left third, so the gradient
          runs left-to-right and the figures keep the right. On a phone the
          copy spans the full width over the bottom, so a horizontal gradient
          would leave half the sentence sitting on the bright part of the
          photograph. There it runs top-to-bottom instead.
        */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-void/30 via-void/75 to-void sm:bg-gradient-to-r sm:from-void sm:via-void/86 sm:to-void/28"
        />
        {/* Top and bottom, so the frame joins the page rather than sitting in it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-void/60 via-transparent to-void"
        />
        <div aria-hidden="true" className="eos-grain absolute inset-0" />

        <div className="relative mx-auto flex min-h-[70vh] max-w-[1600px] flex-col justify-end px-6 py-20 sm:px-10 sm:py-28 lg:min-h-[78vh]">
          <p className="eos-meta-sm text-taupe">The Model</p>
          <h1 className="eos-display mt-6 max-w-[24ch] text-[2.2rem] text-bone sm:text-[4rem]">
            Nothing here was made for you.
          </h1>
          <p className="eos-body mt-8 max-w-xl text-base">
            Every piece EOS sells already existed before you arrived. That is
            not a limitation of the model — it is the model. We do not
            commission production. We find the production that already
            happened and had nowhere to go.
          </p>
        </div>
      </section>

      <section className="border-t border-hairline px-6 py-20 sm:px-10 sm:py-32">
        <div className="mx-auto max-w-[1600px]">
          <ol>
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.06}>
                <li className="grid gap-6 border-b border-hairline py-12 sm:py-16 lg:grid-cols-[6rem_1fr_1.2fr] lg:gap-16">
                  <span className="eos-meta-sm text-hairline-strong">
                    {step.n}
                  </span>
                  <h2 className="eos-display-sm max-w-[27ch] text-[1.4rem] text-bone sm:text-[1.9rem]">
                    {step.title}
                  </h2>
                  <p className="eos-body max-w-[62ch]">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 py-24 sm:px-10 sm:py-36">
        <div className="mx-auto max-w-[1600px]">
          <Reveal>
            <p className="eos-display max-w-[27ch] text-[1.8rem] text-bone sm:text-[3rem]">
              The most sustainable garment is the one that was already made and
              never worn.
            </p>
            <p className="eos-body mt-8 max-w-lg">
              We are not going to build an argument any larger than that, and
              we are not going to put a leaf on it. Buy the piece because it is
              good and because there are six of them.
            </p>
            <Link href="/shop" className="eos-btn eos-btn-primary mt-10">
              Open the Manifest
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
