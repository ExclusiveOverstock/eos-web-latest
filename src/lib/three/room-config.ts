/**
 * Single source of truth for the boutique's dimensions. The room shell
 * (Boutique.tsx), the fixture layout (store-layout.ts) and the player
 * movement clamp (PlayerControls.tsx) all read from this so the walls,
 * the merchandising and the walkable area never drift apart.
 *
 * Proportions target a real boutique rather than a hall: a 14m x 22m
 * floor under a 4.9m ceiling reads as intimate and premium at eye height,
 * where the previous 6.5m ceiling read as an empty architectural shell.
 */
export const ROOM = {
  width: 14, // interior x spans -width/2 .. width/2
  depth: 22, // interior z spans entranceZ .. backWallZ
  height: 4.9,
  entranceZ: -11, // south wall / doorway plane
  backWallZ: 11,
  doorwayWidth: 3.0,
  openingHeight: 2.55, // clear height of the entrance opening
  vestibuleZ: -14, // small foyer outside the doors, where the player spawns

  /** Perimeter soffit: the lower outer ceiling band carrying the downlights. */
  soffitDrop: 0.42, // how far its underside hangs below the main slab
  soffitInset: 2.4, // how far it reaches in from each wall

  /**
   * Thickness of the slatted panel zone standing proud of each structural
   * wall. Display niches are simply gaps left in this field, which makes
   * them genuine 34cm recesses rather than boxes stuck onto a flat plane.
   */
  panelDepth: 0.34,

  /** Depth of the illuminated alcove cut into the back wall. */
  alcoveDepth: 1.1,
  alcoveWidth: 3.6,
  alcoveHeight: 2.9,
} as const;

export const HALF_W = ROOM.width / 2;
/** Centre of the sales floor along z — handy for centring shell geometry. */
export const FLOOR_MID_Z = (ROOM.entranceZ + ROOM.backWallZ) / 2;
export const FLOOR_DEPTH = ROOM.backWallZ - ROOM.entranceZ;

// Inset far enough from the structural walls to clear the panel zone and
// anything merchandised inside its niches.
const WALL_CLEARANCE = ROOM.panelDepth + 0.5;

export const WALK_BOUNDS = {
  minX: -HALF_W + WALL_CLEARANCE,
  maxX: HALF_W - WALL_CLEARANCE,
  minZ: ROOM.vestibuleZ + 0.6,
  maxZ: ROOM.backWallZ - WALL_CLEARANCE,
} as const;

export const EYE_HEIGHT = 1.65;

/** Where the cinematic entry dolly comes to rest, just inside the doors. */
export const ENTRY_REST_Z = ROOM.entranceZ + 3.7;
