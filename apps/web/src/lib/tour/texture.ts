/**
 * Texture Surprise, as the walk is allowed to perform it.
 *
 * A leaf: it reads the blueprint's own vocabulary and nothing else, so
 * `hatsu.ts` and `lib/tour/cast/` can both consult it without either importing
 * the other — the same argument `bodyKinds.ts` makes, and for the same reason.
 *
 * What the catalogue gives the technique is one line: an aura layer over a flat
 * limited surface, which changes the look and nothing underneath, and which the
 * touch gives away (`abilities.json` → `texture-surprise`). Everything below is
 * a reading of that line and of the two chapters that draw it. Nothing here
 * invents a use.
 *
 * **The layer is not a tell.** The crate that becomes an armchair in ch. 61 is
 * not a crate with a pink glow on it: it is an armchair to everybody in the
 * room, and the whole reason it works on Hunters is that there is no aura to
 * find — Gyo shows a chair, In has nothing to hide because nothing is showing.
 * The walk used to tint a forged solid pink, which handed every visitor a
 * detector the manga is explicit about not having, and made the technique
 * announce itself in the one situation it exists to survive. So the layer is
 * carried as a record (`SolidHold.forged`) and drawn as nothing at all.
 *
 * What still gives it away is what gives it away in the manga: the thing
 * underneath goes on being what it was. A forged coffin stops you exactly where
 * a coffin stopped you, it measures what it measured, and it carries its own
 * chapter on its card. That is the touch, and it is the only reveal the walk
 * offers.
 */
import type { StructureKind } from './types'

/**
 * The appearances a surface is cycled through.
 *
 * Every one of them is a kind the blueprint already draws, which is what keeps
 * the forgery inside the ship: a caisse can look like the seat in the salon
 * next door because the reconstruction has a seat to copy. It could not look
 * like something nobody has drawn, and there is no entry here for one.
 */
export const FORGERIES: StructureKind[] = [
  'painting',
  'cabinet',
  'bars',
  'basin',
  'casket',
  'bed',
  'seat',
  'table',
  'spring',
  'platform',
  'counter',
  'window',
  'pillar',
  'manacle',
  'camera',
  'telephone',
  'duct',
  'vent',
]

/** The next face this surface wears, one press of the key at a time. */
export function nextForgery(current: StructureKind): StructureKind {
  return FORGERIES[(FORGERIES.indexOf(current) + 1) % FORGERIES.length]!
}

/**
 * The solids that offer nothing to lay a mask on.
 *
 * The catalogue states the limit in the same breath as the technique — a flat
 * surface, and a limited one — and the walk had been ignoring half of it: every
 * solid aboard took the mask, including the ones the blueprint draws round.
 *
 * These five are the round ones. A pillar and a coil have no flat face at all;
 * a basin is a curve by definition; a rail and a manacle are a bent bar, which
 * is the railing of ch. 61's own limitation read into the ship the walk
 * actually has. Everything else the blueprint draws is a panel, a top or a
 * front, and a mask goes on it.
 *
 * A list rather than a flag on the structure, because it is a fact about what
 * the *kind* is shaped like and the blueprint has no other use for it. The
 * `FORGERIES` list above is a different axis and stays as it is: what a mask
 * may *depict* is unbounded — the crate becomes an armchair — and what it may
 * be *painted on* is not.
 */
export const CURVED: readonly StructureKind[] = ['pillar', 'spring', 'basin', 'bars', 'manacle']

/** Whether this solid presents the flat, limited surface the mask needs. */
export const takesAMask = (kind: StructureKind): boolean => !CURVED.includes(kind)

/**
 * The number a door's plaque is made to read.
 *
 * A cabin number is a flat, limited surface with writing on it, which is the
 * technique's own description of what it takes — so the walk lets the mask go
 * on a doorway as readily as on a cabinet, and what changes is the one thing a
 * plaque carries. The nature of the room does not change and neither does its
 * card: the archive goes on knowing which room this is, and only the reader
 * standing in the corridor is fooled, which is the whole shape of ch. 61.
 *
 * It cycles through the other rooms of the same deck and then off again, so
 * there is a way back to the true number that is not a second key. The end of
 * the cycle is `null` rather than the room's own id, because a plaque wearing
 * its own number is a plaque with nothing on it.
 */
export function nextSign(
  siblings: readonly string[],
  own: string,
  current: string | null,
): string | null {
  const others = siblings.filter((id) => id !== own).sort()
  const at = current ? others.indexOf(current) : -1
  return at + 1 < others.length ? (others[at + 1] ?? null) : null
}
