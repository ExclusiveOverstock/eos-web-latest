import * as THREE from "three";
/**
 * Procedural loopback cotton.
 *
 * Generated on a canvas rather than shipped as image files: the garment is
 * the only textured object in the experience, and a normal map drawn at load
 * costs a few milliseconds against the several hundred kilobytes a set of 2K
 * PBR maps would add to a page whose entire point is opening fast.
 *
 * What actually sells cloth at this scale is the normal map, not the colour
 * map. Against a hard key light the eye reads fabric from the way light
 * breaks across the knit — so the colour map is nearly flat and the normal
 * carries the loop structure.
 */
let cache: {
  normalMap: THREE.Texture;
  roughnessMap: THREE.Texture;
} | null = null;
function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  return { canvas, ctx };
}
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
/**
 * A tangent-space normal map of French-terry loops.
 *
 * Built by accumulating a height field and differentiating it, rather than
 * drawing normals directly — drawn normals never light consistently, because
 * neighbouring strokes disagree about which way the surface is going.
 */
function buildKnitNormal(size = 512) {
  const rand = seeded(4021);
  const height = new Float32Array(size * size);
  // Loopback knit: staggered rows of small arcs, each row offset by half a
  // column. The stagger is what stops it reading as woven canvas.
  const cols = 64;
  const rows = 84;
  const cw = size / cols;
  const rh = size / rows;
  for (let r = 0; r < rows; r += 1) {
    const offset = (r % 2) * cw * 0.5;
    for (let c = 0; c < cols; c += 1) {
      const cx = c * cw + offset + (rand() - 0.5) * cw * 0.16;
      const cy = r * rh + (rand() - 0.5) * rh * 0.16;
      const rx = cw * 0.46;
      const ry = rh * 0.4;
      const peak = 0.72 + rand() * 0.28;
      // Stamp one loop as a smooth bump.
      const x0 = Math.floor(cx - rx * 1.6);
      const x1 = Math.ceil(cx + rx * 1.6);
      const y0 = Math.floor(cy - ry * 1.6);
      const y1 = Math.ceil(cy + ry * 1.6);
      for (let y = y0; y <= y1; y += 1) {
        for (let x = x0; x <= x1; x += 1) {
          const dx = (x - cx) / rx;
          const dy = (y - cy) / ry;
          const d2 = dx * dx + dy * dy;
          if (d2 > 1.6) continue;
          const falloff = Math.exp(-d2 * 1.9);
          const xi = ((x % size) + size) % size;
          const yi = ((y % size) + size) % size;
          height[yi * size + xi] += falloff * peak;
        }
      }
    }
  }
  // Slubs: the odd thicker fibre, which keeps the knit from looking printed.
  for (let i = 0; i < 900; i += 1) {
    const x = Math.floor(rand() * size);
    const y = Math.floor(rand() * size);
    const len = 3 + rand() * 9;
    for (let k = 0; k < len; k += 1) {
      const xi = (x + k) % size;
      height[y * size + xi] += 0.18;
    }
  }
  const { canvas, ctx } = makeCanvas(size);
  const image = ctx.createImageData(size, size);
  const at = (x: number, y: number) =>
    height[(((y % size) + size) % size) * size + (((x % size) + size) % size)];
  // Sobel-style differentiation of the height field into a normal.
  const strength = 2.6;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * size + x) * 4;
      image.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
/**
 * Roughness variation. Cotton is uniformly matte, so this is subtle — its
 * job is only to stop the specular response being perfectly even, which is
 * what makes a surface read as synthetic.
 */
function buildRoughness(size = 256) {
  const { canvas, ctx } = makeCanvas(size);
  const rand = seeded(917);
  ctx.fillStyle = "#d8d8d8";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1400; i += 1) {
    ctx.globalAlpha = 0.02 + rand() * 0.05;
    ctx.fillStyle = rand() > 0.5 ? "#ffffff" : "#9a9a9a";
    ctx.beginPath();
    ctx.arc(rand() * size, rand() * size, 2 + rand() * 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.filter = "blur(1.5px)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  return canvas;
}
function finish(canvas: HTMLCanvasElement, repeat: number, srgb = false) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
export function fabricMaps() {
  if (!cache) {
    cache = {
      normalMap: finish(buildKnitNormal(), 9),
      roughnessMap: finish(buildRoughness(), 5),
    };
  }
  return cache;
}
/**
 * The garment material.
 *
 * `sheen` is the reason this is a physical material and not a standard one.
 * It adds the retroreflective halo that fibre ends give real cloth at
 * grazing angles — the effect that makes a hoodie's edge glow softly against
 * a dark ground instead of terminating in a hard line. Without it, heavy
 * cotton renders as matte rubber no matter how good the normal map is.
 *
 * On the low tier sheen is dropped, since it costs a second specular
 * evaluation per fragment; the garment stays legible on its silhouette.
 */
export function garmentMaterial(withSheen: boolean) {
  const { normalMap, roughnessMap } = fabricMaps();
  return new THREE.MeshPhysicalMaterial({
    /**
     * Not the charcoal token. #191717 is a UI background — as a reflectance
     * value it is ~0.8% linear, which is darker than real black velvet, and
     * no lighting rig can lift a surface that dark off a near-black ground.
     * Charcoal *cloth* measures nearer 8%, which is this. The garment reads
     * as the palette's charcoal on screen precisely because it isn't set to
     * the palette's charcoal here.
     */
    color: "#3c3b3d",
    /**
     * The geometry carries baked occlusion and seam shading in its vertex
     * colours, which three multiplies into this. It is doing the job of the
     * global illumination the scene has no budget to compute: without it
     * every fold valley is lit exactly as brightly as the ridge beside it,
     * and the cloth reads as a moulded shell with creases painted on.
     */
    vertexColors: true,
    roughness: 0.94,
    metalness: 0,
    normalMap,
    normalScale: new THREE.Vector2(0.42, 0.42),
    roughnessMap,
    sheen: withSheen ? 0.85 : 0,
    sheenColor: new THREE.Color(withSheen ? "#57555a" : "#000000"),
    sheenRoughness: 0.62,
    envMapIntensity: 0.55,
    side: THREE.DoubleSide,
  });
}
