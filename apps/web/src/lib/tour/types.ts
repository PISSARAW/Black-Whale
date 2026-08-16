/**
 * The types of the walkable reconstruction of the Black Whale.
 *
 * The tour is a projection of `data/ship/blueprint.json`, which holds the ship
 * as metric geometry rather than as drawings. It answers *what the ship is
 * built like*, where `/ship` answers *who is where at a given event*: nothing
 * here reads the timeline, and nothing here places a passenger.
 *
 * The two are not independent, though. The tour is meant to be the walkable
 * version of the plans `/ship` draws, so the order of authority runs manga →
 * `/ship` → tour: a page of the manga settles it, and where no page speaks,
 * what the room plan under `$lib/assets/maps/local` draws is what the room
 * holds — tagged `map`, so a reader can tell the two apart at a glance.
 */

/**
 * A point on a deck: `[x, z]` in metres. `x` runs fore and aft with the bow at
 * `-x`, `z` is athwartships and `z = 0` is the centreline — the hulls are
 * parallel midbodies capped at the extremes of `x` and symmetric about `z = 0`,
 * which is what says so. Some room names still read the axes the other way
 * round; `data/ship/README.md` says why they were left alone.
 */
export type Vec2 = readonly [number, number]

/** A closed simple polygon. The last point is not repeated. */
export type Polygon = Vec2[]

/**
 * A straight run between two points.
 *
 * Named because the pair travels together everywhere and four loose `Vec2`
 * parameters read as eight numbers in a row: `overlap(a, b)` says which two
 * things are being compared, where `overlap(a1, a2, b1, b2)` only says it if
 * you already know.
 */
export type Segment = readonly [Vec2, Vec2]

/** Three corners, wound the way the surface they belong to is wound. */
export type Triangle = readonly [Vec2, Vec2, Vec2]

/**
 * How much of a piece of geometry the manga actually supports.
 *
 * - `panel` — a panel shows the room; its shape is read off that panel.
 * - `plan`  — it appears on the ship's deck cross-section, without an interior.
 * - `map`  — no page of the manga shows it; the room plan on `/ship` draws it.
 *   The tour is meant to be the walkable version of that map, so what the map
 *   puts in a room belongs in the room — said in the open, one rank below the
 *   drawings, because the map is this archive's reading and not Togashi's line.
 * - `inferred` — nothing shows it, not even the map. It exists so the deck is
 *   contiguous, and the tour marks it as such rather than passing it off as
 *   canon.
 *
 * The tag says how strong the claim is; the `source` beside it says what backs
 * it, in both languages, because `/tour/sources` publishes the two together and
 * a reader who only reads French is owed the same account as everyone else.
 */
export type Provenance = 'panel' | 'plan' | 'map' | 'inferred'

export type SpaceCategory =
  | 'room'
  | 'corridor'
  | 'quarters'
  | 'residential'
  | 'public'
  | 'military'
  | 'administrative'
  | 'medical'
  | 'mafia'
  | 'prison'
  | 'ceremonial'
  | 'evacuation'
  | 'infrastructure'
  | 'storage'

/** How two spaces on different tiers are joined. */
export type LinkKind = 'stair' | 'lift' | 'bulkhead' | 'door'

/**
 * What kind of solid stands inside a room.
 *
 * - `spring` — one of the sprung mounts the hull carries the ship on.
 * - `casket` — a coffin in the burial chamber, and the reliquary at its centre.
 * - `platform` — a stage or a dais: floor raised above the floor.
 * - `counter` — a servery or a guard post: a run of desk you are kept behind.
 * - `table` — a table, from a refectory bench to a prince's dining table.
 * - `bed` — a bed or a bunk.
 * - `seat` — a sofa or an armchair.
 * - `cabinet` — a wardrobe, a sideboard, a bedside table.
 * - `basin` — a bath or a washstand.
 * - `painting` — a framed canvas: a solid hung off the floor.
 * - `window` — an opening onto the outside, of which the ship has two. It is a
 *   kind of its own and not a `painting` for the reason the two of them looked
 *   alike in the first place: hung off the floor, thin, rectangular, and the
 *   difference between them is the only thing about it that matters. Two hundred
 *   thousand people are carried to the Dark Continent behind 314 spaces, and
 *   exactly two of them can see out. That is a claim about the ship, so it is
 *   data — the kind is declared in `blueprint.json` and not derived from a size.
 * - `lifeboat` — an escape pod on its cradle in the launch bay.
 * - `pillar` — a post a panel draws, as opposed to the grid `columnPositions`
 *   lays under a hall too wide to roof without one.
 * - `bars` — a run of grille. A cell is not a room with a door in it: the
 *   detention plans draw the whole front of every cell in bars, and so does the
 *   plan of the high-security cell. The run is one solid to walk around and a
 *   row of uprights to look through, which is the whole point of a cell.
 * - `manacle` — the cuff and the wall bolt ch. 350 chains Beyond Netero by.
 *   Small, and kept for the same reason the coffins are: it is what the room is.
 * - `camera` — a lens on a bracket, watching a door. The warehouse plan draws
 *   one and says when it went up, which is the sort of thing the plan is for:
 *   who is watching the cargo, and since when.
 * - `duct` — a run of ducting and conduit under the deckhead. Hung clear of
 *   head height, so it is walked under rather than round. Ch. 366 draws the
 *   deckhead of bay 37564 bare: the services are what tells you the place is a
 *   hold with people in it and not a deck built to be lived on.
 * - `vent` — a louvred grille high on a wall, where the service run behind it
 *   comes out. Hung well clear of head height, like the ducting, and kept for
 *   the reason the manacle and the telephone are: ch. 367 puts Bill's cockroach
 *   into the sewers under the residential sector, and every prince it goes on to
 *   report on is seen through one of these, from just under the ceiling. The
 *   sector is fourteen suites behind fourteen doors that open nowhere else —
 *   `envelope` says exactly that — and the grille is the hole in that argument.
 *   It is what a room is in the same sense a cell is its bars: through the one
 *   in Prince Momoze's bedroom, ch. 368 has Queen Oito watch him be killed.
 * - `telephone` — the wall set a room is reached on. Small, and kept for the
 *   reason the manacle is: ch. 360 hangs one in Prince Woble's rooms, and it is
 *   standing at it that Kurapika calls Biscuit and learns what the beasts are.
 * - `mobile` — a nursery mobile hung over a cot. It is its own kind because it
 *   hangs inside the room rather than reading as a picture fixed to a wall.
 */
export type StructureKind =
  | 'spring'
  | 'casket'
  | 'platform'
  | 'counter'
  | 'table'
  | 'bed'
  | 'seat'
  | 'cabinet'
  | 'basin'
  | 'painting'
  | 'window'
  | 'lifeboat'
  | 'pillar'
  | 'bars'
  | 'manacle'
  | 'camera'
  | 'telephone'
  | 'mobile'
  | 'duct'
  | 'vent'

/**
 * What a level is: a deck of the ship, or the inside of a single room drawn at
 * its own scale.
 *
 * The deck plans are schematic — they say what adjoins what. The room plans are
 * detailed. A prince's apartment is seven rooms across some twenty metres, and
 * the box the deck plan gives it is twelve by seven: the two drawings are not
 * to the same scale and never were. Rather than distort one to fit the other,
 * the tour keeps both, and you walk from the deck into the room the way
 * `/ship` zooms from a tier map into a local one.
 */
export type LevelKind = 'deck' | 'interior'

export interface Tier {
  id: string
  kind: LevelKind
  /**
   * For an interior: the space on the deck it is the inside of. The deck keeps
   * showing that room as the plan draws it; this is what is behind the door.
   */
  parentSpaceId: string | null
  /**
   * For a deck of a tier that is more than one deck: the tier it belongs to.
   *
   * Tier 1 is not a floor, it is a liner sitting on the whale's back, and the
   * ch. 369 exterior shows it terraced a dozen levels. Only one of them has a
   * floor plan anyone has drawn — the chain of the King's quarters, the
   * reception hall and the princes' block — so the rest of what the ch. 349
   * cross-section merely *lists* under tier 1 stands on decks of its own.
   *
   * The catalogue is untouched by that: a passenger's deck is resolved from the
   * `tier-1-*` prefix of a location slug, not from here, so every recorded
   * position still reads tier 1. This says which decks are one tier when the
   * two drawings need to agree — the section groups them, and a tier that is a
   * deck in its own right leaves it `null`.
   */
  parentTierId: string | null
  /** The matching `data/locations` id, so the tour and the catalogue agree. */
  locationId: string | null
  name: string
  nameFr: string
  /** Floor height above the keel, in metres. */
  elevation: number
  /** Default floor-to-ceiling height for spaces that do not override it. */
  ceiling: number
  provenance: Provenance
  source: string
  sourceFr: string
  /** The outer hull at this tier, drawn as a reference outline. */
  hull: Polygon
}

export interface Space {
  id: string
  tierId: string
  /**
   * The catalogue location this space belongs to, or `null` when the tour
   * invented it. Several spaces may share one id: a lifeboat deck has a port
   * and a starboard half, and the catalogue holds a single record for both.
   */
  locationId: string | null
  name: string
  nameFr: string
  category: SpaceCategory
  provenance: Provenance
  source: string
  sourceFr: string
  /** Floor-to-ceiling height, or `null` to take the tier's default. */
  ceiling: number | null
  /**
   * The self-contained unit this space belongs to, or `null` if it stands on
   * its own.
   *
   * A prince's apartment is seven rooms behind one door. The apartment itself
   * stands free in the court the inner bulkhead encloses, so every wall of it
   * faces ground that is walked, and not one of those walls opens — a prince
   * reaches his suite through the numbered door assigned to him and nowhere
   * else. Naming the envelope says that once, instead of sealing thirty walls
   * one at a time: spaces in different envelopes never open onto each other
   * unless a door in `doors` says otherwise.
   */
  envelope: string | null
  footprint: Polygon
  /**
   * How far this floor sits above the deck's own, in metres. Omitted is level.
   *
   * A deck is one plane everywhere the plans are silent, and they are silent
   * almost everywhere. Where a panel draws a room in two levels, it is drawing
   * a *step*, not a storey: the banquet hall is entered at the service end and
   * goes up a flight to the floor the tables stand on. That cannot be said of a
   * single polygon — a footprint has one height — so the two levels are two
   * spaces, and this is what makes them two levels rather than two rooms side
   * by side. A difference big enough to climb rather than step is not this: it
   * is a `link`, and `validateBlueprint` says so.
   */
  floor?: number
  /**
   * A rectangle of this ceiling lifted clear of the rest, or omitted for a flat
   * one.
   *
   * The same argument as `floor`, one surface up. A hall drawn with a raised
   * lantern over its middle is not a hall with a higher ceiling: the height is
   * the point of the *centre*, and reading it as the height of the room loses
   * both the coffer and the scale it gives everything under it. `at` and `size`
   * are in the level's own frame, like a structure's.
   */
  lantern?: Lantern | null
}

/** A raised panel in a ceiling: where it is, how big, and how far it lifts. */
export interface Lantern {
  at: Vec2
  size: Vec2
  /** How far above the ceiling the panel sits. */
  rise: number
}

/**
 * A solid standing inside a space: seen, and walked around.
 *
 * Rooms are stored as empty outlines wherever nothing is drawn in them: the
 * tour does not invent furniture. Where something *is* drawn, it stands here.
 * A panel showing what a room is comes first — what a room *is* is often the
 * thing standing in it. The burial chamber is fourteen coffins set in a ring,
 * the banquet hall is its stage and the throne on its dais, and the space
 * between the hull and the ship is the springs that carry one inside the other.
 * Leaving those out would draw an empty drum, an empty shed and an empty hall,
 * and would quietly claim the panels show nothing.
 *
 * A structure is therefore geometry like any other, and carries its own source:
 * the room may rest on one chapter and what stands in it on another. The walls
 * of a structure go into the same list as the walls of the room, so a spring
 * you can see is a spring you have to walk around — unless it is hung clear of
 * head height, in which case you walk under it. A mezzanine, a theatre box, a
 * curtain over a proscenium: colliding with those on the floor would fence off
 * the very ground they are drawn above. `blocksTheFloor` draws that line.
 */
export interface Structure {
  id: string
  /** The space it stands in; its level follows from that space. */
  spaceId: string
  kind: StructureKind
  name: string
  nameFr: string
  /** Centre, in the coordinates of the level the space is on. */
  at: Vec2
  /** Full extent across `x` and `z` before rotation, in metres. */
  size: Vec2
  /** Turned about its own centre, in degrees. */
  rotation: number
  /**
   * How far it is off the floor, for something hung rather than stood: a
   * canvas on the wall, the window at the end of the King's salon. Zero for
   * anything resting on the floor, which is nearly everything.
   */
  base: number
  /** How far it stands, measured from `base`. */
  height: number
  /** Cut as a rounded solid of this many sides, or `null` for a rectangle. */
  sides: number | null
  provenance: Provenance
  source: string
  sourceFr: string
  /**
   * Authored surface colour when the panel identifies the object's material
   * or value unambiguously (a whiteboard is white, a cork board is ochre).
   * Omitted for black-and-white artwork whose chroma would be an invention.
   */
  colour?: number
  aura?: string
}

/**
 * A doorway placed by hand rather than centred on the shared wall.
 *
 * The room plans put their doors where they mean them — the servants' door in
 * the corner nearest the living room, not in the middle of the partition — and
 * an envelope's entrance has to be declared in any case, since nothing else
 * would open it.
 */
export interface DoorOverride {
  a: string
  b: string
  /** Centre of the opening, in ship metres. It is projected onto the wall. */
  at: Vec2
  width: number
  reason: string
  reasonFr: string
}

/** A vertical connection. Unlike a doorway it carries its own position. */
export interface Link {
  from: string
  to: string
  kind: LinkKind
  /** Where the link is, in `from`'s coordinates. */
  at: Vec2
  /**
   * Where it comes out, in `to`'s coordinates. A stairwell sits above its own
   * footprint and needs only `at`; a door into an interior does not, because
   * the interior has an origin of its own.
   */
  atTo?: Vec2
  provenance: Provenance
  source: string
  sourceFr: string
}

/**
 * A party wall two spaces share without a door through it.
 *
 * The queens' rooms sit side by side down their corridor and open only onto it;
 * the princes' sector is closed by a wall at its aft end, where the guards'
 * round runs up against the promenade. Since the tour derives its doorways from
 * shared walls, that has to be stated, and stating it is the
 * point: a blind wall between two rooms is a claim about the ship, so it
 * carries a reason like everything else here.
 */
export interface Seal {
  a: string
  b: string
  reason: string
  reasonFr: string
}

export interface Blueprint {
  meta: {
    unit: string
    scale: string
    origin: string
    note: string
  }
  tiers: Tier[]
  spaces: Space[]
  links: Link[]
  seals: Seal[]
  doors: DoorOverride[]
  structures: Structure[]
}

/**
 * A gap in a shared wall. Doorways are not stored in the blueprint: two spaces
 * that share a stretch of wall are joined, and one that shares nothing is
 * sealed. That way a hand edit to a footprint cannot leave a door hanging in
 * mid-air, and an unreachable room is a validation failure rather than a
 * surprise at runtime.
 */
export interface Doorway {
  tierId: string
  a: string
  b: string
  /** The two ends of the opening, on the shared wall. */
  start: Vec2
  end: Vec2
  width: number
}

/** A stretch of wall left standing once the doorways are cut out of it. */
export interface WallSegment {
  spaceId: string
  start: Vec2
  end: Vec2
  /**
   * Set when the segment is a face of a solid standing in the room rather than
   * a wall of the room itself.
   *
   * Collision reads the whole list, which is the point: a coffin stops you the
   * way a bulkhead does. The renderer must not, though — a wall is extruded to
   * the ceiling, and a bed drawn that way is a partition. The structure pass
   * raises these to their own height instead.
   */
  structureId?: string
  /**
   * Set when the segment is the cheek of a doorway rather than a wall, keyed by
   * the pair of rooms the opening joins.
   *
   * The same bargain as `structureId`, for the same reason: collision has to know
   * about it — you cannot cut the corner of a doorframe — and the renderer must
   * not extrude it to the ceiling, because a jamb stops at head height and the
   * doorway pass draws it there. See `doorJambs`.
   */
  jambOf?: string
}
