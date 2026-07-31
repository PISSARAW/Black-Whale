/**
 * What Nen puts in the room, as things rather than as state.
 *
 * `$lib/tour/hatsu` says what a technique did; the scene says how the ship
 * looks. Between the two there was a gap: half the fourth and fifth waves
 * changed a field nobody drew, so casting them was a sentence in the read-out
 * and nothing in the walk — an owl attached to no perch, a tunnel with no
 * mouth, a card laid on a room that never showed a card.
 *
 * This is that missing middle, and it is deliberately not three.js. It reads
 * the world and answers with a list of apparitions: what stands where, how big,
 * how high off the deck, in what colour, and whether it takes Gyo to see. The
 * scene builds a mesh per entry and moves it; it never asks what a technique is
 * called. Everything here is pure, so what the walk shows can be tested without
 * a canvas.
 */
import { ceilingOf, floorOf, type Ship } from './blueprint'
import { centroid, solidById, solidNow, type TourReport, type TourWorld } from './hatsu'
import type { Space, Vec2 } from './types'

export type ApparitionKind =
  /** Musse's owl, perched where Secret Window attached it. */
  | 'owl'
  /** Mizaistom's card, laid on the room: blue, yellow, then red. */
  | 'card'
  /** Beyond's mark, on the victim and on the sacrifice hidden among its own. */
  | 'mark'
  /** Benjamin's palm star, over a room whose Hatsu the baton took. */
  | 'star'
  /** Kacho's double, standing in the room it was left to guard. */
  | 'double'
  /** One mouth of Fugetsu's tunnel. */
  | 'portal'
  /** One of Chrollo's fish, swimming the room it was loosed in. */
  | 'fish'
  /** One of Kalluto's dolls, stuck to something in the room it watches. */
  | 'paper'
  /** Cargo a relay is holding, waiting to be advanced to the next one. */
  | 'cargo'

/**
 * One thing Nen has left standing in the ship.
 *
 * `id` is stable across frames — the scene keys its meshes on it, so a card
 * that goes from blue to yellow is the same card turned over rather than a new
 * one built and the old one thrown away.
 */
export interface Apparition {
  id: string
  kind: ApparitionKind
  spaceId: string
  tierId: string
  /** Where it stands, in the coordinates of the deck it is on. */
  at: Vec2
  /** How high its centre is, in metres above sea level, like every other Y. */
  y: number
  /** Its size in metres: what that measures is the kind's own business. */
  size: number
  /** What it is drawn in, as three.js takes a colour. */
  colour: number
  /** How far the technique has got: the card's three stages, and nothing else. */
  stage: number
  /**
   * Whether only Gyo shows it.
   *
   * One thing in the walk is deliberately hidden — the sacrifice Beyond chose
   * among the victim's own — and Emperor Time is what finds it, exactly as the
   * technique says. The scene draws it faintly rather than not at all when the
   * ship is laid open.
   */
  hidden: boolean
  /** The other mouth of the tunnel, for the portal that has to see through it. */
  pair?: { spaceId: string; tierId: string; at: Vec2; y: number }
  /**
   * How far from `at` the thing may wander, in metres.
   *
   * Only the fish have one: everything else in this list is nailed to a point,
   * and an aquarium is the size of the room it is in.
   */
  spread?: number
}

/** The colours the techniques are already published in, as numbers. */
const OWL = 0xa8b7d8
const CARDS = [0x4d8ff0, 0xf0c94d, 0xe5484d]
const CURSE = 0x9d65d0
const STAR = 0xffd166
const DOUBLE = 0xf6b8d1
const PORTAL = 0x80edc7
const FISH = 0x78b6c9
const PAPER = 0xefb9c8
const CARGO = 0xe2b86e
/** Rising Sun is the one technique whose colour is a temperature. */
export const SUN = 0xf2a63b

/** How many fish a room gets, whatever its size. A shoal, not a census. */
export const SHOAL = 7
/** How many dolls a room gets over and above one per thing standing in it. */
const LOOSE_DOLLS = 5
/** Air Blow is a palm blast of pale air; Remote Punch is a fist of blue aura. */
export const GUST = 0xc6f1ff
export const PUNCH = 0x55a7ff

/** How wide a mouth of the tunnel stands, in metres. A door, not a gate. */
export const PORTAL_RADIUS = 1.15

/**
 * How close is close enough to have stepped into the tunnel.
 *
 * Slightly wider than the mouth itself: the walk is a camera at head height and
 * the ring is a disc on the floor, so a visitor who has walked into it is
 * measured against where their feet are, and a hair of margin is what stops a
 * shoulder passing through a doorway nobody meant to take.
 */
export const PORTAL_REACH = PORTAL_RADIUS + 0.35

/**
 * How far from the middle of a room something loose in it may get.
 *
 * The short side of the footprint's box, halved and pulled in: a shoal that
 * swims the long axis of the promenade and comes out through the bulkhead is
 * not swimming the room. Floored, so the smallest cabin still has an aquarium.
 */
function roamOf(space: Space): number {
  const xs = space.footprint.map((corner) => corner[0])
  const zs = space.footprint.map((corner) => corner[1])
  const short = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs))
  return Math.max(1.2, Math.min(9, short * 0.35))
}

/** The floor and the headroom of a room, both in metres above sea level. */
function room(ship: Ship, space: Space) {
  const tier = ship.tiers.find((candidate) => candidate.id === space.tierId)
  if (!tier) return null
  const floor = floorOf(space, tier)
  return { floor, ceiling: floor + ceilingOf(space, tier), at: centroid(space) }
}

/**
 * Every apparition in the ship, wherever it is.
 *
 * Not filtered to the deck being walked: the aura shells already draw a hold
 * four decks down, and the scene culls these against the geometry it has in it
 * rather than against a list of rooms. Order is stable, which is what lets the
 * scene diff frame to frame.
 */
export function apparitionsOn(ship: Ship, world: TourWorld): Apparition[] {
  const found: Apparition[] = []

  const place = (
    id: string,
    kind: ApparitionKind,
    space: Space,
    height: number,
    size: number,
    colour: number,
    extra: Partial<Apparition> = {},
  ) => {
    const measured = room(ship, space)
    if (!measured) return
    found.push({
      id,
      kind,
      spaceId: space.id,
      tierId: space.tierId,
      at: measured.at,
      // Never through the deckhead: a cabin with 2,2 m of headroom gets its owl
      // under the beam rather than in the deck above it.
      y: Math.min(measured.floor + height, measured.ceiling - 0.25),
      size,
      colour,
      stage: 0,
      hidden: false,
      ...extra,
    })
  }

  const spaceOf = (id: string | null | undefined) => (id ? (ship.spaces.get(id) ?? null) : null)

  // The bird, perched as high as the room allows: it is eavesdropping through
  // the ceiling, so it sits where it would have to sit to do that.
  const perch = spaceOf(world.owl)
  if (perch) place(`owl:${perch.id}`, 'owl', perch, 2.6, 0.34, OWL)

  // The cards, one apparition that carries how far the tribunal has got: blue
  // admitted, yellow restrained, red dismissed.
  for (const [spaceId, stage] of Object.entries(world.cards)) {
    const space = spaceOf(spaceId)
    if (!space || !stage) continue
    place(`card:${spaceId}`, 'card', space, 1.5, 0.42, CARDS[Math.min(2, stage - 1)], { stage })
  }

  // The victim wears its mark openly. The sacrifice among its own wears one
  // too, and only Emperor Time shows it — which is the whole cruelty of it.
  const victim = spaceOf(world.curse?.victim)
  if (victim) place(`mark:${victim.id}`, 'mark', victim, 2, 0.55, CURSE)
  const sacrifice = spaceOf(world.curse?.sacrifice)
  if (sacrifice && sacrifice.id !== victim?.id) {
    place(`mark:${sacrifice.id}`, 'mark', sacrifice, 2, 0.4, CURSE, { hidden: !world.laidOpen })
  }

  for (const spaceId of world.stars) {
    const space = spaceOf(spaceId)
    if (space) place(`star:${spaceId}`, 'star', space, 2.4, 0.45, STAR)
  }

  // Kacho stands rather than floats: she is a person, and the one apparition
  // in the walk whose height is a person's height.
  const guarded = spaceOf(world.double)
  if (guarded) place(`double:${guarded.id}`, 'double', guarded, 0.9, 0.9, DOUBLE)

  // Everything standing in a room, as the aura currently leaves it: the dolls
  // stick to it and the fish eat it, so both have to see what is actually there
  // rather than what the blueprint says was.
  const standingIn = (spaceId: string) =>
    [...ship.structures, ...world.copies]
      .filter((solid) => solid.spaceId === spaceId && !world.solids[solid.id]?.gone)
      .map((solid) => solidNow(solid, world.solids[solid.id]))

  // The fish swim the room rather than sitting in it, so what they are given is
  // the room's own reach and an index each; the scene does the swimming.
  for (const spaceId of world.devouring) {
    const space = spaceOf(spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    const reach = roamOf(space)
    for (let i = 0; i < SHOAL; i++) {
      place(`fish:${spaceId}:${i}`, 'fish', space, 1.5 + (i % 3) * 0.45, 0.4, FISH, {
        stage: i,
        spread: reach,
      })
    }
  }

  // A doll on everything in the room, and a handful more in the air: what
  // Kalluto throws is a fistful of paper, and it sticks where it lands.
  for (const doll of world.watched) {
    const space = spaceOf(doll.spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    const stuck = standingIn(space.id)
    stuck.forEach((solid, i) => {
      found.push({
        id: `paper:${space.id}:${solid.id}`,
        kind: 'paper',
        spaceId: space.id,
        tierId: space.tierId,
        at: solid.at,
        y: Math.min(measured.floor + 1.1, measured.ceiling - 0.3),
        size: 0.16,
        colour: PAPER,
        stage: i,
        hidden: false,
      })
    })
    const reach = roamOf(space)
    for (let i = 0; i < LOOSE_DOLLS; i++) {
      // Fanned around the middle of the room on a fixed spiral: a fistful of
      // paper thrown twice lands the same way, because the walk has to be able
      // to draw the same room twice.
      const angle = (i / LOOSE_DOLLS) * Math.PI * 2
      const radius = reach * (0.3 + (i % 3) * 0.22)
      found.push({
        id: `paper:${space.id}:loose${i}`,
        kind: 'paper',
        spaceId: space.id,
        tierId: space.tierId,
        at: [measured.at[0] + Math.cos(angle) * radius, measured.at[1] + Math.sin(angle) * radius],
        y: Math.min(measured.floor + 1.4 + (i % 2) * 0.5, measured.ceiling - 0.3),
        size: 0.16,
        colour: PAPER,
        stage: stuck.length + i,
        hidden: false,
      })
    }
  }

  // Cargo a relay has taken and not yet advanced. `pairing` is shared by every
  // technique that joins two things, so it is only cargo while the relay is the
  // aura being held.
  const cargo = world.holding === 'relay' ? solidById(ship, world, world.pairing) : null
  const cargoRoom = cargo ? spaceOf(cargo.spaceId) : null
  const cargoMeasured = cargoRoom ? room(ship, cargoRoom) : null
  if (cargo && cargoRoom && cargoMeasured) {
    found.push({
      id: `cargo:${cargo.id}`,
      kind: 'cargo',
      spaceId: cargoRoom.id,
      tierId: cargoRoom.tierId,
      at: solidNow(cargo, world.solids[cargo.id]).at,
      y: Math.min(cargoMeasured.floor + 1.8, cargoMeasured.ceiling - 0.3),
      size: 0.4,
      colour: CARGO,
      stage: 0,
      hidden: false,
    })
  }

  const mouths = wormMouths(ship, world)
  for (const mouth of mouths) {
    const other = mouths.find((end) => end.spaceId !== mouth.spaceId)
    const space = spaceOf(mouth.spaceId)
    if (!space) continue
    place(`worm:${mouth.spaceId}`, 'portal', space, PORTAL_RADIUS + 0.1, PORTAL_RADIUS, PORTAL, {
      y: mouth.y,
      pair: other,
    })
  }

  return found
}

/**
 * Where the two ends of Fugetsu's tunnel stand.
 *
 * The middle of the room, at head height: a door has to be somewhere a visitor
 * can walk into, and the centre is the one point of a room the walk can always
 * name without a second value in the world. A half-placed tunnel has one end
 * and cannot be crossed, so it is listed but never paired.
 */
export function wormMouths(
  ship: Ship,
  world: TourWorld,
): { spaceId: string; tierId: string; at: Vec2; y: number }[] {
  const worm = world.worm
  if (!worm) return []
  const mouths: { spaceId: string; tierId: string; at: Vec2; y: number }[] = []
  for (const id of [worm.a, worm.b]) {
    const space = id ? ship.spaces.get(id) : null
    const measured = space ? room(ship, space) : null
    if (!space || !measured) continue
    mouths.push({
      spaceId: space.id,
      tierId: space.tierId,
      at: measured.at,
      y: Math.min(measured.floor + PORTAL_RADIUS + 0.1, measured.ceiling - 0.3),
    })
  }
  return mouths
}

/**
 * Which mouth of the tunnel the visitor has walked into, if either.
 *
 * The walk used to teleport anyone who set foot in the room, which meant a
 * tunnel you could not stand beside and could not choose to take. Now it is the
 * doorway itself that has to be crossed: the visitor's own position against the
 * mouth on the deck they are on.
 */
export function wormMouthAt(ship: Ship, world: TourWorld, tierId: string, at: Vec2): string | null {
  for (const mouth of wormMouths(ship, world)) {
    if (mouth.tierId !== tierId) continue
    if (Math.hypot(mouth.at[0] - at[0], mouth.at[1] - at[1]) <= PORTAL_REACH) return mouth.spaceId
  }
  return null
}

/**
 * The two techniques that are an event rather than a thing.
 *
 * A blast and a punch leave nothing standing: they happen, they are seen, and
 * they are over. So they are not in the world at all — the page reads what the
 * cast reported and hands the scene one of these, which it plays out and
 * forgets. `from` is where the aura came out of the visitor, so the gust has a
 * direction to travel in.
 */
export interface TourFlash {
  kind: 'gust' | 'punch' | 'sun'
  tierId: string
  at: Vec2
  /** The floor it comes out of, or the height it lands at, in metres. */
  y: number
  from?: Vec2
  colour: number
  /** How far it reaches: the sun's radius, in metres. */
  metres?: number
}

/**
 * What the walk should show for what just happened, or nothing.
 *
 * Only the two techniques whose whole substance is the moment of the cast: Air
 * Blow, which strips a room from across the ship and moves nothing, and Remote
 * Punch, whose aura runs along the floor and comes up under something else.
 */
export function flashFor(
  report: TourReport | null,
  ship: Ship,
  world: TourWorld,
  from: Vec2,
): TourFlash | null {
  if (!report) return null

  if (report.kind === 'stripped') {
    const space = ship.spaces.get(report.spaceId)
    const measured = space ? room(ship, space) : null
    if (!space || !measured) return null
    return {
      kind: 'gust',
      tierId: space.tierId,
      at: measured.at,
      y: Math.min(measured.floor + 1.4, measured.ceiling - 0.3),
      from,
      colour: GUST,
    }
  }

  // The sun rises on the visitor rather than on a room: Feitan does not throw
  // it, he becomes it, so it is centred where they are standing and its radius
  // is whatever the wrapping had taken.
  if (report.kind === 'sun-risen') {
    return {
      kind: 'sun',
      tierId: '',
      at: from,
      y: 0,
      colour: SUN,
      metres: report.metres,
    }
  }

  if (report.kind === 'came-up-under') {
    const struck = solidById(ship, world, report.otherId)
    const space = struck ? ship.spaces.get(struck.spaceId) : null
    const measured = space ? room(ship, space) : null
    if (!struck || !space || !measured) return null
    return {
      kind: 'punch',
      tierId: space.tierId,
      at: solidNow(struck, world.solids[struck.id]).at,
      y: measured.floor,
      colour: PUNCH,
    }
  }

  return null
}
