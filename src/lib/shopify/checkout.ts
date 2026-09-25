"use server";

import { storefront } from "./client";

/**
 * Handing the bag to Shopify.
 *
 * The bag on this site is a browser-side list — it survives a refresh and
 * nothing more. Shopify has no idea it exists. At the moment someone decides
 * to buy, those lines are turned into a real Shopify cart, and the customer
 * goes to the `checkoutUrl` that comes back.
 *
 * WHY THE CART IS BUILT HERE AND NOT KEPT IN SYNC ALL ALONG.
 *
 * The alternative is to mirror every add and remove to Shopify as it
 * happens, keeping a cart id in storage. That is more machinery and more
 * state to reconcile, and it buys little on a store whose lots are five
 * pieces: what actually matters is that the stock is checked at the moment
 * of purchase, against live inventory, which is exactly what creating the
 * cart here does. Shopify validates every line and says so if a piece has
 * gone in the meantime.
 *
 * This runs on the server. The Storefront token never reaches the browser.
 */

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export type CheckoutLine = {
  /** A Shopify variant GID — the bag already stores these. */
  merchandiseId: string;
  quantity: number;
};

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

type CartCreateResponse = {
  cartCreate: {
    cart: { id: string; checkoutUrl: string; totalQuantity: number } | null;
    userErrors: { field: string[] | null; message: string }[];
  } | null;
};

export async function startCheckout(
  lines: CheckoutLine[],
): Promise<CheckoutResult> {
  const clean = lines.filter(
    (l) =>
      typeof l.merchandiseId === "string" &&
      l.merchandiseId.startsWith("gid://shopify/ProductVariant/") &&
      Number.isInteger(l.quantity) &&
      l.quantity > 0,
  );

  if (clean.length === 0) {
    return { ok: false, error: "Your bag is empty." };
  }

  try {
    const data = await storefront<CartCreateResponse>(
      CART_CREATE,
      { lines: clean },
      { write: true },
    );

    const result = data.cartCreate;

    /**
     * `userErrors` is how Shopify reports a rejected line — a variant that
     * no longer exists, or one that sold out between the bag and the button.
     * It arrives with HTTP 200 and no `errors` array, so it has to be read
     * explicitly or a sold-out lot looks like a successful checkout that
     * quietly goes nowhere.
     */
    if (result?.userErrors?.length) {
      return { ok: false, error: result.userErrors[0].message };
    }

    if (!result?.cart?.checkoutUrl) {
      return { ok: false, error: "Checkout could not be opened. Try again." };
    }

    return { ok: true, url: result.cart.checkoutUrl };
  } catch (error) {
    // The message may carry Storefront internals, so it is logged rather
    // than shown. The visitor gets something they can act on.
    console.error("[eos] checkout failed", error);
    return {
      ok: false,
      error: "We could not reach the store. Please try again in a moment.",
    };
  }
}
