"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { capturePixelDebugFlag } from "@/lib/site/analytics";

/**
 * Catches ?pixeldebug=1 before the URL carrying it is replaced.
 *
 * Renders nothing. It exists only to put `analytics.ts` on every page in
 * the browser and give it one chance per navigation to read the flag,
 * which is the one thing the module could not arrange for itself: the
 * pixel component that imports it is a server component, so on most
 * routes the module is evaluated on the server and never shipped.
 *
 * Deliberately not `useSearchParams`, which would be the obvious way to
 * watch the query. It forces every page under this layout into a Suspense
 * boundary and out of static generation — a heavy price for a diagnostic.
 * The flag is read from `window.location` inside the effect instead, where
 * the query is available without subscribing to it.
 *
 * Keyed on the pathname so it re-runs on soft navigation, which is enough:
 * the flag is set by typing an address, and that is a full page load.
 */
export default function PixelDebug() {
  const pathname = usePathname();

  useEffect(() => {
    capturePixelDebugFlag();
  }, [pathname]);

  return null;
}
