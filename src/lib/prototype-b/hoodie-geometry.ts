import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * A heavyweight hoodie, generated as a lofted cloth surface.
 *
 * Not assembled from primitives. A garment built out of cylinders and
 * spheres reads as a mannequin wearing armour, because the thing that makes
 * cloth legible is not its parts but its *silhouette*: the way a heavy
 * loopback cotton hangs off a shoulder in a straight fall, breaks over the
 * chest, and stacks at a ribbed hem. So the body and sleeves here are
 * surfaces lofted along a spine, with a cross-section that is a superellipse
 * rather than a circle — real garments are flat-ish front and back with
 * soft edges, and a circular section is the single clearest tell of a
 * 3D-modelled "shirt".
 *
 * On top of that sits a displacement field standing in for cloth mechanics:
 * a low-frequency drape that answers to gravity, vertical gravity folds that
 * deepen toward the hem, compression rings where fabric stacks at the cuffs,
 * and a fine wrinkle layer for the raking key light to catch. It is not a
 * simulation — it is a static pose, chosen because a hanging garment at rest
 * is what a campaign still actually shows.
 *
 * Everything is merged into one BufferGeometry so the hero costs one draw
 * call, and swapped wholesale by a real GLB when one exists.
 */

export type HoodieOptions = {
  /** Vertices around each cross-section. */
  around: number;
  /** Cross-sections along each lofted spine. */
  along: number;
};

/* ------------------------------------------------------------------ */
/* Noise                                                              */
/* ------------------------------------------------------------------ */

/** Deterministic hash — the garment must be identical on every load. */
function hash2(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** Value noise on a wrapped grid, so the seam around the body matches. */
function wrappedNoise(u: number, v: number, freqU: number, freqV: number) {
  const x = u * freqU;
  const y = v * freqV;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);

  // Wrap the u axis so column 0 and column freqU are the same sample.
  const wrap = (i: number) => ((i % freqU) + freqU) % freqU;

  const a = hash2(wrap(xi), yi);
  const b = hash2(wrap(xi + 1), yi);
  const c = hash2(wrap(xi), yi + 1);
  const d = hash2(wrap(xi + 1), yi + 1);

  return (
    a * (1 - xf) * (1 - yf) + b * xf * (1 - yf) + c * (1 - xf) * yf + d * xf * yf
  );
}

/**
 * Three octaves of the above.
 *
 * A single octave at a low frequency terraces: the interpolation between
 * grid cells is visible as horizontal steps, and on a body-shaped surface
 * that reads unmistakably as a thrown clay pot rather than cloth. Summing
 * octaves at halving amplitude breaks the cell boundaries up and gives the
 * detail-within-detail that fabric actually has.
 */
function fbm(u: number, v: number, freqU: number, freqV: number) {
  let sum = 0;
  let amplitude = 1;
  let total = 0;
  for (let octave = 0; octave < 3; octave += 1) {
    const scale = 2 ** octave;
    sum += wrappedNoise(u, v, freqU * scale, freqV * scale) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
  }
  return sum / total;
}

/* ------------------------------------------------------------------ */
/* Cross-sections                                                     */
/* ------------------------------------------------------------------ */

/**
 * Superellipse. `n` near 2 gives an ellipse; higher flattens the faces and
 * squares the corners, which is what a garment section actually looks like.
 */
function superellipse(angle: number, halfWidth: number, halfDepth: number, n: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * halfWidth;
  const z = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * halfDepth;
  return { x, z };
}

type Station = {
  /** Height of this cross-section, in metres from the floor. */
  y: number;
  halfWidth: number;
  halfDepth: number;
  /** Superellipse exponent — how flat the front and back panels read. */
  flat: number;
  /** Forward offset, so the body can lean or the hem can swing. */
  z: number;
};

function lerpStation(a: Station, b: Station, t: number): Station {
  return {
    y: a.y + (b.y - a.y) * t,
    halfWidth: a.halfWidth + (b.halfWidth - a.halfWidth) * t,
    halfDepth: a.halfDepth + (b.halfDepth - a.halfDepth) * t,
    flat: a.flat + (b.flat - a.flat) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/** Catmull-style sampling of a station list at normalised position t. */
function sampleStations(stations: Station[], t: number): Station {
  const clamped = Math.min(0.9999, Math.max(0, t));
  const scaled = clamped * (stations.length - 1);
  const i = Math.floor(scaled);
  return lerpStation(stations[i], stations[i + 1], smooth(scaled - i));
}

/*
 * Body stations, hem (t=0) to shoulder (t=1).
 *
 * The proportions are a boxy, dropped-shoulder cut: the hem is drawn IN by
 * the rib, the body above it is wide and straight, and the chest barely
 * tapers. Heavy cotton does not follow a torso, and giving it a waist is
 * what makes a rendered hoodie look like a t-shirt on a figure.
 */
const BODY_STATIONS: Station[] = [
  { y: 0.0, halfWidth: 0.262, halfDepth: 0.106, flat: 3.3, z: 0.0 }, // rib, drawn in
  { y: 0.045, halfWidth: 0.258, halfDepth: 0.104, flat: 3.3, z: 0.0 },
  { y: 0.09, halfWidth: 0.282, halfDepth: 0.118, flat: 3.2, z: 0.004 }, // release above rib
  { y: 0.2, halfWidth: 0.294, halfDepth: 0.124, flat: 3.2, z: 0.006 },
  { y: 0.34, halfWidth: 0.3, halfDepth: 0.128, flat: 3.1, z: 0.004 },
  { y: 0.48, halfWidth: 0.302, halfDepth: 0.13, flat: 3.1, z: 0.0 }, // chest
  { y: 0.6, halfWidth: 0.298, halfDepth: 0.127, flat: 3.2, z: -0.004 },
  { y: 0.69, halfWidth: 0.279, halfDepth: 0.119, flat: 3.3, z: -0.008 }, // shoulder shelf
  { y: 0.735, halfWidth: 0.23, halfDepth: 0.104, flat: 3.4, z: -0.01 },
  { y: 0.762, halfWidth: 0.164, halfDepth: 0.086, flat: 3.0, z: -0.012 }, // neck opening
];

/**
 * Sleeve stations, cuff (t=0) to armhole (t=1).
 *
 * Length is the whole game here: these run 0 to 0.47m, which against a body
 * whose shoulder sits at 0.762 puts the cuff at roughly hip height. Authored
 * any longer and the arms reach past the hem and out of frame — a garment
 * with the proportions of a scarecrow.
 */
const SLEEVE_STATIONS: Station[] = [
  { y: 0.0, halfWidth: 0.056, halfDepth: 0.046, flat: 2.6, z: 0 }, // cuff rib
  { y: 0.035, halfWidth: 0.055, halfDepth: 0.045, flat: 2.6, z: 0 },
  { y: 0.08, halfWidth: 0.071, halfDepth: 0.058, flat: 2.5, z: 0 }, // release
  { y: 0.2, halfWidth: 0.079, halfDepth: 0.065, flat: 2.5, z: 0 },
  { y: 0.34, halfWidth: 0.089, halfDepth: 0.073, flat: 2.5, z: 0 },
  { y: 0.46, halfWidth: 0.102, halfDepth: 0.084, flat: 2.6, z: 0 },
  { y: 0.56, halfWidth: 0.118, halfDepth: 0.098, flat: 2.7, z: 0 }, // armhole
];

/* ------------------------------------------------------------------ */
/* Displacement                                                       */
/* ------------------------------------------------------------------ */

/** Shortest distance between two positions on a wrapped 0–1 axis. */
function wrapDist(a: number, b: number) {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

/**
 * A flatlock seam, as a height profile against distance from its centre.
 *
 * Seams are the strongest single cue that a rendered surface is a *garment*
 * rather than a shape. Real clothing is panels joined together, and the join
 * is a raised welt with a line of topstitching running either side of it —
 * a hard, straight, man-made edge crossing all that soft drape. Without one
 * anywhere on the piece the eye has nothing to read as construction, and
 * settles on "moulded object" instead.
 */
function seam(dist: number) {
  /*
   * Widths are set by what the mesh can actually resolve, not by what a real
   * seam measures. A flatlock welt is ~6mm, which at this tessellation is
   * narrower than a single quad — so it fell between vertices and rendered
   * as nothing but aliasing. These are deliberately wider than life: a seam
   * you can see is worth more here than a seam that is dimensionally honest
   * and invisible. A real GLB, with topology built around its seams, does
   * not have this constraint.
   */
  const ridge = Math.exp(-(dist * dist) / (2 * 0.011 * 0.011));
  // Peaks either side of the ridge, because `dist` is unsigned.
  const stitch = Math.exp(-Math.pow(dist - 0.026, 2) / (2 * 0.006 * 0.006));
  return {
    height: ridge * 0.0022 + stitch * 0.0011,
    // The groove alongside the welt sits in its own shadow.
    shade: 1 - 0.2 * Math.exp(-Math.pow(dist - 0.018, 2) / (2 * 0.009 * 0.009)),
  };
}

/**
 * @param u around the section, 0–1
 * @param v along the spine, 0 at hem/cuff
 * @param ribUntil v below which the piece is ribbed knit
 */
function bodyDisplacement(u: number, v: number, ribUntil: number) {
  // Side seams run the full height at the left and right extremes of the
  // section — u = 0 is +x, u = 0.5 is -x.
  const sideSeam = seam(Math.min(wrapDist(u, 0), wrapDist(u, 0.5)));
  // Where the rib is joined to the body panel.
  const ribSeam = seam(Math.abs(v - ribUntil) * 0.55);

  // Rib: a tight vertical corrugation, and the only high-frequency element
  // deliberately left un-softened — rib knit is meant to read as mechanical.
  if (v < ribUntil) {
    const fade = smooth(1 - v / ribUntil);
    return (
      Math.cos(u * Math.PI * 2 * 34) * 0.0042 * fade +
      sideSeam.height +
      ribSeam.height
    );
  }

  // Gravity folds: vertical channels that deepen toward the hem, where the
  // weight of the cloth has gathered. These vary strongly around the body
  // and only slowly down it, because that is the direction cloth actually
  // folds when it is hanging — a fold that varies fast vertically is a
  // horizontal crease, and a body covered in those reads as a bellows.
  const gravity = smooth(Math.min(1, (1 - v) * 1.5));
  const folds =
    Math.sin(u * Math.PI * 2 * 7 + fbm(u, v, 7, 1.5) * 2.6) * 0.0145 * gravity;

  // Drape: broad undulation, again mostly around rather than down.
  const drape = (fbm(u, v, 4, 1.2) - 0.5) * 0.016;

  /*
   * Tension folds.
   *
   * The one thing uniform noise cannot produce. Cloth hanging off a shoulder
   * is under tension between the two points carrying it, and that pulls a set
   * of shallow diagonal creases across the chest and back, fanning down and
   * inward from each armhole. They are what tells you the garment is
   * suspended from somewhere rather than inflated from within.
   */
  const fromShoulder = smooth(Math.min(1, Math.max(0, (v - 0.28) / 0.42)));
  const diagonal =
    Math.sin((u * Math.PI * 2 * 4 - v * 5.5) + fbm(u, v, 3, 1) * 1.6) *
    0.0072 *
    fromShoulder;

  // Chest break: heavy cotton buckles just below the shoulder shelf.
  const chest =
    Math.exp(-Math.pow((v - 0.66) / 0.09, 2)) *
    Math.sin(u * Math.PI * 2 * 3 + 1.1) *
    0.008;

  // Fine wrinkles for the key light to rake across.
  const wrinkle = (fbm(u, v, 14, 9) - 0.5) * 0.0045;

  return (
    folds + drape + diagonal + chest + wrinkle + sideSeam.height + ribSeam.height
  );
}

/** Seam shading for the body, kept separate so the loft can bake it in. */
function bodySeamShade(u: number, v: number, ribUntil: number) {
  return (
    seam(Math.min(wrapDist(u, 0), wrapDist(u, 0.5))).shade *
    seam(Math.abs(v - ribUntil) * 0.55).shade
  );
}

function sleeveDisplacement(u: number, v: number) {
  // The cuff join, and the armhole ring where the sleeve meets the body.
  const cuffSeam = seam(Math.abs(v - 0.055) * 0.5);
  const armSeam = seam(Math.abs(v - 0.93) * 0.42);

  if (v < 0.055) {
    const fade = smooth(1 - v / 0.055);
    return (
      Math.cos(u * Math.PI * 2 * 22) * 0.0034 * fade +
      cuffSeam.height +
      armSeam.height
    );
  }

  // Sleeves crush into concertina rings above the cuff, where the arm is
  // shorter than the tube of fabric covering it.
  // Kept shallow. Pushed harder these rings corrugate the whole sleeve into
  // something closer to a bellows than a crushed cuff.
  const stack =
    Math.sin(v * Math.PI * 2 * 4.5) * 0.0032 * smooth(Math.min(1, (1 - v) * 2.4));
  const drape = (fbm(u, v, 5, 1.6) - 0.5) * 0.0115;
  const wrinkle = (fbm(u, v, 12, 8) - 0.5) * 0.004;

  return stack + drape + wrinkle + cuffSeam.height + armSeam.height;
}

function sleeveSeamShade(u: number, v: number) {
  return seam(Math.abs(v - 0.055) * 0.5).shade * seam(Math.abs(v - 0.93) * 0.42).shade;
}

/* ------------------------------------------------------------------ */
/* Lofting                                                            */
/* ------------------------------------------------------------------ */

type LoftOptions = {
  stations: Station[];
  around: number;
  along: number;
  displace: (u: number, v: number) => number;
  /** Extra darkening at (u, v), multiplied into the baked occlusion. */
  shade?: (u: number, v: number) => number;
  /** Applied to every generated vertex, for placing sleeves in space. */
  transform?: THREE.Matrix4;
  /** Close the top with a fan, e.g. the rounded end of a sleeve. */
  capTop?: boolean;
};

/**
 * Ambient occlusion, baked per vertex from the shape of the fold field.
 *
 * There is no global illumination in this scene — one key, one fill, one
 * rim — so the inside of a crease receives exactly as much light as the
 * ridge beside it. That is the difference between cloth that looks creased
 * and cloth that looks like it has creases *printed* on it, and it is why
 * the piece read as ceramic: real fabric is darker at the bottom of every
 * fold, because most directions from down there are blocked by the fold.
 *
 * Approximated by local concavity: sample the displacement around the point
 * and compare it to the point itself. Sitting lower than your neighbours
 * means you are in a valley, and valleys are dark.
 */
function bakeOcclusion(
  displace: (u: number, v: number) => number,
  u: number,
  v: number,
) {
  /*
   * The sample radius has to be several quads wide.
   *
   * At 96 segments around the body one quad spans ~0.010 in u, so sampling
   * at 0.012 compared each vertex to its immediate neighbour — which
   * measures the fine wrinkle layer rather than the fold structure, and
   * darkens more or less everything. Occlusion is a property of the broad
   * shape, so it has to be sampled at the scale of the broad shape.
   */
  const e = 0.055;
  const here = displace(u, v);
  const neighbours =
    displace((u + e) % 1, v) +
    displace((u - e + 1) % 1, v) +
    displace(u, Math.min(1, v + e)) +
    displace(u, Math.max(0, v - e));
  const concavity = neighbours / 4 - here;
  // Positive concavity means a valley. Scaled against the ~1cm amplitude of
  // the fold field, and clamped so a deep crease darkens but never blacks out.
  return 1 - Math.min(0.3, Math.max(0, concavity * 26));
}

function loft({
  stations,
  around,
  along,
  displace,
  shade,
  transform,
  capTop = false,
}: LoftOptions): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= along; j += 1) {
    const v = j / along;
    const station = sampleStations(stations, v);

    for (let i = 0; i <= around; i += 1) {
      const u = i / around;
      const angle = u * Math.PI * 2;
      const base = superellipse(angle, station.halfWidth, station.halfDepth, station.flat);

      // Push along the outward direction in the section plane. Close enough
      // to the true surface normal for a displacement this shallow, and it
      // keeps the section from self-intersecting at the flats.
      const len = Math.hypot(base.x, base.z) || 1;
      const d = displace(u, v);

      positions.push(
        base.x + (base.x / len) * d,
        station.y,
        base.z + station.z + (base.z / len) * d,
      );
      uvs.push(u, v);

      // Occlusion, plus a gentle gradient down the piece: less light reaches
      // the hem than the shoulder on any garment lit from above.
      const height = 0.86 + 0.14 * smooth(v);
      const value = bakeOcclusion(displace, u, v) * height * (shade ? shade(u, v) : 1);
      colors.push(value, value, value);
    }
  }

  const stride = around + 1;
  for (let j = 0; j < along; j += 1) {
    for (let i = 0; i < around; i += 1) {
      const a = j * stride + i;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  if (capTop) {
    const top = sampleStations(stations, 1);
    const centre = positions.length / 3;
    positions.push(0, top.y, top.z);
    uvs.push(0.5, 1);
    colors.push(1, 1, 1);
    const ring = along * stride;
    for (let i = 0; i < around; i += 1) {
      indices.push(centre, ring + i, ring + i + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  if (transform) geometry.applyMatrix4(transform);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A rolled edge swept around a cross-section — the turned hem of the cloth.
 *
 * Every open edge on a lofted garment terminates in nothing: the surface
 * simply stops, and at the hem or a cuff that infinitely thin edge is one of
 * the loudest tells that you are looking at a shell rather than a material.
 * Real fabric has a few millimetres of thickness and is folded back on
 * itself and stitched. This sweeps a small tube around the section so the
 * edge has a lip that catches the key light.
 */
function rolledEdge(
  stations: Station[],
  at: number,
  around: number,
  tube: number,
  displace: (u: number, v: number) => number,
  transform?: THREE.Matrix4,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const segments = 8;
  const station = sampleStations(stations, at);

  for (let i = 0; i <= around; i += 1) {
    const u = i / around;
    const angle = u * Math.PI * 2;
    const base = superellipse(angle, station.halfWidth, station.halfDepth, station.flat);
    const len = Math.hypot(base.x, base.z) || 1;
    const nx = base.x / len;
    const nz = base.z / len;
    const d = displace(u, at);

    for (let k = 0; k <= segments; k += 1) {
      const phi = (k / segments) * Math.PI * 2;
      const radial = Math.cos(phi) * tube;
      const axial = Math.sin(phi) * tube;
      positions.push(
        base.x + nx * (d + radial),
        station.y + axial,
        base.z + station.z + nz * (d + radial),
      );
      uvs.push(u * 6, k / segments);
      // Underside of the roll is in its own shadow.
      const value = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(phi));
      colors.push(value, value, value);
    }
  }

  const stride = segments + 1;
  for (let i = 0; i < around; i += 1) {
    for (let k = 0; k < segments; k += 1) {
      const a = i * stride + k;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  if (transform) geometry.applyMatrix4(transform);
  geometry.computeVertexNormals();
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Hood                                                               */
/* ------------------------------------------------------------------ */

/**
 * The hood, as a shell sitting behind and above the neck opening.
 *
 * A worn-down hood is not a sphere — it is a folded pouch that collapses
 * back onto the shoulders under its own weight. This builds it as a lofted
 * form on an arc spine that leans back, with an opening at the front and a
 * rolled edge around it.
 */
function buildHood(around: number, along: number): THREE.BufferGeometry[] {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const NECK_Y = 0.762;
  // Arc from the front of the neck, up and back over, ending at the nape.
  const arcStart = -0.5;
  const arcEnd = Math.PI * 1.05;

  for (let j = 0; j <= along; j += 1) {
    const v = j / along;
    const theta = arcStart + (arcEnd - arcStart) * v;

    // Spine of the hood.
    //
    // Squat and thrown backwards, not tall: a hood that is *down* has
    // collapsed under its own weight into a roll lying across the
    // shoulderblades. Give it height and it stands up into a stiff funnel —
    // the shape a hood only makes when someone is wearing it up. So the
    // vertical reach is small and most of the mass goes back in z.
    const spineY = NECK_Y + Math.sin(theta) * 0.115;
    const spineZ = -0.075 - Math.cos(theta) * 0.2;

    // Section swells at the crown and closes toward the nape. Wider than it
    // is deep, because it has flattened against the back.
    const swell = Math.sin(Math.min(Math.PI, v * Math.PI * 1.06));
    const halfWidth = 0.142 + swell * 0.085;
    const halfDepth = 0.05 + swell * 0.042;

    for (let i = 0; i <= around; i += 1) {
      const u = i / around;
      const angle = u * Math.PI * 2;
      const base = superellipse(angle, halfWidth, halfDepth, 2.5);

      const fold =
        (fbm(u, v, 5, 1.8) - 0.5) * 0.0125 +
        Math.sin(u * Math.PI * 2 * 5 + v * 3.0) * 0.006 * smooth(v);

      const len = Math.hypot(base.x, base.z) || 1;

      positions.push(
        base.x + (base.x / len) * fold,
        spineY + base.z * 0.42,
        spineZ + base.z + (base.z / len) * fold,
      );
      uvs.push(u, v);

      // The hood's centre-back seam, plus deep occlusion inside the pouch —
      // the one genuinely enclosed volume on the garment.
      const centreSeam = seam(wrapDist(u, 0.5)).shade;
      const inside = 0.58 + 0.42 * smooth(Math.min(1, Math.abs(u - 0.5) * 2.6));
      const value = centreSeam * inside * (0.82 + 0.18 * smooth(1 - v));
      colors.push(value, value, value);
    }
  }

  const stride = around + 1;
  for (let j = 0; j < along; j += 1) {
    for (let i = 0; i < around; i += 1) {
      const a = j * stride + i;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const shell = new THREE.BufferGeometry();
  shell.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  shell.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  shell.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  shell.setIndex(indices);
  shell.computeVertexNormals();

  /*
   * The hood's opening edge.
   *
   * A torus is the wrong primitive for this and it showed: it is a perfect
   * circle where the hood's opening is an oval that has collapsed, so it sat
   * proud of the shell as a detached ring rather than reading as the hood's
   * own turned edge. Scaled down and tucked in, it now does the one job it
   * needs to do — give the opening a lip for the rim light to find.
   */
  const roll = tint(
    new THREE.TorusGeometry(0.122, 0.015, 8, Math.max(24, around >> 1)),
    0.86,
  );
  roll.scale(1.16, 0.72, 1.0);
  roll.rotateX(Math.PI / 2 - 0.5);
  roll.translate(0, NECK_Y + 0.012, 0.012);

  return [shell, roll];
}

/* ------------------------------------------------------------------ */
/* Assembly                                                           */
/* ------------------------------------------------------------------ */

/**
 * Where a sleeve sits, shared by the sleeve surface and its rolled cuff so
 * the two cannot drift apart.
 */
function sleeveTransform(side: 1 | -1) {
  return new THREE.Matrix4()
    .makeRotationZ(side * 0.15)
    .premultiply(new THREE.Matrix4().makeTranslation(side * 0.29, 0.14, 0.006));
}

function buildSleeve(side: 1 | -1, around: number, along: number) {
  /*
   * Dropped shoulder, hanging.
   *
   * The rotation sign matters more than its size. Turned the other way the
   * armhole swings *outboard* of the body and the wide end of the sleeve
   * juts into open air at shoulder height — which renders as a stubby wing
   * rather than an arm. It has to go the other way: the armhole tucks inside
   * the body silhouette, where it merges with the shoulder shelf, and the
   * narrow cuff is the end that sits proudest, just outside the body's edge.
   */
  // Placed so the open armhole end lands at y≈0.70 — up inside the body's
  // shoulder shelf, where it is swallowed by the torso surface. Left short
  // of that, the raw rim of the tube is visible in silhouette and the sleeve
  // reads as a fin stuck on the side rather than an arm coming out of one.
  return loft({
    stations: SLEEVE_STATIONS,
    around,
    along,
    displace: sleeveDisplacement,
    shade: sleeveSeamShade,
    transform: sleeveTransform(side),
    capTop: false,
  });
}

/**
 * The kangaroo pocket: a shallow patch lifted off the front panel, with its
 * own slight sag. Modelled rather than textured because its top edge is a
 * real shadow line across the body, and that line is most of what says
 * "hoodie" in silhouette.
 */
function buildPocket(around: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const cols = Math.max(24, around >> 2);
  const rows = 18;
  const yTop = 0.36;
  const yBottom = 0.115;

  for (let j = 0; j <= rows; j += 1) {
    const v = j / rows;
    const y = yTop + (yBottom - yTop) * v;
    const station = sampleStations(BODY_STATIONS, (y - BODY_STATIONS[0].y) / 0.762);

    // Spans the front face only, narrowing toward the bottom.
    // Wraps ~100 degrees of the front panel. Wider than this and it stops
    // reading as a pocket applied to a face and starts reading as a second
    // skin over the whole body.
    const spread = 0.56 - v * 0.04;

    for (let i = 0; i <= cols; i += 1) {
      const u = i / cols;
      const angle = (-spread / 2 + spread * u) * Math.PI;
      const base = superellipse(angle + Math.PI / 2, station.halfWidth, station.halfDepth, station.flat);

      // Stand off the body, sagging in the middle where a pocket carries its
      // own weight, and pinching back to the panel at both side seams.
      const edge = Math.sin(u * Math.PI);
      const lift = 0.004 + edge * (0.008 + Math.sin(v * Math.PI) * 0.006);
      const len = Math.hypot(base.x, base.z) || 1;

      positions.push(
        base.x + (base.x / len) * lift,
        y + Math.sin(u * Math.PI) * v * 0.006,
        base.z + station.z + (base.z / len) * lift,
      );
      uvs.push(u, v);

      // Topstitched opening at the top edge, and the shadow the pocket casts
      // back onto the body where it lifts away from it.
      const opening = seam(Math.abs(v) * 0.42).shade;
      const contact = 0.74 + 0.26 * Math.sin(u * Math.PI);
      const value = opening * contact;
      colors.push(value, value, value);
    }
  }

  const stride = cols + 1;
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const a = j * stride + i;
      const b = a + stride;
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Gives a primitive a flat vertex colour.
 *
 * mergeGeometries requires every input to carry the same attributes, so the
 * torus and tube parts need a colour channel even though nothing varies
 * across them.
 */
function tint(geometry: THREE.BufferGeometry, value: number) {
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3).fill(value);
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/** Two drawcords hanging from the hood opening. */
function buildCords(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.052, 0.775, 0.108),
      new THREE.Vector3(side * 0.061, 0.712, 0.132),
      new THREE.Vector3(side * 0.056, 0.646, 0.141),
      new THREE.Vector3(side * 0.064, 0.596, 0.134),
    ]);
    out.push(tint(new THREE.TubeGeometry(curve, 22, 0.0055, 7, false), 0.92));

    // Aglet at the tip.
    const tip = new THREE.CylinderGeometry(0.0068, 0.0058, 0.019, 8);
    tip.translate(side * 0.064, 0.588, 0.134);
    out.push(tint(tip, 0.7));
  }
  return out;
}

let cache: { key: string; geometry: THREE.BufferGeometry } | null = null;

/**
 * Builds the garment, or returns the cached one.
 *
 * Generation runs into the tens of thousands of vertices with noise sampled
 * per vertex, which is a visible hitch if it happens during the opening
 * animation — so it is built once and shared.
 */
export function hoodieGeometry({ around, along }: HoodieOptions): THREE.BufferGeometry {
  const key = `${around}x${along}`;
  if (cache && cache.key === key) return cache.geometry;

  const bodyDisplace = (u: number, v: number) => bodyDisplacement(u, v, 0.11);
  const sleeveAround = Math.max(28, around >> 1);
  const sleeveAlong = Math.max(28, along >> 1);

  const parts: THREE.BufferGeometry[] = [
    loft({
      stations: BODY_STATIONS,
      around,
      along,
      displace: bodyDisplace,
      shade: (u, v) => bodySeamShade(u, v, 0.11),
    }),
    // Turned hem, and a turned edge on each cuff.
    rolledEdge(BODY_STATIONS, 0.002, around, 0.0055, bodyDisplace),
    buildSleeve(1, sleeveAround, sleeveAlong),
    buildSleeve(-1, sleeveAround, sleeveAlong),
    rolledEdge(
      SLEEVE_STATIONS, 0.002, sleeveAround, 0.0045, sleeveDisplacement,
      sleeveTransform(1),
    ),
    rolledEdge(
      SLEEVE_STATIONS, 0.002, sleeveAround, 0.0045, sleeveDisplacement,
      sleeveTransform(-1),
    ),
    ...buildHood(Math.max(36, around >> 1), Math.max(30, along >> 1)),
    buildPocket(around),
    ...buildCords(),
  ];

  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error("Failed to merge hoodie geometry");

  // Centre on the origin horizontally, and sit the hem at y = 0, so the
  // scene can position the garment without knowing how it was built.
  merged.computeBoundingBox();
  const box = merged.boundingBox!;
  merged.translate(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);

  merged.computeVertexNormals();
  merged.computeBoundingSphere();

  cache = { key, geometry: merged };
  return merged;
}

/** Height of the garment in metres, for framing the camera. */
export function hoodieHeight(geometry: THREE.BufferGeometry): number {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  return box ? box.max.y - box.min.y : 0.8;
}
