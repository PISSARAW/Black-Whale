/**
 * Aim at a thing, and be handed its proof.
 *
 * The walk has always been able to say *where* it got a room from — the badge
 * in the corner, the legend in `TourProvenancePanel`, the whole of
 * `/tour/sources`. What it could not do is answer the question a visitor
 * actually has, which is asked about one object and not about a category: not
 * "what does gold mean", but "why is *that* pillar there".
 *
 * Both proposals wanted an interaction on the aimed object, and both proposed
 * the wrong one — a door that swings, a sound, a highlight. The reconstruction
 * has no drawn door leaf and no recorded sound, so either would be an invention
 * bolted onto the one part of the walk whose entire purpose is not to invent.
 * The honest interaction is the one the ship can actually perform: hand over
 * the exhibit. Every solid on board already carries its chapter, its
 * provenance, its measured size and the room it stands in; all that was missing
 * was the gesture for asking.
 *
 * Nothing here reads three.js, and nothing here picks the target: the walk
 * already knows what is down the reticle — `aimedSolid()` on the scene, mirrored
 * out as `aimedSolidAt` — so this takes a thing and returns a card. That keeps
 * the interesting half testable, and it keeps the promise of the plan that no
 * second raycaster is added to a walk that already has one.
 */
import { ceilingOf } from './blueprint'
import type { Ship } from './blueprint'
import { extentOf } from './describe'
import { structureFootprint } from './geometry'
import type { Provenance, Space, Structure, StructureKind } from './types'

/** How the card is worded, in the language being read. */
export interface ExhibitWords {
  nameOf: (entity: { name: string; nameFr: string }) => string
  sourceOf: (entity: { source: string; sourceFr: string }) => string
  /** The provenance badge: the same four words the legend uses. */
  badge: (provenance: Provenance) => string
  /**
   * What a solid of this kind asserts about the ship.
   *
   * The doctrinal half of the card, and the reason it is a table by kind rather
   * than a sentence per object: what a pillar claims is a property of *being a
   * pillar* in this reconstruction — a roof with nothing under it would be a
   * false statement — and it is the same claim under every one of them.
   */
  claim: (kind: StructureKind) => string
  /** What a room asserts, for the case where nothing solid is in front of you. */
  roomClaim: string
  /** "9,2 × 2,4 m, 1,1 m tall" */
  measured: (long: number, wide: number, height: number) => string
  /** "Tier 1 — Banquet Hall" */
  standingIn: (room: string) => string
}

/**
 * One thing, with everything the reconstruction can prove about it.
 *
 * A flat record rather than a component's props: the same card is wanted in the
 * overlay, and would be wanted in a screen reader's announcement and in a test,
 * and none of those three should have to know how the other two lay it out.
 */
export interface Exhibit {
  id: string
  title: string
  /** The badge, and the value behind it so a caller can colour by it. */
  provenance: Provenance
  badge: string
  /** The chapter and what it draws, in the visitor's language. */
  source: string
  /** What this thing asserts about the ship. */
  claim: string
  /** Its measured extent, or `null` for a room — a room says its own size. */
  measured: string | null
  /** The room it stands in, and the deck, or `null` when it *is* the room. */
  standingIn: string | null
}

/** The exhibit for one solid: the case this feature exists for. */
export function solidExhibit(ship: Ship, structure: Structure, words: ExhibitWords): Exhibit {
  const { long, wide } = extentOf(structureFootprint(structure))
  const room = ship.spaces.get(structure.spaceId)
  return {
    id: structure.id,
    title: words.nameOf(structure),
    provenance: structure.provenance,
    badge: words.badge(structure.provenance),
    source: words.sourceOf(structure),
    claim: words.claim(structure.kind),
    measured: words.measured(round(long), round(wide), round(structure.height)),
    standingIn: room ? words.standingIn(words.nameOf(room)) : null,
  }
}

/**
 * The exhibit for a room, for when there is nothing solid down the reticle.
 *
 * Not a fallback so much as the other half of the same answer: standing in a
 * bare corridor and asking what is in front of you, the thing in front of you
 * is the corridor, and it has a chapter behind it exactly as a coffin does.
 */
export function spaceExhibit(ship: Ship, space: Space, words: ExhibitWords): Exhibit {
  const tier = ship.tiers.find((candidate) => candidate.id === space.tierId)
  const { long, wide } = extentOf(space.footprint)
  return {
    id: space.id,
    title: words.nameOf(space),
    provenance: space.provenance,
    badge: words.badge(space.provenance),
    source: words.sourceOf(space),
    claim: words.roomClaim,
    measured: tier ? words.measured(round(long), round(wide), round(ceilingOf(space, tier))) : null,
    standingIn: null,
  }
}

/**
 * What the visitor gets for asking, given what they are aiming at.
 *
 * The solid wins over the room it stands in, because aiming *at* something is
 * how the visitor says which of the two they meant. `null` only when they are
 * nowhere the blueprint has a footprint for — out in the hull between rooms —
 * and there the honest answer is that there is nothing to show.
 */
export function examine(
  ship: Ship,
  aim: { solid: Structure | null; space: Space | null },
  words: ExhibitWords,
): Exhibit | null {
  if (aim.solid) return solidExhibit(ship, aim.solid, words)
  if (aim.space) return spaceExhibit(ship, aim.space, words)
  return null
}

/**
 * Metres to one decimal, and no further.
 *
 * The blueprint holds centimetres because doorways are derived from wall
 * geometry and a centimetre of drift closes a room. None of that precision is a
 * *measurement* — it is the arithmetic of a reconstruction — and printing
 * `9.24 m` on a card headed "what we can prove" would claim two digits the
 * manga never gave.
 */
function round(metres: number): number {
  return Math.round(metres * 10) / 10
}
