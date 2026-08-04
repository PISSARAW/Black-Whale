/**
 * What a technique aimed at a person came to, in one line.
 *
 * The presentation half of `cast/reach.ts`, kept out of both the page and the
 * module: `reach.ts` decides and must not know how anything is worded, and the
 * page lays out a scene and must not know what a refusal means. This turns one
 * into the other and does nothing else.
 *
 * The refusals get the same treatment as the successes on purpose. Every one of
 * them is a condition of the technique — the vow on Chain Jail, the rite that
 * ends Gidal — so reading one is the visitor learning what the ability *is*,
 * and burying it would waste the most instructive thing the walk can say.
 */
import type { Reach, ReachRefusal, ReachTell } from './cast'
import type { BodyMark } from './cast'

/** How the line is worded, in the language being read. */
export interface BodyReadoutWords {
  refusal: (reason: ReachRefusal) => string
  tell: (tell: ReachTell) => string
  mark: (mark: BodyMark) => string
  /** "Sakata — held" */
  held: (name: string, what: string) => string
  /** "You are wearing Machi's face" */
  worn: (name: string) => string
  /** "Sayird — stolen (little-eye)" */
  stolen: (name: string, technique: string) => string
}

/** The one line to show, or null when there is nothing worth saying. */
export function noteFor(
  reach: Reach,
  words: BodyReadoutWords,
  nameOf: (characterId: string) => string,
): string | null {
  // Aiming a room technique at a person is not an event: the cast falls through
  // to the room, which is what the visitor will see happen. Saying "this does
  // not work on people" every time would nag about the common case.
  if (reach.outcome === 'refused')
    return reach.reason === 'not-a-body' ? null : words.refusal(reach.reason)
  if (reach.outcome === 'told') return reach.tells.map((tell) => words.tell(tell)).join(' ')
  // The one line that is about the visitor rather than about the body: the
  // face was copied, and the person it was copied from is unchanged.
  if (reach.outcome === 'worn') return words.worn(nameOf(reach.characterId))
  if (reach.outcome === 'stolen') return words.stolen(nameOf(reach.characterId), reach.technique)
  return words.held(nameOf(reach.characterId), words.mark(reach.hold.mark))
}
