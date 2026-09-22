import { getMaterials } from "@/lib/three/materials";
import { ISLAND } from "@/lib/three/store-layout";
import ContactShadow from "./ContactShadow";

/**
 * The sculptural central island — the store's main visual anchor.
 *
 * A solid walnut deck cantilevers off a single angled leg, so from the door
 * it reads as one wedge of timber rather than a table with four legs. A pale
 * limestone block sits at the near end as a material counterpoint, and a
 * shallow brass tray is inlaid into the deck for small hero pieces.
 *
 * Everything sits at 0.78m — below eye height, so the sightline down the
 * aisle to the back alcove is never interrupted.
 */
export default function DisplayIsland() {
  const M = getMaterials();
  const [x, z] = ISLAND.center;
  const { deckLength, deckWidth, deckHeight } = ISLAND;
  const [bw, bh, bd] = ISLAND.blockSize;

  return (
    <group position={[x, 0, z]}>
      {/* Deck. Thick enough to read as a solid slab, not a panel. */}
      <mesh position={[0, deckHeight - 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[deckWidth, 0.12, deckLength]} />
        <primitive object={M.walnut} attach="material" />
      </mesh>

      {/* Brass inlay tray recessed into the deck's far half. */}
      <mesh position={[0, deckHeight + 0.002, -deckLength * 0.22]}>
        <boxGeometry args={[deckWidth * 0.52, 0.012, deckLength * 0.34]} />
        <primitive object={M.brass} attach="material" />
      </mesh>

      {/* Angled walnut wedge under the near end. Run full width and flush
          with the deck edges so deck and wedge read as one carved mass —
          inset even a little and it separates into a tabletop on a leg. */}
      <mesh
        position={[0, (deckHeight - 0.12) / 2, -deckLength * 0.24]}
        rotation={[0.3, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[deckWidth, deckHeight + 0.2, 0.78]} />
        <primitive object={M.walnut} attach="material" />
      </mesh>

      {/* Dark stone pier carrying the near half. Set inboard of both ends and
          clear of the angled leg, so the deck reads as spanning between two
          supports with daylight under the overhangs. */}
      <mesh position={[0, (deckHeight - 0.12) / 2, deckLength * 0.2]} castShadow receiveShadow>
        <boxGeometry args={[deckWidth * 0.52, deckHeight - 0.12, deckLength * 0.34]} />
        <primitive object={M.stone} attach="material" />
      </mesh>

      {/* Pale limestone block at the near end. */}
      <mesh
        position={[0.12, bh / 2, ISLAND.blockOffsetZ]}
        rotation={[0, -0.16, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[bw, bh, bd]} />
        <primitive object={M.paleStone} attach="material" />
      </mesh>

      <ContactShadow
        scale={deckWidth + 1.5}
        scaleZ={deckLength + 1.2}
        opacity={0.6}
        position={[0, -0.1]}
      />
      <ContactShadow scale={bw + 0.9} opacity={0.55} position={[0.12, ISLAND.blockOffsetZ]} />
    </group>
  );
}
