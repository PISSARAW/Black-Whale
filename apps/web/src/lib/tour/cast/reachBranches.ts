/**
 * The two reaches that decide something on their own.
 *
 * `reachBody` is a dispatch and stays one. These are the branches whose answer
 * needs more than one line to reach: the thumb reads a single condition from
 * two sides, the flock has one errand and one kind of addressee. They live here
 * so the dispatch stays readable as a table.
 */
import { holdFor } from './bodies'
import type { BodyKind } from '../bodyKinds'
import type { Reach, ReachInput } from './reach'

/**
 * Who a bird will carry something to.
 *
 * Ch. 320 is Cluck's flock delivering ballots to the Zodiacs, and that is the
 * only errand the archive draws it running: a pigeon put into the hand of a
 * colleague. So the walk carries the delivery exactly that far — a Zodiac
 * aboard, which on this ship is Cheadle in the medical zone and Mizaistom in
 * the political one — and a bird sent to a sentry is a bird with no addressee.
 */
export const FLOCK_ADDRESSEES = 'zodiacs'

/**
 * Steal Chain's finger, which does two opposite things with one gesture: aimed
 * at somebody new it tears an ability out, aimed back at whoever it emptied it
 * gives both back. One condition read from two sides, so they are decided
 * together — and kept out of `reachBody`, which stays a dispatch.
 */
export function theThumb(kind: BodyKind, characterId: string, input: ReachInput): Reach {
  if (input.book?.stolenFrom === characterId) {
    return { outcome: 'returned', kind, characterId, technique: input.book.open ?? '' }
  }
  return {
    outcome: 'stolen',
    kind,
    characterId,
    technique: input.target!.member.hatsu[0]!,
    hold: holdFor(characterId, { kind, mark: 'drained' }, input.now),
  }
}

/**
 * The flock, which has one errand and one kind of addressee. Both answers are
 * true statements about the ability, and the refusal is the more informative
 * of the two: it is the walk saying out loud that this manipulation takes
 * birds and takes nothing else.
 */
export function theFlock(kind: BodyKind, characterId: string, input: ReachInput): Reach {
  if (input.dossier?.factionId === FLOCK_ADDRESSEES) {
    return { outcome: 'delivered', kind, characterId }
  }
  return { outcome: 'refused', kind, reason: 'only-birds' }
}
