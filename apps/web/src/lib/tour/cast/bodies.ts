/**
 * What is currently being done to the people in the room, and for how long.
 *
 * A second, tiny world, kept outside `TourWorld` on purpose — ADR-004 §2.3 puts
 * the whole doctrine in that separation. `TourWorld` is what the visitor has
 * done to the *ship*, and a coffin pushed across the burial chamber stays
 * pushed. A body is not a coffin: it belongs to the canon, the canon says what
 * happened to it, and the walk is a visit rather than a rewriting. So every
 * hold here carries its own end, and three things end it early:
 *
 * - the clock, when `until` passes;
 * - walking out, because a technique the visitor is no longer standing next to
 *   is one nobody can check;
 * - dropping the aura, since every one of these is a held technique.
 *
 * The consequence worth stating: there is no way, from this module, to leave a
 * mark on somebody. It has no delete-resistant field, no `postMortem`, and no
 * way to say a body is hurt — `BODY_STATE_CHANGED` is the world engine's, and
 * the walk does not emit it. A future simulation branch that wants durable
 * consequences consumes this; it does not extend it.
 */
import type { BodyKind } from '../bodyKinds'

/**
 * What a hold looks like, rather than which technique made it.
 *
 * Six of them for seventeen kinds, because the scene and the readouts want to
 * know what is happening to the body, not whose ability is happening to it: a
 * bound man is drawn the same whether the thread is Machi's or the chain is
 * Kurapika's, and the ability's own name is already on the panel.
 */
export type BodyMark =
  /** Held in place: Bungee Gum, Chain Jail, Nen Stitches. */
  | 'bound'
  /** Acting on somebody else's order: Needle People, Black Voice, Order Stamp. */
  | 'controlled'
  /** Wearing something that is not their face: Texture Surprise, Grimmel. */
  | 'masked'
  /** Carrying a mark that is waiting for a condition: the curses and the vows. */
  | 'marked'
  /** Aura put into them rather than onto them: Enchanting Music, Holy Chain. */
  | 'soothed'
  /** Joined to the visitor: Damage: Sweet Home. */
  | 'linked'

/** One thing being done to one body, with its end already written. */
export interface BodyHold {
  characterId: string
  kind: BodyKind
  mark: BodyMark
  /** When it was laid, on the page's own clock, in milliseconds. */
  since: number
  /** When it lifts. Never absent: a hold with no end is not one this walk lays. */
  until: number
}

/** Everything held on everybody, at one moment. */
export interface BodiesWorld {
  holds: readonly BodyHold[]
}

/** Nobody is being held: the state the walk is in nearly all of the time. */
export const NO_BODIES: BodiesWorld = { holds: [] }

/**
 * How long a hold lasts, by what it is, in milliseconds.
 *
 * Staging rather than canon, and they are written here as constants for the
 * reason ADR-003 §2.3 gives for the conduct's own numbers: a duration is how
 * the walk stages a thing, and staging a thing is not asserting it. They are
 * short because the honest length of every one of them is "until the scene
 * moves on", and a walk is nothing but the scene moving on.
 */
export const HOLD_SECONDS: Record<BodyMark, number> = {
  bound: 12,
  controlled: 15,
  masked: 20,
  marked: 30,
  soothed: 18,
  linked: 25,
}

/** What is being held on this body, or null. One at a time, newest wins. */
export function holdOn(world: BodiesWorld, characterId: string | null): BodyHold | null {
  if (!characterId) return null
  return world.holds.find((hold) => hold.characterId === characterId) ?? null
}

/** Whether anything at all is holding this body. */
export function isHeld(world: BodiesWorld, characterId: string | null): boolean {
  return holdOn(world, characterId) !== null
}

/**
 * Lay a hold, replacing whatever that body was already under.
 *
 * One hold per body rather than a stack: two techniques on one person is a
 * question about how they combine, the manga answers it case by case, and the
 * walk has no business inventing a general rule. The newest wins, which is at
 * least what the visitor just did.
 */
export function lay(world: BodiesWorld, hold: BodyHold): BodiesWorld {
  return {
    holds: [...world.holds.filter((held) => held.characterId !== hold.characterId), hold],
  }
}

/** The hold a technique lays on a body, dated from now. */
export function holdFor(
  characterId: string,
  what: { kind: BodyKind; mark: BodyMark },
  now: number,
): BodyHold {
  return {
    characterId,
    kind: what.kind,
    mark: what.mark,
    since: now,
    until: now + HOLD_SECONDS[what.mark] * 1000,
  }
}

/** Everything still standing at this moment, and nothing that is not. */
export function expire(world: BodiesWorld, now: number): BodiesWorld {
  const standing = world.holds.filter((hold) => hold.until > now)
  return standing.length === world.holds.length ? world : { holds: standing }
}

/**
 * Let go of everybody.
 *
 * Called when the aura comes down and when the visitor leaves the room. Not a
 * cleanup detail: it is the mechanism by which §2.3's promise is kept without
 * anybody having to remember to keep it — there is no path through the walk
 * that ends with a body still held by somebody who is not there.
 */
export function releaseBodies(world: BodiesWorld): BodiesWorld {
  return world.holds.length === 0 ? world : NO_BODIES
}

/** How far through its life a hold is, from 0 to 1, for the scene to draw. */
export function holdProgress(hold: BodyHold, now: number): number {
  const span = hold.until - hold.since
  if (span <= 0) return 1
  return Math.min(1, Math.max(0, (now - hold.since) / span))
}
