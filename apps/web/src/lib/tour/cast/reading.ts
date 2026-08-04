/**
 * What the visitor's own Nen tells them about the body in front of them.
 *
 * The walk gave the visitor the whole vocabulary — Ten, Ren, Zetsu, Gyo, In,
 * En, Ken, Ryu, Ko — and gave it nothing to be about. Aura was a thing you put
 * on yourself and pointed at furniture. This module is the other half: aiming
 * at a person and being told what a Nen user would actually be able to tell.
 *
 * The line it holds, and the reason it is a separate module from `address.ts`:
 * **this is perception, not knowledge.** Everything here is something the
 * visitor senses in the room, and nothing here is something the catalogue says.
 * That Kurapika is a Conjurer is a declaration of `characters.json` and belongs
 * to the interview; that the man at the door has his aura up is a fact about
 * this second and belongs here. Mixing the two would let the walk hand a reader
 * a catalogue field and call it a perception, which is exactly the kind of
 * quiet promotion the whole archive is built to refuse.
 *
 * Two refusals worth naming:
 *
 * - **Zetsu is not distinguishable from having no aura.** A body that is
 *   hiding and a body that never had anything read the same — `still` — and
 *   only Gyo separates them, which is what Gyo is for. Reporting "this person
 *   is in Zetsu" to a visitor in plain Ten would be a detector for
 *   concealment, and `auraRefraction.ts` already refused to build one.
 * - **Ko reads nothing.** Ko is every zone emptied into one, which is a
 *   commitment to a blow. `cast/nen.ts` refuses to let a guard answer with it;
 *   the visitor gets the same answer, from the same argument.
 */
import type { NenTechniqueState } from '@black-whale/nen-engine'
import type { CastBeast, Post } from './types'

/** One thing the visitor can tell about the body they are aiming at. */
export type ReadingTell =
  /** No aura out: nothing is read, because nothing is being used to read with. */
  | 'blind'
  /** An aura is on them, and it is up: Ren is felt across a room. */
  | 'ren'
  /** An aura is on them, held in. */
  | 'ten'
  /** Nothing comes off them. Whether that is Zetsu or nothing, Gyo says. */
  | 'still'
  /** Gyo, on a body that is holding itself unfindable. */
  | 'zetsu'
  /** They are inside the visitor's En, which senses a body and not its aura. */
  | 'en'
  /** Gyo, and an animal that is not theirs to hide standing with them. */
  | 'beast'

/** Everything the reading looks at. Nothing is fetched and nothing is global. */
export interface ReadingInput {
  /** The body down the reticle. */
  target: Post
  /** The aura it is carrying, as `cast/nen.ts` decided it. */
  aura: 'ten' | 'ren' | 'zetsu' | null
  /** The beast standing with it, if the payload places one. */
  beast: CastBeast | null
  /** The visitor's own state, the same contract every surface reads. */
  visitor: NenTechniqueState
  /** How far away the body is, in metres, for En. */
  range: number
}

/**
 * Whether the visitor has anything out to read with.
 *
 * Zetsu closes the envelope entirely, which is the whole point of it: a visitor
 * who has dropped their aura to move unnoticed has also dropped the sense that
 * comes with it, and the walk should not quietly keep the second.
 */
function canRead(visitor: NenTechniqueState): boolean {
  return visitor.mode !== 'zetsu'
}

/** Whether this body is inside the sphere the visitor is sweeping. */
function insideEn(input: ReadingInput): boolean {
  const radius = input.visitor.en?.radius ?? 0
  return radius > 0 && input.range <= radius
}

/**
 * What the visitor can tell, right now, about this body.
 *
 * Ordered from the coarsest sense to the finest, which is also the order the
 * panel reads them in: that something is there, then what it is doing, then
 * what it is hiding. An empty list is impossible — `blind` is an answer.
 */
export function readBody(input: ReadingInput): ReadingTell[] {
  if (!canRead(input.visitor)) return ['blind']

  const tells: ReadingTell[] = []
  if (insideEn(input)) tells.push('en')

  // What comes off the body. A carried Ren is felt by anyone with their own
  // aura up; a held Ten is felt at conversational distance; Zetsu and no-aura
  // are the same silence until Gyo is put on.
  if (input.aura === 'ren') tells.push('ren')
  else if (input.aura === 'ten') tells.push('ten')
  else tells.push('still')

  if (input.visitor.gyo) {
    if (input.aura === 'zetsu') tells.push('zetsu')
    if (input.beast) tells.push('beast')
  }

  return tells
}

/**
 * Whether the body can tell it is being read.
 *
 * Only a raised aura is felt, and only at the range a room gives: Gyo and En
 * are quiet, which is why they are what you use when you do not want to be
 * noticed. The conduct consumes this to raise the aimed body's own Ren — a
 * person who feels aura levelled at them answers with theirs, and does not
 * answer to a visitor who is merely looking hard.
 */
export function readingIsFelt(visitor: NenTechniqueState): boolean {
  return visitor.mode === 'ren' || visitor.on || visitor.ken
}
