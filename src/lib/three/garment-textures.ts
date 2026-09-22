import * as THREE from "three";

/**
 * Fabric surface for the hero garment.
 *
 * Deliberately separate from lib/three/textures.ts, which serves the
 * boutique in Prototype A. That module's weave is a 128px colour tile tuned
 * to read on garments seen from two metres away across a room. The hero gets
 * a camera within arm's length of the cloth, where a colour tile is useless:
 * at that distance fabric is legible entirely through *shading*, not through
 * a printed pattern. So this module generates a height field and converts it
 * to a normal map, which is what makes a light rake across a knit and pick
 * out the wales.
 *
 * Everything is canvas-generated at import-time-deferred (never at module
 * scope — these need `document`) and cached forever.
 */

const SIZE = 512;

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * The height field: a heavyweight loopback knit.
 *
 * Three layers, coarse to fine — vertical wales (the columns a knit is built
 * from), the horizontal course between them, and a fine brushed fuzz over
 * everything. The wales are given a slow horizontal wobble because a real
 * knit's columns are never perfectly straight, and perfectly straight ones
 * are what make CG fabric look printed.
 */
function buildFabricHeight(seed: number): ImageData {
  const { ctx } = makeCanvas(SIZE);
  const rand = seeded(seed);
  const image = ctx.createImageData(SIZE, SIZE);
  const data = image.data;

  const WALE = 9; // pixels between vertical columns
  const COURSE = 7; // pixels between horizontal rows

  // Pre-roll the per-row wobble so the wales stay continuous down the tile.
  const wobble = new Float32Array(SIZE);
  let drift = 0;
  for (let y = 0; y < SIZE; y++) {
    drift += (rand() - 0.5) * 0.22;
    drift = Math.max(-1.6, Math.min(1.6, drift * 0.985));
    wobble[y] = drift;
  }

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const wx = x + wobble[y];
      const wale = Math.cos((wx / WALE) * Math.PI * 2) * 0.5 + 0.5;
      const course = Math.cos((y / COURSE) * Math.PI * 2) * 0.5 + 0.5;

      // The loop sits where a wale crosses a course; multiplying rather than
      // adding the two gives the rounded lozenge of a knit stitch instead of
      // a woven grid.
      let h = 0.42 + wale * course * 0.4 + course * 0.08;

      // Brushed fuzz. Fine, low-amplitude, and the reason the surface reads
      // as fleece rather than as moulded plastic.
      h += (rand() - 0.5) * 0.09;

      const v = Math.max(0, Math.min(255, h * 255)) | 0;
      const i = (y * SIZE + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }

  return image;
}

/**
 * Sobel a height field into a tangent-space normal map.
 *
 * Sampling wraps at the edges so the resulting map tiles without a seam —
 * a seam in a normal map on a large panel shows up as a hard vertical line
 * under a key light, which is exactly the lighting this garment gets.
 */
function heightToNormal(height: ImageData, strength: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(SIZE);
  const out = ctx.createImageData(SIZE, SIZE);
  const h = height.data;

  const at = (x: number, y: number) => {
    const xi = (x + SIZE) % SIZE;
    const yi = (y + SIZE) % SIZE;
    return h[(yi * SIZE + xi) * 4] / 255;
  };

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx =
        at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1) -
        (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1));
      const dy =
        at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1) -
        (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1));

      const nx = dx * strength;
      const ny = dy * strength;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);

      const i = (y * SIZE + x) * 4;
      out.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      out.data[i + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvas;
}

/**
 * Roughness variation.
 *
 * Blotchy and low-contrast. Uniform roughness is the single loudest tell of
 * a CG material: real cloth has areas that have been handled, pressed or
 * worn, and those areas catch light differently. The knit's own structure is
 * folded in at low weight so the wales stay faintly visible in the specular.
 */
function buildFabricRoughness(height: ImageData, seed: number): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(SIZE);
  const out = ctx.createImageData(SIZE, SIZE);
  const rand = seeded(seed);

  // A cheap value-noise field at a coarse scale, bilinearly upsampled.
  const CELLS = 16;
  const grid = new Float32Array((CELLS + 1) * (CELLS + 1));
  for (let i = 0; i < grid.length; i++) grid[i] = rand();

  const cell = SIZE / CELLS;
  for (let y = 0; y < SIZE; y++) {
    const gy = y / cell;
    const y0 = Math.floor(gy);
    const fy = gy - y0;
    const sy = fy * fy * (3 - 2 * fy);

    for (let x = 0; x < SIZE; x++) {
      const gx = x / cell;
      const x0 = Math.floor(gx);
      const fx = gx - x0;
      const sx = fx * fx * (3 - 2 * fx);

      const i00 = grid[y0 * (CELLS + 1) + x0];
      const i10 = grid[y0 * (CELLS + 1) + x0 + 1];
      const i01 = grid[(y0 + 1) * (CELLS + 1) + x0];
      const i11 = grid[(y0 + 1) * (CELLS + 1) + x0 + 1];
      const blotch =
        (i00 + (i10 - i00) * sx) * (1 - sy) + (i01 + (i11 - i01) * sx) * sy;

      const structure = height.data[(y * SIZE + x) * 4] / 255;
      // Held in a narrow band high on the scale — this is a matte
      // 480gsm cotton, not satin.
      const v = 0.82 + blotch * 0.13 - structure * 0.06;

      const i = (y * SIZE + x) * 4;
      const b = Math.max(0, Math.min(255, v * 255)) | 0;
      out.data[i] = b;
      out.data[i + 1] = b;
      out.data[i + 2] = b;
      out.data[i + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvas;
}

function toTexture(
  canvas: HTMLCanvasElement,
  repeat: number,
  colorSpace: THREE.ColorSpace = THREE.NoColorSpace,
): THREE.Texture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

type FabricMaps = {
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
};

let cache: FabricMaps | null = null;

/** Lazy singleton. Needs `document`, so never call during module init. */
export function fabricMaps(repeat = 6): FabricMaps {
  if (!cache) {
    const height = buildFabricHeight(1701);
    cache = {
      normalMap: toTexture(heightToNormal(height, 2.6), repeat),
      roughnessMap: toTexture(buildFabricRoughness(height, 907), repeat),
    };
  }
  return cache;
}

export function disposeFabricMaps() {
  if (!cache) return;
  cache.normalMap.dispose();
  cache.roughnessMap.dispose();
  cache = null;
}
