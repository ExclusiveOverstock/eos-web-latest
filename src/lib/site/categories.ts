/**
 * Category groups — a parent collection with collections beneath it.
 *
 * Kids is the first of these. It is a real Shopify collection in its own
 * right (everything for kids) with two narrower collections inside it, and
 * all three are ordinary collections fetched the ordinary way. Nothing here
 * holds products; it holds handles, and the pages fetch from Shopify.
 *
 * Defined once because two surfaces need to agree about it: the header's
 * dropdown and the tab row on the collection page. If they came from
 * separate lists, one would eventually gain a category the other lacked.
 *
 * ──────────────────────────────────────────────────────────────────────
 *  TO ADD A SUBCATEGORY: create the collection in Shopify, then add a line
 *  to `children` below with its handle and the label to show. Routing,
 *  fetching, the dropdown and the tabs all follow automatically.
 * ──────────────────────────────────────────────────────────────────────
 */
export type CategoryGroup = {
  /** The parent collection's handle in Shopify. */
  handle: string;
  label: string;
  children: { handle: string; label: string }[];
};

/*
  Empty on purpose.

  Kids was set up here with Tops and Bottoms beneath it and then taken back
  out: the collections had no products in them, so the navigation was
  advertising three empty rooms. The machinery is left standing because the
  intent has not changed, only the timing — when there is stock to show,
  restoring it is the block below rather than a rebuild.

    {
      handle: "kids",
      label: "Kids",
      children: [
        // The parent repeats itself as "All Kids" on purpose: without it
        // there is no way back to the whole collection once a visitor has
        // narrowed to Tops, and the tab row has no state representing "no
        // filter" — which is the state the page opens in.
        { handle: "kids", label: "All Kids" },
        { handle: "kids-tops", label: "Tops" },
        { handle: "kids-bottoms", label: "Bottoms" },
      ],
    },
*/
export const CATEGORY_GROUPS: CategoryGroup[] = [];

/**
 * Collections that exist but are not listed.
 *
 * Hidden, not deleted. The pages stay routable, so a link already shared or
 * indexed still works and nothing 404s; they simply stop appearing in the
 * index. That is the reversible version of removing a collection, and the
 * right one while the collections are empty rather than retired.
 *
 * ──────────────────────────────────────────────────────────────────────
 *  TO LIST A COLLECTION AGAIN: delete its handle from this list.
 *  TO HIDE ONE: add its handle, exactly as it appears in its URL.
 * ──────────────────────────────────────────────────────────────────────
 */
export const HIDDEN_COLLECTIONS: string[] = ["kids-tops", "kids-bottoms"];

/** Whether a collection should appear in the collections index. */
export function collectionIsListed(handle: string): boolean {
  return !HIDDEN_COLLECTIONS.includes(handle);
}

/**
 * The group a collection handle belongs to, parent or child.
 *
 * Used by the collection page to decide whether to show a tab row: landing
 * on kids-tops should offer the siblings, not just the one collection being
 * viewed.
 */
export function groupForHandle(handle: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find(
    (group) =>
      group.handle === handle ||
      group.children.some((child) => child.handle === handle),
  );
}
