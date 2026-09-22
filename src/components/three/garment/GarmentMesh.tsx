"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useAnimations, useGLTF } from "@react-three/drei";
import {
  garmentGeometry,
  TARGET_HEIGHT,
  type GarmentDetail,
} from "@/lib/three/garment-geometry";
import { fabricMaps } from "@/lib/three/garment-textures";
import type { GarmentAsset } from "./garment-config";

/**
 * The garment itself — either a real GLB or the procedural stand-in.
 *
 * The two paths are separate components rather than one branching component
 * because `useGLTF` suspends, and a hook that suspends cannot be called
 * conditionally. Keeping them apart also means the procedural garment can
 * serve as the *suspense fallback* for the real one: while a GLB streams in,
 * the placeholder is already on screen holding the composition, so the
 * cinematic opening never plays against an empty frame.
 */

type Props = {
  asset: GarmentAsset;
  detail: GarmentDetail;
  /** Physical materials cost real time on weak GPUs; the low tier goes without. */
  richMaterial: boolean;
  castShadow: boolean;
};

/* ------------------------------------------------------------------ */
/* Procedural                                                          */
/* ------------------------------------------------------------------ */

function ProceduralGarment({ asset, detail, richMaterial, castShadow }: Props) {
  // Keyed on the cut as well as the detail level: a crewneck and a hoodie
  // are different meshes, and memoising on `detail` alone would hand the
  // second product on the page whichever one was built first.
  const geometry = useMemo(
    () => garmentGeometry(detail, asset.cut),
    [detail, asset.cut],
  );

  const material = useMemo(() => {
    const maps = fabricMaps(detail === "low" ? 4 : 7);

    const common = {
      color: new THREE.Color(asset.color),
      roughness: 1,
      roughnessMap: maps.roughnessMap,
      normalMap: maps.normalMap,
      // Held well under 1: the normal map describes a knit at true scale, and
      // pushing it harder turns 480gsm cotton into corrugated iron.
      normalScale: new THREE.Vector2(0.5, 0.5),
      metalness: 0,
      envMapIntensity: 0.55,
    };

    if (!richMaterial) return new THREE.MeshStandardMaterial(common);

    /**
     * Sheen is the whole reason this is a Physical material. It is the
     * retroreflective halo cloth gets at grazing angles — the pale edge you
     * see along a shoulder against a dark background. Without it, fabric
     * under a hard key light reads as painted plastic no matter how good
     * the normal map is.
     */
    return new THREE.MeshPhysicalMaterial({
      ...common,
      sheen: asset.sheen,
      sheenColor: new THREE.Color(asset.sheenColor),
      sheenRoughness: 0.78,
    });
  }, [asset, detail, richMaterial]);

  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      castShadow={castShadow}
      receiveShadow
      scale={asset.scale}
      position={[0, asset.lift, 0]}
      rotation={[0, asset.facing, 0]}
    />
  );
}

/* ------------------------------------------------------------------ */
/* GLB                                                                 */
/* ------------------------------------------------------------------ */

function LoadedGarment({ asset, castShadow }: Props & { asset: GarmentAsset & { src: string } }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(asset.src);
  const { actions } = useAnimations(animations, group);

  /**
   * Normalise the asset: scale to the house height, then centre on its own
   * bounding box.
   *
   * Both are done here rather than asked of whoever exports the GLB. Captured
   * garments arrive at whatever scale and origin their pipeline used — this
   * one is twelve units tall with its origin thirteen units below the hem —
   * and the camera choreography is authored once for every asset. Normalising
   * on load means a new garment is framed correctly the moment it is dropped
   * in, with no per-asset numbers to discover.
   *
   * Materials are cloned before they are touched: useGLTF caches the parsed
   * document, so mutating a material in place would leak the change into
   * every other mount of the same asset.
   */
  const prepared = useMemo(() => {
    const clone = scene.clone(true);

    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    if (size.y > 0) clone.scale.multiplyScalar(TARGET_HEIGHT / size.y);
    clone.updateMatrixWorld(true);

    const centred = new THREE.Box3().setFromObject(clone);
    clone.position.sub(centred.getCenter(new THREE.Vector3()));

    clone.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;

      if (asset.albedoGain === 1) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mesh.material = materials.map((source) => {
        const material = source.clone() as THREE.MeshStandardMaterial;
        // Multiplies the base colour map. Three carries colours in linear
        // space with no clamp at 1, so this scales reflectance directly.
        material.color?.multiplyScalar(asset.albedoGain);
        return material;
      });
      if (!Array.isArray(mesh.material)) return;
      if (mesh.material.length === 1) mesh.material = mesh.material[0];
    });

    return clone;
  }, [scene, castShadow, asset.albedoGain]);

  useLayoutEffect(() => {
    if (!asset.idleClip) return;
    const action = actions[asset.idleClip];
    if (!action) return;
    action.reset().fadeIn(0.8).play();
    return () => {
      action.fadeOut(0.6);
    };
  }, [actions, asset.idleClip]);

  return (
    <group
      ref={group}
      scale={asset.scale}
      position={[0, asset.lift, 0]}
      rotation={[0, asset.facing, 0]}
    >
      <primitive object={prepared} />
    </group>
  );
}

/* ------------------------------------------------------------------ */

export default function GarmentMesh(props: Props) {
  if (!props.asset.src) return <ProceduralGarment {...props} />;

  return (
    <Suspense fallback={<ProceduralGarment {...props} />}>
      <LoadedGarment {...props} asset={props.asset as GarmentAsset & { src: string }} />
    </Suspense>
  );
}
