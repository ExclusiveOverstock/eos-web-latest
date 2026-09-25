import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { STORE } from "@/lib/site/store";

export const metadata: Metadata = {
  title: "Returns & Exchanges",
  description:
    "Fourteen days to return or exchange an EOS piece. What qualifies, how to start one, and what happens when a lot has already closed.",
};

/**
 * Returns and exchanges.
 *
 * EVERY NUMBER ON THIS PAGE IS A COMMITMENT. The terms below are the ones
 * the business stated — fourteen days, exchange or return — expressed once
 * here so nobody has to hunt through the prose to change them. Edit these
 * and the page follows.
 *
 * Three values were not specified and are marked. They are the ones a
 * customer will ask about the moment something goes wrong, so they should be
 * settled deliberately rather than inherited from a default:
 *
 *   RETURN_POSTAGE  who pays to send a piece back
 *   REFUND_METHOD   how money goes back to a COD customer
 *   CONTACT         where a return is actually started
 *
 * The page is otherwise written to be true of this business rather than
 * generic. In particular it says plainly what happens when an exchange is
 * impossible, which on a store selling one-off surplus lots is not an edge
 * case but the normal outcome for a sold-out size.
 */
const POLICY = {
  /** Days from delivery, not from order. */
  windowDays: 14,
  /** Who covers postage on a change-of-mind return. CONFIRM THIS. */
  returnPostage: "the customer",
  /** How a refund reaches a Cash on Delivery customer. CONFIRM THIS. */
  refundMethod: "bank transfer",
  /**
   * Where a return is started.
   *
   * The shop's phone, not an Instagram DM. A DM is a poor record if a return
   * is ever disputed, and it is not a channel everyone buying by Cash on
   * Delivery uses. The number comes from the shared store module so it
   * cannot drift from the one in the footer.
   */
  contactLabel: STORE.phone ?? "Instagram",
  contactHref: STORE.phoneHref ?? "https://www.instagram.com/exclusive_overstock/",
} as const;

const STEPS = [
  {
    n: "01",
    title: `${POLICY.windowDays} days from delivery`,
    body: `You have ${POLICY.windowDays} days from the day a piece arrives to return or exchange it. The clock starts at delivery, not at order, so a slow courier never costs you part of the window.`,
  },
  {
    n: "02",
    title: "Unworn, with tags",
    body: "The piece has to come back as it left — unworn, unwashed, tags attached, in the packaging it arrived in. We resell what comes back, so anything we cannot list again we cannot accept.",
  },
  {
    n: "03",
    title: "Exchange, or your money back",
    body: `Tell us which you want. An exchange goes out as soon as the original reaches us. A refund is issued by ${POLICY.refundMethod} once the piece has been checked.`,
  },
  {
    n: "04",
    title: "Or bring it to the shop",
    body: "The same fourteen days and the same condition apply, but nothing has to be posted. Bring the piece and your order confirmation to the counter and it is settled while you wait — no return postage, no courier, no waiting for it to arrive with us before an exchange goes out.",
  },
  {
    n: "05",
    title: "When the lot has closed",
    body: "Lots are small and they do not come back. If you ask to exchange for a size that has since sold out, there is nothing to send you — so we refund instead. This is the one place our model shows: we would rather return your money than promise a piece that no longer exists.",
  },
] as const;

const TERMS = [
  ["Window", `${POLICY.windowDays} days from delivery`],
  ["Condition", "Unworn, unwashed, tags attached"],
  ["Return postage", `Paid by ${POLICY.returnPostage} — none if you come in`],
  ["In person", "Any day the shop is open, settled on the spot"],
  ["Faulty pieces", "Return postage on us, refunded or replaced in full"],
  ["Refunds", `By ${POLICY.refundMethod}, within 7 days of the piece arriving`],
] as const;

export default function ReturnsPage() {
  return (
    <article>
      {/* --- Statement -------------------------------------------- */}
      <section className="px-6 pt-24 sm:px-10 sm:pt-36">
        <div className="mx-auto max-w-[1600px]">
          <Reveal>
            <p className="eos-meta-sm text-taupe">Service</p>
            <h1 className="eos-display mt-6 max-w-[20ch] text-[2.2rem] text-bone sm:text-[3.6rem]">
              Fourteen days to change your mind.
            </h1>
            <p className="eos-body mt-8 max-w-xl text-base">
              Buying a piece you have only seen photographed is a small act of
              trust. This page is the part of that arrangement we are
              responsible for.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- How it works ----------------------------------------- */}
      <section className="px-6 py-20 sm:px-10 sm:py-32">
        <div className="mx-auto max-w-[1600px]">
          <div className="border-t border-hairline">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.05}>
                <div className="grid gap-5 border-b border-hairline py-10 sm:grid-cols-[6rem_1fr] sm:gap-12 sm:py-12">
                  <p className="eos-meta-sm text-hairline-strong">{step.n}</p>
                  <div>
                    <h2 className="eos-display-sm max-w-[27ch] text-[1.4rem] text-bone sm:text-[1.9rem]">
                      {step.title}
                    </h2>
                    <p className="eos-body mt-5 max-w-[62ch]">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- The terms, as a manifest ----------------------------- */}
      <section className="px-6 pb-24 sm:px-10 sm:pb-36">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
            <Reveal>
              <p className="eos-meta-sm text-taupe">The terms</p>
              <p className="eos-display mt-6 max-w-[18ch] text-[1.6rem] text-bone sm:text-[2.4rem]">
                Stated once, in full.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              {/*
                The same specification table the product pages use. A returns
                policy set in the site's metadata voice rather than in legal
                prose reads as something the brand stands behind rather than
                something its lawyers wrote.
              */}
              <dl className="border-t border-hairline">
                {TERMS.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-hairline py-5"
                  >
                    <dt className="eos-meta-sm text-taupe">{label}</dt>
                    <dd className="eos-meta-sm text-right text-bone">{value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --- Starting one ----------------------------------------- */}
      <section className="border-t border-hairline px-6 py-20 sm:px-10 sm:py-28">
        <div className="mx-auto max-w-[1600px]">
          <Reveal>
            <p className="eos-meta-sm text-taupe">Starting a return</p>
          </Reveal>

          {/*
            Two routes, given equal weight rather than one buried under the
            other. Coming in is genuinely the better option — it costs the
            customer no postage and settles the same day — so it is not
            relegated to a footnote under the message-us button.
          */}
          <div className="mt-10 grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col justify-between gap-8 bg-void p-8 sm:p-10">
                <div>
                  <p className="eos-meta-sm text-hairline-strong">By post</p>
                  <p className="eos-display-sm mt-4 max-w-[26ch] text-[1.3rem] text-bone sm:text-[1.6rem]">
                    Call us with your order number and we will tell you where
                    to send it.
                  </p>
                </div>
                {/* A tel: link, so it dials on a phone and copies on a desktop. */}
                <a href={POLICY.contactHref} className="eos-btn eos-btn-quiet self-start">
                  {POLICY.contactLabel}
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="flex h-full flex-col justify-between gap-8 bg-void p-8 sm:p-10">
                <div>
                  <p className="eos-meta-sm text-hairline-strong">In person</p>
                  <p className="eos-display-sm mt-4 max-w-[26ch] text-[1.3rem] text-bone sm:text-[1.6rem]">
                    Bring it to the shop and we will settle it at the counter.
                  </p>
                  <address className="eos-meta-sm mt-6 not-italic text-taupe">
                    {STORE.lines.map((line) => (
                      <span key={line} className="block leading-relaxed">
                        {line}
                      </span>
                    ))}
                  </address>
                  {STORE.hours ? (
                    <p className="eos-meta-sm mt-3 text-hairline-strong">
                      {STORE.hours}
                    </p>
                  ) : null}
                </div>
                {STORE.mapsUrl ? (
                  <a
                    href={STORE.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eos-btn eos-btn-primary self-start"
                  >
                    Directions
                  </a>
                ) : null}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.16}>
            <Link href="/shop" className="eos-btn eos-btn-quiet mt-10">
              Back to the Manifest
            </Link>
          </Reveal>
        </div>
      </section>
    </article>
  );
}
