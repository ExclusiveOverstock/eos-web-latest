import * as THREE from "three";

/**
 * Procedural canvas textures for the boutique.
 *
 * Everything here is generated once, on the client, at first use — no image
 * files to download and no HDRI fetch, which keeps the virtual store's
 * payload to just the JS bundle. Each builder is wrapped in a lazy singleton
 * so a texture is rasterised at most once per session no matter how many
 * fixtures share it.
 *
 * This module touches `document`, so it must only ever be imported from the
 * client-only virtual-store bundle (the route uses `ssr: false`).
 */

const SIZE = 512;

function makeCanvas(size = SIZE) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  return { canvas, ctx };
}

function finish(
  canvas: HTMLCanvasElement,
  repeat: [number, number],
  colorSpace: THREE.ColorSpace = THREE.NoColorSpace,
) {
  const texture = new THREE.CanvasTexture(canvas);
  // Mirrored rather than plain repeat: none of these canvases is drawn to be
  // seamless, so straight tiling lays a visible grid of hard edges across
  // every large surface. Mirroring guarantees each edge meets its own
  // reflection, and for noise-dominated material like this the mirror itself
  // is invisible.
  texture.wrapS = THREE.MirroredRepeatWrapping;
  texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.colorSpace = colorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Cheap deterministic value noise so textures look identical every reload. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

type WoodSpec = {
  base: string;
  seed: number;
  /** Vertical grain (planks running up) vs horizontal (planks running across). */
  strands: number;
};

function buildWoodColor({ base, seed, strands }: WoodSpec) {
  const { canvas, ctx } = makeCanvas();
  const rand = seeded(seed);

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Broad tonal banding — the cathedral figure you read from across a room.
  for (let i = 0; i < 30; i += 1) {
    const x = rand() * SIZE;
    const w = 8 + rand() * 46;
    const warm = i % 3 === 0;
    const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(
      0.5,
      warm ? "rgba(196,150,102,0.10)" : `rgba(0,0,0,${0.06 + rand() * 0.12})`,
    );
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x, 0, w, SIZE);
  }

  // Fine grain strands. Each wobbles on a whole number of cycles over the
  // canvas height so the texture still tiles cleanly vertically.
  for (let i = 0; i < strands; i += 1) {
    const x = rand() * SIZE;
    const cycles = 1 + Math.floor(rand() * 3);
    const amp = 2 + rand() * 7;
    const phase = rand() * Math.PI * 2;
    const light = rand() > 0.72;
    ctx.strokeStyle = light
      ? `rgba(214,176,132,${0.03 + rand() * 0.06})`
      : `rgba(0,0,0,${0.05 + rand() * 0.16})`;
    ctx.lineWidth = 0.4 + rand() * 2.2;
    ctx.beginPath();
    for (let y = 0; y <= SIZE; y += 16) {
      const wobble = Math.sin((y / SIZE) * Math.PI * 2 * cycles + phase) * amp;
      if (y === 0) ctx.moveTo(x + wobble, y);
      else ctx.lineTo(x + wobble, y);
    }
    ctx.stroke();
  }

  return canvas;
}

function buildNoise(seed: number, contrast: number, mid: number) {
  const { canvas, ctx } = makeCanvas(256);
  const image = ctx.createImageData(256, 256);
  const rand = seeded(seed);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = Math.round(255 * Math.min(1, Math.max(0, mid + (rand() - 0.5) * contrast)));
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  // A single blur pass turns per-pixel hash into a softer, more material grain.
  ctx.filter = "blur(1px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  return canvas;
}

function buildStoneColor(seed: number, base: string, fleck: string) {
  const { canvas, ctx } = makeCanvas(256);
  const rand = seeded(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  // Honed, not polished granite: fine and sparse, so a 1m plinth face reads
  // as a single quiet mass rather than a speckled pattern.
  for (let i = 0; i < 1400; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? fleck : "rgba(0,0,0,0.16)";
    ctx.globalAlpha = 0.02 + rand() * 0.07;
    const r = 0.4 + rand() * 1.1;
    ctx.beginPath();
    ctx.arc(rand() * 256, rand() * 256, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Faint veining, kept low-contrast so the stone stays quiet.
  for (let i = 0; i < 5; i += 1) {
    ctx.strokeStyle = `rgba(190,182,168,${0.015 + rand() * 0.02})`;
    ctx.lineWidth = 0.6 + rand() * 1.4;
    ctx.beginPath();
    let x = rand() * 256;
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 256; y += 24) {
      x += (rand() - 0.5) * 26;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return canvas;
}

/**
 * Troweled plaster. Kept extremely low-contrast on purpose: at the strength
 * you'd need to see it in a swatch, a large wall of it reads as cork or
 * terrazzo rather than a flat plastered surface. The mottling here is meant
 * to be felt only as a break in perfectly uniform shading.
 */
function buildPlaster(seed: number) {
  const { canvas, ctx } = makeCanvas(256);
  const rand = seeded(seed);
  ctx.fillStyle = "#8f8a80";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 380; i += 1) {
    ctx.globalAlpha = 0.004 + rand() * 0.008;
    ctx.fillStyle = rand() > 0.5 ? "#ffffff" : "#000000";
    ctx.beginPath();
    ctx.arc(rand() * 256, rand() * 256, 6 + rand() * 22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.filter = "blur(3px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  return canvas;
}

/** Soft radial falloff used as a fake contact shadow under fixtures. */
function buildShadowBlob() {
  const { canvas, ctx } = makeCanvas(128);
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,0.62)");
  gradient.addColorStop(0.45, "rgba(0,0,0,0.34)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return canvas;
}

/** Knitted/woven weave for the garment placeholders — reads at close range. */
function buildWeave(seed: number) {
  const { canvas, ctx } = makeCanvas(128);
  const rand = seeded(seed);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 2) {
    ctx.strokeStyle = `rgba(0,0,0,${0.05 + rand() * 0.05})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(128, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 128);
    ctx.stroke();
  }
  return canvas;
}

function lazy<T>(build: () => T) {
  let value: T | null = null;
  return () => {
    if (value === null) value = build();
    return value;
  };
}

/** Warm mid-brown walnut for floors and large joinery. */
export const walnutMap = lazy(() =>
  finish(buildWoodColor({ base: "#3e2f22", seed: 21, strands: 240 }), [1, 1], THREE.SRGBColorSpace),
);

/** Near-black smoked oak for slat paneling and fixture carcasses. */
export const blackenedWoodMap = lazy(() =>
  finish(buildWoodColor({ base: "#241811", seed: 77, strands: 200 }), [1, 1], THREE.SRGBColorSpace),
);

export const woodRoughnessMap = lazy(() => finish(buildNoise(9, 0.42, 0.55), [1, 1]));

export const stoneMap = lazy(() =>
  finish(buildStoneColor(41, "#33312c", "#5d574d"), [1, 1], THREE.SRGBColorSpace),
);

export const paleStoneMap = lazy(() =>
  finish(buildStoneColor(58, "#5c574e", "#837c70"), [1, 1], THREE.SRGBColorSpace),
);

export const stoneRoughnessMap = lazy(() => finish(buildNoise(13, 0.3, 0.72), [1, 1]));

export const plasterMap = lazy(() => finish(buildPlaster(31), [1, 1], THREE.SRGBColorSpace));

export const plasterRoughnessMap = lazy(() => finish(buildNoise(5, 0.22, 0.86), [1, 1]));

export const metalRoughnessMap = lazy(() => finish(buildNoise(67, 0.26, 0.38), [1, 1]));

export const shadowBlobMap = lazy(() => {
  const texture = new THREE.CanvasTexture(buildShadowBlob());
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
});

export const weaveMap = lazy(() => finish(buildWeave(88), [3, 3], THREE.SRGBColorSpace));

/**
 * `repeat` lives on the texture, not the material, so surfaces that need a
 * different tiling density (a 22m floor vs a 0.4m shelf edge) can't share one
 * instance. Clones share the underlying canvas image and are cached per
 * key+tiling, so we upload each distinct variant once and no more.
 */
const repeatCache = new Map<string, THREE.Texture>();

export function tiled(
  source: () => THREE.Texture,
  key: string,
  x: number,
  y: number,
): THREE.Texture {
  const cacheKey = `${key}:${x}:${y}`;
  const cached = repeatCache.get(cacheKey);
  if (cached) return cached;
  const texture = source().clone();
  texture.repeat.set(x, y);
  texture.needsUpdate = true;
  repeatCache.set(cacheKey, texture);
  return texture;
}
