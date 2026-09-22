import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * A heavyweight hooded garment, hanging, built procedurally.
 *
 * This is the placeholder that stands in until real EOS GLBs exist, and the
 * bar it has to clear is that nobody should be able to tell it is one. A
 * capsule, a plane or an untextured T-shirt primitive would announce
 * "developer placeholder" in the first frame of the homepage, which is the
 * one frame that has to sell the brand.
 *
 * So the whole form is a single lofted surface rather than an assembly of
 * primitives. Cloth has no hard joins: the sleeve grows out of the shoulder,
 * the ribbing is the same fabric pulled tighter, the pocket is the same panel
 * standing proud. Everything here is therefore expressed as a modulation of
 * one radius function — folds, ribbing and the kangaroo pocket are all just
 * terms added to the radius at a given height and angle — and the seams that
 * would give a primitive assembly away never exist in the first place.
 *
 * Proportions are a real 480gsm boxy hoodie: short in the body, wide through
 * the chest, dropped shoulder, sleeves that hang past where a wearer's hands
 * would be. The hood is up and empty, which is the point — a hooded form with
 * nobody in it is the image the hero is built around.
 *
 * Units are metres. The garment is returned centred on the origin so cameras
 * and rigs can treat (0,0,0) as its heart.
 */

/* ------------------------------------------------------------------ */
/* Deterministic noise                                                 */
/* ------------------------------------------------------------------ */

/**
 * Folds have to be irregular or the garment reads as a machined part, but
 * they also have to be identical on every load — a hero that drapes
 * differently each refresh cannot be art-directed. Hash noise gives both.
 */
function hash(i: number, seed: number): number {
  const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function noise1(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash(i, seed);
  const b = hash(i + 1, seed);
  return (a + (b - a) * u) * 2 - 1;
}

/* ------------------------------------------------------------------ */
/* Profile sampling                                                    */
/* ------------------------------------------------------------------ */

type Key = readonly [t: number, value: number];

/**
 * Piecewise smoothstep through control points. Linear interpolation leaves
 * a visible crease at every key — on a matte surface under a hard key light
 * those creases are the first thing the eye finds.
 */
function sample(keys: readonly Key[], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  const last = keys[keys.length - 1];
  if (t >= last[0]) return last[1];

  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * f * f * (3 - 2 * f);
    }
  }
  return last[1];
}

/** Smooth 0→1 window, used to fade local features in and out. */
function band(x: number, start: number, end: number, feather: number): number {
  const a = THREE.MathUtils.smoothstep(x, start - feather, start + feather);
  const b = 1 - THREE.MathUtils.smoothstep(x, end - feather, end + feather);
  return a * b;
}

/* ------------------------------------------------------------------ */
/* Surface builders                                                    */
/* ------------------------------------------------------------------ */

type Frame = { p: THREE.Vector3; right: THREE.Vector3; up: THREE.Vector3 };

/**
 * Parallel-transport-ish frames along a curve.
 *
 * Three's own computeFrenetFrames rolls the cross-section wherever the
 * curve's curvature flips, which puts a visible twist in a sleeve. Deriving
 * the frame from a fixed reference axis instead keeps the section's "up"
 * pointing up for the whole sweep — with a fallback reference for the near
 * vertical stretches, where the primary one degenerates.
 */
function frameAt(curve: THREE.Curve<THREE.Vector3>, t: number): Frame {
  const p = curve.getPointAt(t);
  const tangent = curve.getTangentAt(t).normalize();
  const ref =
    Math.abs(tangent.y) > 0.94
      ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(ref, tangent).normalize();
  const up = new THREE.Vector3().crossVectors(tangent, right).normalize();
  return { p, right, up };
}

type SweepSpec = {
  rings: number;
  segments: number;
  /** Half-width across the frame's "right" axis. */
  rx: (t: number) => number;
  /** Half-width across the frame's "up" axis. */
  ry: (t: number) => number;
  /** Additive radius modulation — folds, ribbing, raised panels. */
  detail?: (t: number, theta: number) => number;
  capStart?: boolean;
  capEnd?: boolean;
};

/** Sweeps a closed elliptical section along a curve. */
function sweep(curve: THREE.Curve<THREE.Vector3>, spec: SweepSpec): THREE.BufferGeometry {
  const { rings, segments } = spec;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= rings; i++) {
    const t = i / rings;
    const { p, right, up } = frameAt(curve, t);
    const rx = spec.rx(t);
    const ry = spec.ry(t);

    for (let j = 0; j <= segments; j++) {
      const theta = (j / segments) * Math.PI * 2;
      const d = spec.detail ? spec.detail(t, theta) : 0;
      const cx = (rx + d) * Math.cos(theta);
      const cy = (ry + d) * Math.sin(theta);
      positions.push(
        p.x + right.x * cx + up.x * cy,
        p.y + right.y * cx + up.y * cy,
        p.z + right.z * cx + up.z * cy,
      );
      uvs.push(j / segments, t);
    }
  }

  const stride = segments + 1;
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * stride + j;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  // Caps are flat fans to a centre vertex. They are almost never seen — a
  // cuff points at the floor, the hood's crown points away from camera — so
  // paying for a domed cap would be paying for nothing.
  const cap = (t: number, flip: boolean) => {
    const p = curve.getPointAt(t);
    const centre = positions.length / 3;
    positions.push(p.x, p.y, p.z);
    uvs.push(0.5, t);
    const ringStart = t === 0 ? 0 : rings * stride;
    for (let j = 0; j < segments; j++) {
      const a = ringStart + j;
      const b = ringStart + j + 1;
      if (flip) indices.push(centre, b, a);
      else indices.push(centre, a, b);
    }
  };

  if (spec.capStart) cap(0, true);
  if (spec.capEnd) cap(1, false);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/* ------------------------------------------------------------------ */
/* The garment                                                         */
/* ------------------------------------------------------------------ */

const HEM_Y = 0;
/**
 * Hem to shoulder, in metres.
 *
 * A real heavyweight hoodie body is about 70cm from hem to shoulder seam and
 * about 67cm across — very nearly square. Getting this wrong is the single
 * most damaging proportional error available here: stretch the body and the
 * garment stops reading as a hoodie and starts reading as a robe, whatever
 * the folds and the fabric are doing.
 */
const COLLAR_Y = 0.72;

/**
 * Every garment is normalised to this height before it leaves the module,
 * and GarmentMesh applies the same figure to loaded GLBs.
 *
 * The camera choreography is authored once and has to frame a hoodie, an
 * overcoat and a pair of jeans identically well. Normalising here means the
 * proportions above can stay physically honest while the framing stays
 * fixed — the same job `scale` does for an authored GLB.
 */
export const TARGET_HEIGHT = 1.6;

/**
 * Body half-width (side to side) and half-depth (front to back), as
 * fractions of the body's height. Wide and short: the silhouette of a
 * heavyweight boxy hoodie is nearly a rectangle, and narrowing it to a
 * flattering torso shape is what makes CG apparel look like sportswear.
 */
const BODY_RX: readonly Key[] = [
  [0.0, 0.286], // hem ribbing, pulled in
  [0.055, 0.318], // released above the rib
  [0.3, 0.324],
  [0.62, 0.336], // chest
  [0.88, 0.352], // dropped shoulder, the widest point
  [0.97, 0.286], // shoulder breaks in hard toward the collar
  [1.0, 0.168],
];

const BODY_RZ: readonly Key[] = [
  [0.0, 0.152],
  [0.055, 0.176],
  [0.3, 0.184],
  [0.62, 0.196],
  [0.88, 0.206],
  [0.97, 0.17],
  [1.0, 0.115],
];

/**
 * Fold amplitude by height. Zero at the ribbing (which is under tension and
 * therefore smooth), largest through the loose middle of the body, easing
 * off again at the shoulder where the garment is held up.
 */
const FOLD_AMP: readonly Key[] = [
  [0.0, 0.0],
  [0.07, 0.004],
  [0.32, 0.0135],
  [0.6, 0.0125],
  [0.86, 0.006],
  [1.0, 0.001],
];

/** Where the kangaroo pocket sits, in body-height fractions. */
const POCKET = { bottom: 0.115, top: 0.4, spread: 1.02, depth: 0.026 };

/**
 * Radius modulation shared by the body panel.
 *
 * Three terms, in order of scale: the large meandering folds that give the
 * garment its drape, the fine vertical rib at the hem, and the pocket.
 */
function bodyDetail(t: number, theta: number, pocket: boolean): number {
  let d = 0;

  // Large folds. The phase drifts with height so a fold wanders around the
  // body instead of running dead straight from hem to shoulder, and a second
  // lower-frequency lobe stops the wander from looking periodic.
  const amp = sample(FOLD_AMP, t);
  const drift = t * 2.1;
  d += amp * Math.sin(7 * theta + drift + noise1(t * 5, 3) * 1.4);
  d += amp * 0.55 * Math.sin(4 * theta - drift * 0.6 + noise1(t * 3 + 11, 7) * 2);
  d += amp * 0.3 * Math.sin(13 * theta + drift * 1.7);

  // Hem ribbing: high-frequency vertical rib, only in the bottom band.
  const rib = band(t, -0.01, 0.055, 0.02);
  d += rib * 0.0055 * Math.sin(30 * theta);

  // Kangaroo pocket. A raised panel across the front, with the radius
  // dropping back at its angular edges so the eye reads an opening rather
  // than a sticker. The bottom corners are rounded by the feather on the
  // angular window widening as the panel descends.
  const front = Math.cos(theta); // 1 at the front, -1 at the back
  const angular = band(front, Math.cos(POCKET.spread), 1.2, 0.14);
  const vertical = band(t, POCKET.bottom, POCKET.top, 0.035);
  const opening = 1 - band(front, Math.cos(POCKET.spread) - 0.02, Math.cos(POCKET.spread) + 0.06, 0.02) * 0.55;
  if (pocket) d += angular * vertical * opening * POCKET.depth;

  return d;
}

/** The body's centre-line drifts, so the garment hangs rather than stands. */
function bodySway(t: number): [number, number] {
  return [noise1(t * 2.4 + 4, 19) * 0.012, 0.018 * Math.sin(t * 1.6) + noise1(t * 2 + 9, 23) * 0.01];
}

function buildBody(rings: number, segments: number, cut: GarmentCut): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 12 }, (_, i) => {
      const t = i / 11;
      const [dx, dz] = bodySway(t);
      return new THREE.Vector3(dx, HEM_Y + t * COLLAR_Y, dz);
    }),
    false,
    "catmullrom",
    0.5,
  );

  return sweep(curve, {
    rings,
    segments,
    rx: (t) => sample(BODY_RX, t),
    ry: (t) => sample(BODY_RZ, t),
    detail: (t, theta) => bodyDetail(t, theta, cut === "hooded"),
    capStart: true,
    /**
     * The neck opening is closed for a crewneck and left open for a hoodie.
     *
     * The body is a single-sided tube, so an uncapped top is a hole you look
     * straight through — the far interior is back-facing and culled, and the
     * garment reads as translucent. The hood covers that hole, which is why
     * this was never needed before. A crewneck has nothing to cover it, so
     * the shoulder line is closed here and the rib band stands on the rim.
     */
    capEnd: cut === "crew",
  });
}

/* --- Sleeves ------------------------------------------------------- */

const SLEEVE_R: readonly Key[] = [
  [0.0, 0.128], // armhole, buried inside the body
  [0.18, 0.118],
  [0.55, 0.098],
  [0.86, 0.079],
  [0.9, 0.085], // cuff ribbing steps proud of the sleeve
  [1.0, 0.068],
];

/**
 * @param side -1 for the garment's left, +1 for its right.
 */
function buildSleeve(side: number, rings: number, segments: number): THREE.BufferGeometry {
  // Starts well inside the body so the two surfaces interpenetrate. A sleeve
  // that merely touches the shoulder leaves a visible ring under a raking
  // light; one that overlaps reads as a set-in seam. It starts low, too —
  // pushed up toward the collar the tube breaches the shoulder's break and
  // its open end shows as a bright wedge from the front.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.13, COLLAR_Y * 0.8, 0.006),
    new THREE.Vector3(side * 0.29, COLLAR_Y * 0.76, 0.012),
    new THREE.Vector3(side * 0.365, COLLAR_Y * 0.55, 0.026),
    new THREE.Vector3(side * 0.386, COLLAR_Y * 0.33, 0.042),
    new THREE.Vector3(side * 0.382, COLLAR_Y * 0.14, 0.05),
  ]);

  return sweep(curve, {
    rings,
    segments,
    rx: (t) => sample(SLEEVE_R, t),
    ry: (t) => sample(SLEEVE_R, t) * 0.92,
    detail: (t, theta) => {
      let d = 0;
      // Folds gather at the elbow and stack above the cuff, which is where
      // a hanging sleeve actually creases.
      const amp = 0.0085 * band(t, 0.12, 0.88, 0.16) + 0.006 * band(t, 0.6, 0.88, 0.1);
      d += amp * Math.sin(6 * theta + t * 5.5 + side * 1.1);
      d += amp * 0.5 * Math.sin(9 * theta - t * 3.2);
      // Cuff rib.
      d += band(t, 0.885, 1.01, 0.02) * 0.004 * Math.sin(26 * theta);
      return d;
    },
    // Both ends closed. The armhole cap is buried in the body and never seen,
    // but leaving it open means any camera angle that catches the shoulder
    // looks straight down the inside of the tube.
    capStart: true,
    capEnd: true,
  });
}

/* --- Hood ---------------------------------------------------------- */

const HOOD_RX: readonly Key[] = [
  [0.0, 0.132], // face opening
  [0.06, 0.147], // rolled edge of the opening
  [0.12, 0.135],
  [0.42, 0.168],
  [0.72, 0.157],
  [0.92, 0.086],
  [1.0, 0.026],
];

const HOOD_RY: readonly Key[] = [
  [0.0, 0.162],
  [0.06, 0.178],
  [0.12, 0.164],
  [0.42, 0.202],
  [0.72, 0.183],
  [0.92, 0.098],
  [1.0, 0.03],
];

function buildHood(rings: number, segments: number): THREE.BufferGeometry {
  // Sweeps backward from the face opening, over the crown, and closes low on
  // the back — an empty hood standing up, which is the silhouette the whole
  // hero image is built on.
  // Sits down on the shoulders rather than hovering above the collar: the
  // opening is only a little above the shoulder line, and the mass runs back
  // and down from there.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, COLLAR_Y + 0.118, 0.126),
    new THREE.Vector3(0, COLLAR_Y + 0.142, 0.026),
    new THREE.Vector3(0, COLLAR_Y + 0.126, -0.078),
    new THREE.Vector3(-0.004, COLLAR_Y + 0.06, -0.158),
    new THREE.Vector3(-0.006, COLLAR_Y - 0.025, -0.174),
  ]);

  return sweep(curve, {
    rings,
    segments,
    rx: (t) => sample(HOOD_RX, t),
    ry: (t) => sample(HOOD_RY, t),
    detail: (t, theta) => {
      const amp = 0.0075 * band(t, 0.1, 0.9, 0.2);
      return (
        amp * Math.sin(5 * theta + t * 4.2 + 0.7) +
        amp * 0.45 * Math.sin(8 * theta - t * 2.4)
      );
    },
    capEnd: true,
  });
}

/* --- Drawstrings --------------------------------------------------- */

/**
 * Two cords and their aglets.
 *
 * Objectively the smallest part of the model and subjectively the one that
 * does the most work: a thin, slightly asymmetric line falling across a
 * large matte panel is the detail that stops the eye reading the whole thing
 * as CG. The two hang at different lengths for the same reason.
 */
function buildDrawstrings(segments: number): THREE.BufferGeometry[] {
  const parts: THREE.BufferGeometry[] = [];

  const cords: { x: number; drop: number; sway: number }[] = [
    { x: -0.058, drop: 0.26, sway: -0.012 },
    { x: 0.055, drop: 0.21, sway: 0.009 },
  ];

  for (const cord of cords) {
    const top = new THREE.Vector3(cord.x, COLLAR_Y + 0.062, 0.176);
    const curve = new THREE.CatmullRomCurve3([
      top,
      new THREE.Vector3(cord.x + cord.sway * 0.4, top.y - cord.drop * 0.4, 0.194),
      new THREE.Vector3(cord.x + cord.sway, top.y - cord.drop * 0.8, 0.191),
      new THREE.Vector3(cord.x + cord.sway * 1.15, top.y - cord.drop, 0.186),
    ]);

    parts.push(
      sweep(curve, {
        rings: 18,
        segments,
        rx: () => 0.0055,
        ry: () => 0.0055,
        capStart: true,
        capEnd: true,
      }),
    );

    const aglet = new THREE.CylinderGeometry(0.0068, 0.0068, 0.024, 10);
    const end = curve.getPointAt(1);
    aglet.translate(end.x + cord.sway * 0.1, end.y - 0.012, end.z);
    parts.push(aglet);
  }

  return parts;
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

/* --- Crew collar ---------------------------------------------------- */

/**
 * The ribbed neck band of a crewneck sweatshirt.
 *
 * Most of the EOS manifest is crewnecks, not hoodies, and rendering them all
 * with a hood up was the single most visible way the 3D could contradict the
 * product it claims to show. This is the alternative: a short band standing
 * proud of the neck opening, ribbed at a high angular frequency the way real
 * 1x1 rib is, and very slightly wider at its top edge because a worn rib
 * collar flares rather than standing straight.
 *
 * It is a sweep like everything else here, so it shares the body's frames,
 * its normals and its material with no special-casing downstream.
 */
const COLLAR_RX: readonly Key[] = [
  [0.0, 0.166],
  [0.45, 0.150],
  [1.0, 0.158],
];

const COLLAR_RZ: readonly Key[] = [
  [0.0, 0.114],
  [0.45, 0.101],
  [1.0, 0.108],
];

function buildCollar(rings: number, segments: number): THREE.BufferGeometry {
  // Starts just below the body's top ring so the two interpenetrate — the
  // same trick the sleeves use, and for the same reason: a band that merely
  // touches leaves a seam-shaped gap under raking light.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, COLLAR_Y - 0.022, 0),
    new THREE.Vector3(0, COLLAR_Y + 0.012, -0.002),
    new THREE.Vector3(0, COLLAR_Y + 0.046, -0.004),
  ]);

  return sweep(curve, {
    rings,
    segments,
    rx: (t) => sample(COLLAR_RX, t),
    ry: (t) => sample(COLLAR_RZ, t),
    // Rib, plus a slow wobble so the band is not a perfect ellipse.
    detail: (t, theta) =>
      0.0026 * Math.sin(38 * theta) * band(t, 0.05, 1.05, 0.12) +
      0.0035 * Math.sin(3 * theta + 0.9) * t,
    // No caps. This is a band you can see into, not a lid — capping it put a
    // flat plate across the neck that caught the key light and read as a
    // lens cap sitting on the shoulders.
  });
}

/** Hooded, or a crewneck. Decided per product — see garment-config. */
export type GarmentCut = "hooded" | "crew";

export type GarmentDetail = "low" | "high";

const RESOLUTION: Record<GarmentDetail, { rings: number; segments: number; small: number }> = {
  // Roughly 7k triangles against 18k. The silhouette survives the cut
  // because the fold *amplitude* is unchanged — only the tessellation
  // sampling it drops, which costs a little softness and nothing else.
  low: { rings: 34, segments: 40, small: 8 },
  high: { rings: 60, segments: 72, small: 12 },
};

function build(detail: GarmentDetail, cut: GarmentCut): THREE.BufferGeometry {
  const { rings, segments, small } = RESOLUTION[detail];

  const hooded = cut === "hooded";

  const parts = [
    // The kangaroo pocket belongs to the hoodie. A crewneck sweatshirt with
    // one is a different garment, so the pocket follows the hood.
    buildBody(rings, segments, cut),
    buildSleeve(-1, Math.round(rings * 0.55), Math.round(segments * 0.5)),
    buildSleeve(1, Math.round(rings * 0.55), Math.round(segments * 0.5)),
    ...(hooded
      ? [
          buildHood(Math.round(rings * 0.5), Math.round(segments * 0.6)),
          ...buildDrawstrings(small),
        ]
      : [buildCollar(Math.round(rings * 0.22), segments)]),
  ];

  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  if (!merged) throw new Error("Failed to merge garment geometry");

  // Normalise, then centre on the origin. Cameras, the hover rig and the
  // scroll states all orbit (0,0,0), so the garment's own centre has to live
  // there rather than at the base of its hem.
  merged.computeBoundingBox();
  const box = merged.boundingBox!;
  const size = box.getSize(new THREE.Vector3());
  merged.scale(
    TARGET_HEIGHT / size.y,
    TARGET_HEIGHT / size.y,
    TARGET_HEIGHT / size.y,
  );

  merged.computeBoundingBox();
  const centre = merged.boundingBox!.getCenter(new THREE.Vector3());
  merged.translate(-centre.x, -centre.y, -centre.z);

  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  merged.computeBoundingBox();
  return merged;
}

const cache = new Map<string, THREE.BufferGeometry>();

/**
 * Lazy, cached per detail level AND cut — building either twice is pure
 * waste, but they are different meshes and must not share an entry. The
 * cache key was a bare `GarmentDetail` while only one cut existed; adding
 * the crewneck without widening it would have served whichever of the two
 * happened to be built first to every product on the page.
 */
export function garmentGeometry(
  detail: GarmentDetail = "high",
  cut: GarmentCut = "hooded",
): THREE.BufferGeometry {
  const key = `${detail}:${cut}`;
  let geometry = cache.get(key);
  if (!geometry) {
    geometry = build(detail, cut);
    cache.set(key, geometry);
  }
  return geometry;
}

/** Height of the built garment, for framing the camera against any asset. */
export function garmentHeight(
  detail: GarmentDetail = "high",
  cut: GarmentCut = "hooded",
): number {
  const box = garmentGeometry(detail, cut).boundingBox;
  return box ? box.max.y - box.min.y : 1.6;
}
