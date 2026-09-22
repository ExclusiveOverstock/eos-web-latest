# Making changes without a developer

Written for someone who does not write code. Each entry says exactly where to
go and what to change. You do not need to understand React to do any of these.

**Two rules before you start:**

1. **Save a restore point first.** In a terminal, in the project folder:
   `git add -A` then `git commit -m "before my change"`. If anything breaks,
   `git checkout .` puts everything back exactly as it was.
2. **After any code edit, run `npm run build`.** If it prints
   `✓ Compiled successfully`, you have not broken anything structural. If it
   prints errors, run `git checkout .` and try again.

---

## Things that need NO code at all

This is most of what changes on a shop, and it was built this way on purpose.

| What | Where |
|---|---|
| Add or remove a product | Shopify admin |
| Change a price | Shopify admin |
| Change stock, or close a lot | Shopify admin — selling out closes it automatically |
| Add or replace product photos | Shopify admin |
| Reorder product photos | Shopify admin — the first image is the one the grid shows |
| Product titles and descriptions | Shopify admin |
| Create a collection | Shopify admin |

The site reads all of this live. **You change it in Shopify and the site
follows within about a minute.** Nothing to edit, nothing to redeploy.

> The one thing worth knowing: the shop grid shows each product's **first**
> image, and it works best with a **landscape** photo of the whole garment.
> If a product looks wrong in the grid, drag a landscape shot to position 1.

---

## Swapping the media

No code — just replace the file, keeping the **exact same filename**.

| What | File to overwrite |
|---|---|
| Homepage hero film | `public/video/hero.mp4` |
| "The Model" photo on the homepage | `src/assets/editorial/the-model-campaign.webp` |
| Campaign photo on the About page | `src/assets/editorial/the-model.png` |

For the video: keep it MP4, keep it short, and keep it under about 5 MB or
phones will wait on a black screen. For images, a wide (landscape) photo works
best in both places.

---

## One-line text changes

Open the file in any text editor (Notepad works; VS Code is nicer). Change
only what is **between the quote marks**. Leave the quote marks, semicolons
and everything else alone.

### Instagram handle
`src/components/layout/Footer.tsx`, near the top:

```ts
const INSTAGRAM_HANDLE = "exclusive_overstock";
```

### Physical store address
Same file, just below. It currently reads `= null`, which is why no address
shows. Replace the whole line with, for example:

```ts
const STORE: { lines: string[]; mapsUrl?: string; hours?: string } | null = {
  lines: ["12 Example Road", "Lahore", "Pakistan"],
  hours: "Mon–Sat, 12–8",
  mapsUrl: "https://maps.app.goo.gl/xxxxx",
};
```

`hours` and `mapsUrl` are optional — delete either line if you do not have it.
The "Visit" block appears in the footer automatically once this is filled in.

### The main homepage statement
`src/components/home/HeroVideo.tsx`'s sibling,
`src/components/home/HeroExperience.tsx`:

```ts
const STATEMENT = "Overproduction is fashion's quiet waste problem.";
```

### Other homepage copy
`src/app/(site)/page.tsx`. The headline "A mill produces more than the
order..." and the four numbered blocks (Acquisition, Listing, Closure,
Provenance) are all plain sentences in that file. Search for the words you
want to change.

### About page copy
`src/app/(site)/(shop)/about/page.tsx`. Same idea.

---

## Colours

`src/app/globals.css`, near the top, in the `@theme` block:

```css
--color-void: #0a0909;      /* the black everything sits on */
--color-bone: #f1e9dc;      /* the off-white text */
--color-oxblood: #641f2a;   /* the accent */
```

**One warning that matters.** Oxblood on void measures about 1.5:1 contrast —
far below readable. It is used as a *fill* (button backgrounds) and as a
*mark* (thin rules), never as text colour. If you change these, do not make
oxblood a text colour, and keep bone bright enough to read on black.

---

## Publishing your change

If the site is deployed on Vercel and connected to GitHub:

```
git add -A
git commit -m "describe what you changed"
git push
```

Vercel rebuilds and the change is live in a couple of minutes.

If something goes wrong after publishing, Vercel keeps every previous
deployment — open the project, find the last good one, and click **Promote to
Production**. That is an instant rollback and it does not require touching
code at all.

---

## If you get stuck

Paste the **whole file** you are editing into any AI assistant, say what you
want changed, and ask for the **whole file back** — then replace the original
with what it gives you. Do not accept instructions like "add this after line
84"; whole files are much harder to get wrong.

Read `HANDOVER.md` first, or give it to the assistant, so it knows what this
project is and which rules not to break.
