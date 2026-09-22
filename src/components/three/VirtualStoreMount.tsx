"use client";

import dynamic from "next/dynamic";

/**
 * Client-side mount point for the boutique.
 *
 * The dynamic import lives here rather than in the route's page because
 * `ssr: false` is only permitted inside a Client Component — Next errors out
 * if a Server Component asks for it. Keeping this wrapper as thin as possible
 * preserves the point of the split: WebGL has no server-side representation,
 * and the entire Three.js/R3F bundle stays out of every other route's JS
 * payload, fetched only when someone actually opens the virtual store.
 */
const VirtualStoreExperience = dynamic(() => import("./VirtualStoreExperience"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100dvh-64px)] w-full items-center justify-center bg-void sm:h-[calc(100dvh-80px)]">
      <p className="eos-meta text-taupe">
        Preparing the Boutique
      </p>
    </div>
  ),
});

export default function VirtualStoreMount() {
  return <VirtualStoreExperience />;
}
