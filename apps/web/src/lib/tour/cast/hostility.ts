/**
 * Which rooms of the ship are dangerous to stand in.
 *
 * `Situation.hostileRooms` was the one field of the cast's conduct that nothing
 * filled: the walk knew when the visitor was casting and never what the visitor
 * had *left standing*. Those are different facts, and the second is the one a
 * guard reacts to for as long as it is there rather than for the second it was
 * made.
 *
 * The whole of the judgement is one question asked of each candidate — does
 * this thing, in this room, endanger a body standing in it? — and the answer is
 * no far more often than the roster of techniques suggests. Three families are
 * refused outright, and each refusal is the same argument the walk has already
 * made somewhere else:
 *
 * - **Surveillance.** The owl through the ceiling, Kalluto's paper dolls,
 *   Sayird's insect. Making a room bristle because it is being listened to
 *   would hand out a detector for espionage built to be undetectable, which is
 *   exactly why a body in Zetsu wears no refractive shell (`auraRefraction`).
 *   Being watched is not being endangered.
 * - **The Guardian Spirit Beasts.** `conduite.ts` §2.4 has already settled it:
 *   a beast in a salon is present and dormant. Reopening that here would be
 *   this module relitigating a decided question — and it would need to guess
 *   allegiance from a role string besides, since Camilla's medusa is no threat
 *   at all to Camilla's own guard.
 * - **What the visitor is doing right now.** Already carried, by
 *   `Situation.visitorCasting`, and counting it twice would raise a room for
 *   one cast and then again for the mark it left.
 *
 * What is left is four things that are dangerous by their own definition, and
 * every one of them is already a field of `TourWorld` keyed by room, which is
 * what makes this a projection rather than a rule.
 */
import { solidById, type TourWorld } from '../hatsu'
import type { Ship } from '../blueprint'

/**
 * The third of Cross Game's cards.
 *
 * Blue admits, yellow restrains, red dismisses — the escalation is already
 * encoded in the number, so this reads only the last of the three. A room
 * somebody has been admitted to is not a room in danger.
 */
export const DISMISSAL_CARD = 3

/**
 * The rooms something hostile is standing in, at this state of the ship.
 *
 * Pure, and a projection of `TourWorld` alone: nothing is stored, so a room
 * stops being dangerous the moment the state that made it dangerous is gone,
 * without anybody having to remember to clear it.
 */
export function hostileRooms(ship: Ship, world: TourWorld): string[] {
  const found = new Set<string>()

  // Silent Majority's serpents, loose in the rooms they were loosed in. Four
  // of them, and what they do to a body is drain it: there is nothing to
  // interpret here, and `fed` does not enter into it — a room whose snakes have
  // already had somebody is not a safer room.
  for (const spaceId of world.snakes?.rooms ?? []) found.add(spaceId)

  // Luzurus's bait. A room that has materialized somebody's desire in order to
  // close on them is dangerous for as long as the bait is uneaten, which is
  // exactly as long as the field holds a room.
  if (world.trap) found.add(world.trap)

  // The red card: a standing order that whoever is in this room is to be put
  // out of it.
  for (const [spaceId, stage] of Object.entries(world.cards)) {
    if (stage >= DISMISSAL_CARD) found.add(spaceId)
  }

  // And what the chimera's third contact left standing where a fitting used to
  // be. The one manifestation in the walk that is nobody's guardian and was
  // nobody's furniture, so it needs no allegiance and admits no exception.
  for (const [id, hold] of Object.entries(world.solids)) {
    if (!hold.monster) continue
    const was = solidById(ship, world, id)
    if (was) found.add(was.spaceId)
  }

  return [...found]
}
