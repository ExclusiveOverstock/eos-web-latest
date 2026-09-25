# EOS — project handover

Read this first. It is written for a person or an AI assistant picking this
project up with no prior context, and it is deliberately short enough to paste
into a chat window in one go.

---

## What EOS is

EOS sells **limited lots of clothing that already exists**. It does not
commission production. It buys leftover stock — cloth, cut pieces or finished
garments a maker produced beyond its own order — and lists it once, at the
size the lot allows.

Three consequences drive every decision in this codebase:

1. **Stock counts must be real.** Scarcity is the entire proposition, so a
   stale "04 remaining" is the worst thing that can appear on the page.
   Counts derive from live Shopify inventory. Nobody types them anywhere.
2. **A lot that sells out never returns.** When stock runs out, the next
   purchase is *different* leftover stock, not more of the same piece. So
   "listed once, never made again" is literally true and the closing language
   throughout the site is honest.
3. **Nothing synthesised may stand in for a real garment.** The site's whole
   argument is that these clothes physically exist. See "Removed", below.

**Tone:** cinematic, editorial, restrained. A serious fashion brand first.

---

## Stack

| | |
|---|---|
| Framework | Next.js **16.3** (App Router, Turbopack) |
| React | 19.2 |
| Styling | Tailwind **v4** (`@theme` in `globals.css`, not a JS config) |
| Commerce | Shopify **Storefront API** (headless) |
| 3D | three.js — only for Prototype A's boutique |

> **Next 16 is not the Next.js most training data knows.** APIs and
> conventions differ. `AGENTS.md` says to read `node_modules/next/dist/docs/`
> before writing code. That advice is real — `revalidateTag` alone changed
> signature.

---

## Layout of the code

```
src/
  app/
    layout.tsx              document shell, nothing else
    not-found.tsx           unmatched URLs (outside the site layout — see fonts)
    global-error.tsx        root-layout failure; production only
    (site)/                 the storefront: fonts, chrome, providers
      layout.tsx
      error.tsx             route errors (assume Shopify is down)
      not-found.tsx         notFound() from inside the storefront
      page.tsx              homepage
      (shop)/               shop, collections, products, cart, about
      (experience)/         virtual-store (Prototype A)
    api/revalidate/         Shopify webhook → revalidateTag
  components/
    home/HeroVideo.tsx      the hero film
    ui/ProductGallery.tsx   product page slideshow
    ui/ProductCard.tsx      grid card
    three/                  Prototype A boutique only
  lib/
    shopify/                client, queries, map, catalog, config, image-loader
    design/fonts.ts         typefaces (shared — see gotcha below)
```

Route groups (`(site)`, `(shop)`) do **not** appear in URLs.

---

## Shopify

Source of truth for products, prices, variants, inventory and photography.

**Environment** (`.env.local`, gitignored — set these in Vercel too):

```
EOS_CATALOG_SOURCE=shopify          # without this it silently serves fixtures
SHOPIFY_STOREFRONT_ENDPOINT=...     # /api/2026-07/graphql.json
SHOPIFY_STOREFRONT_TOKEN=...        # public Storefront token
EOS_METAFIELD_NAMESPACE=eos
SHOPIFY_REVALIDATE_SECRET=...       # webhook HMAC; route 503s without it
```

If `EOS_CATALOG_SOURCE` is unset the build **succeeds** and serves eleven
invented placeholder products. A working site with the wrong catalogue is easy
to miss — check this first if the products look unfamiliar.

**Current store:** 50 products; collections `hoodies`, `trousers`.

**Optional metafields** (namespace `eos`, all absent today, all degrade
gracefully): `lot_code`, `lot_size`, `specs` (JSON), `garment_asset`.
Because `lot_size` is unset, "x of y taken" never renders — only the
remaining count.

---

## Five things that will bite you

**1. Oxblood is never text.** `#641F2A` on `#0A0909` measures ~1.5:1. It is a
surface or a mark — a rule, a button fill — never body copy. There is a
load-bearing comment about this at the top of `globals.css`.

**2. Font tokens reference source variables, not `:root` aliases.** CSS custom
properties inherit their *computed* value, so an alias defined at `:root`
pointing at a variable declared lower down resolves to nothing everywhere.
`.eos-display` uses `var(--font-bebas)` directly and must keep doing so.
Fonts live in `lib/design/fonts.ts` because the root-level error and 404 pages
render outside `(site)/layout.tsx` and would otherwise arrive in Times.

**3. GraphQL returns `data` AND `errors` together.** A Storefront token
without the inventory scope returns every product correctly *plus* an "Access
denied" error per variant. An earlier client threw on any error and turned 20
good products into a 500. `client.ts` now only throws when there is no data.

**4. Next's image optimizer times out on the originals.** Shopify serves
6000×4000 files (~10 MB). Resizing one server-side exceeded the 7s budget and
returned 500, so product heroes rendered as broken images while their own
128px thumbnails loaded fine. `lib/shopify/image-loader.ts` hands resizing to
Shopify's CDN instead. It is applied per-`<Image>`, not globally, because
local imports must keep the default optimizer.

**5. Line endings.** Windows checkout, Linux build. `.gitattributes` pins LF.
This project has already been bitten by CRLF once.

---

## Removed, deliberately

All procedurally generated garments are gone. They rendered approximations of
real products, which contradicts the brand's only claim.

- Homepage hero → real film (`HeroVideo`)
- Product pages → real photography (`ProductGallery`); previously rendered
  **zero images** and a CG stand-in
- `/lot/[handle]` "lot experience" → deleted with its whole garment stack
- Prototype B (`/b`) → deleted entirely

**Prototype A survives** at `/virtual-store` — a walkable 3D boutique. It is
intentionally **unlinked**; the footer lists it as "The Boutique — Coming
Soon" with no href. Do not delete or redesign it.

---

## State

**Working:** homepage film + scroll beats · shop grid (4-up from 640px) ·
collections · product pages with slideshow · live inventory counts and lot
closure · cart (localStorage) · about · 404 and error pages · reduced-motion
paths · revalidate webhook route.

**Not built:**

- **Checkout.** The blocker. The button renders `Checkout — Not Yet
  Connected`, disabled. Needs the Shopify Cart API: create a cart, store
  `cartId`, redirect to `checkoutUrl`.
- Shipping / Returns / Sizing pages — all three footer links point at `/about`.
- `sitemap.ts`, `robots.ts`, OG images.
- Not deployed. No GitHub remote, no Vercel, no domain.

**Waiting on the owner:** physical store address (the `STORE` constant in
`Footer.tsx` is `null` and renders nothing until set) · rewriting the Shopify
product descriptions, which currently read as unedited AI output and contain
the literal word "(suggested)" · rotating the Storefront token.

---

## Deploying

1. Push to GitHub.
2. Import at vercel.com/new — Next.js is auto-detected, repo root is the
   project root.
3. **Add the environment variables before deploying** (see above).
4. Point the domain at **Vercel, not Shopify.** Shopify's "connect your
   domain" flow attaches it to the Online Store channel — the theme — which
   would serve a Shopify theme instead of this app.
5. Add a Shopify webhook: `inventory_levels/update` →
   `https://<domain>/api/revalidate`, with `SHOPIFY_REVALIDATE_SECRET` set to
   match. Without it, counts fall back to a 60-second revalidate.

---

## Working on it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # always run before committing
npx tsc --noEmit
```

The codebase is heavily commented, and the comments explain *why* rather than
*what*. If something looks odd, the reason is usually written directly above
it. Read that before changing it — several of those decisions are load-bearing
and were arrived at by fixing a real bug.
