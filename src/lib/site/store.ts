/**
 * The physical shop.
 *
 * One definition, imported by everything that names the address — the footer
 * and the returns page today. An address typed in two places is an address
 * that will eventually disagree with itself, and the version a customer acts
 * on is whichever one they happened to read.
 *
 * Taken from the business's own Google listing rather than from memory.
 * Google formats the first line as "Block, 40, E Islam Park St"; it is set
 * out here the way it would be read aloud.
 *
 * `hours` is deliberately absent. The listing showed an 11am open and a 10pm
 * close but not which days those apply to, and opening times that are right
 * five days a week and wrong two are worse than none — the failure lands on
 * a customer standing outside a shut door. Add it once the days are known
 * and both surfaces pick it up.
 */
export const STORE: {
  lines: string[];
  mapsUrl?: string;
  hours?: string;
} = {
  lines: ["40 E Islam Park Street", "Lahore 54000", "Pakistan"],
  mapsUrl: "https://share.google/WQsr4aJdyljyW3lvH",
};

/** Single line, for prose that cannot use the stacked form. */
export const STORE_ONE_LINE = STORE.lines.join(", ");
