"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartLine } from "@/lib/shopify/types";

const STORAGE_KEY = "eos-cart";

/**
 * Cart state lives outside React in a tiny module-level store, synced to
 * localStorage. useSyncExternalStore is the correct primitive for this:
 * it renders an empty cart on the server and during hydration (matching
 * server markup exactly, no hydration-mismatch warning), then swaps to the
 * real persisted cart immediately after mount.
 */
let cartLines: CartLine[] | null = null;
const listeners = new Set<() => void>();
const EMPTY_CART: CartLine[] = [];

function loadFromStorage(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable (private browsing, quota) — fail silently.
  }
}

function setCartLines(next: CartLine[]) {
  cartLines = next;
  saveToStorage(next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartLine[] {
  if (cartLines === null) {
    cartLines = loadFromStorage();
  }
  return cartLines;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY_CART;
}

type CartContextValue = {
  lines: CartLine[];
  totalQuantity: number;
  subtotal: number;
  currencyCode: string;
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeLine: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  isHydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  // True once the client snapshot (possibly loaded from localStorage) has
  // taken over from the empty server snapshot.
  const isHydrated = lines !== EMPTY_CART || cartLines !== null;

  const addLine = useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      const current = getSnapshot();
      const existing = current.find((l) => l.variantId === line.variantId);
      const next = existing
        ? current.map((l) =>
            l.variantId === line.variantId
              ? { ...l, quantity: l.quantity + quantity }
              : l,
          )
        : [...current, { ...line, quantity }];
      setCartLines(next);
    },
    [],
  );

  const removeLine = useCallback((variantId: string) => {
    setCartLines(getSnapshot().filter((l) => l.variantId !== variantId));
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    const current = getSnapshot();
    const next =
      quantity <= 0
        ? current.filter((l) => l.variantId !== variantId)
        : current.map((l) =>
            l.variantId === variantId ? { ...l, quantity } : l,
          );
    setCartLines(next);
  }, []);

  const clearCart = useCallback(() => setCartLines([]), []);

  const totalQuantity = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.price.amount) * l.quantity, 0),
    [lines],
  );

  const currencyCode = lines[0]?.price.currencyCode ?? "USD";

  const value: CartContextValue = {
    lines,
    totalQuantity,
    subtotal,
    currencyCode,
    addLine,
    removeLine,
    updateQuantity,
    clearCart,
    isHydrated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
