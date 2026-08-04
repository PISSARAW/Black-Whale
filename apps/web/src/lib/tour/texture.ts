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
