import type { Metadata } from "next";
import CollectionIndex from "@/components/ui/CollectionIndex";

export const metadata: Metadata = {
  title: "Collections",
};

export default function CollectionsPage() {
  return (
    <section className="px-6 py-16 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-[1600px]">
        <p className="eos-meta-sm text-taupe">Collections</p>
        <h1 className="eos-display mt-6 max-w-[21ch] text-[2.2rem] text-bone sm:text-[3.6rem]">
          Lots, grouped by where they came from.
        </h1>
        <p className="eos-body mt-8 max-w-lg">
          A collection is not a season. It is a group of lots that share a
          material or a maker — which is the only grouping that means anything
          when nothing is produced twice.
        </p>

        <div className="mt-16">
          <CollectionIndex />
        </div>
      </div>
    </section>
  );
}
