import {
  ALTERNATE_SIGNATURE_CHOREOGRAPHY,
  SIGNATURE_GESTURES,
} from './alternateSignatureChoreography'
import { ALTERNATE_SIGNATURE_MOVES } from './alternateSignatureMoves'
import { numpadDirection } from './motionInput'
import { PERSONAL_SIGNATURE_MOVES } from './personalSignatureMoves'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput, type MoveAction } from './types'
import type { FighterMove, FighterMoveset, MoveFollowUp, SignatureDirection } from './movesetTypes'

export const signatureOpeningId = <Id extends string>(finisher: Id): `${Id}-opening` =>
  `${finisher}-opening`
export const signatureTransitionId = <Id extends string>(finisher: Id): `${Id}-transition` =>
  `${finisher}-transition`

const DIRECTION_HINTS: Record<SignatureDirection, string> = {
  1: '↓ + ← + ',
  3: '↓ + → + ',
  4: '← + ',
  5: '',
  6: '→ + ',
}

export function signatureDirectionInput(direction: SignatureDirection, facing: 1 | -1): FightInput {
  const forward = direction === 3 || direction === 6
  const back = direction === 1 || direction === 4
  return {
    ...EMPTY_INPUT,
    down: direction === 1 || direction === 3,
    right: facing === 1 ? forward : back,
    left: facing === 1 ? back : forward,
  }
}

export function selectSignatureOpening(options: {
  fighter: ArcadeFighter
  action: MoveAction
  input: FightInput
  move?: FighterMove
}): FighterMove | null {
  const { fighter, action, input, move } = options
  if (!move || fighter.attack || fighter.y > 0 || action !== 'light' || input.aura) return null
  return numpadDirection(fighter.facing, input) === move.signatureDirection ? move : null
}

interface Beat {
  id: string
  name: readonly [string, string]
  direction: SignatureDirection
  next?: string
}

function signatureAttack(base: FighterMove, beat: Beat): FighterMove {
  const tuning = base.tuning
  const personal = PERSONAL_SIGNATURE_MOVES[beat.id]
  return {
    ...base,
    id: beat.id,
    nameFr: beat.name[0],
    nameEn: beat.name[1],
    signatureDirection: beat.direction,
    input: DIRECTION_HINTS[beat.direction] + (base.kind === 'light' ? 'J' : 'K'),
    tuning: {
      ...tuning,
      startup: Math.min(tuning.startup, 8),
      reach: Math.max(tuning.reach, 13),
      damage: tuning.damage * 0.85,
      lunge: Math.max(1.6, tuning.lunge),
      // An intermediate strike repositions the target without ending the grounded string.
      ...(beat.next ? { knockback: Math.min(tuning.knockback, 2.3) } : {}),
      ...personal?.tuning,
    },
    ...(personal?.cancelWindow ? { cancelWindow: personal.cancelWindow } : {}),
    cancelInto: beat.next ? [beat.next] : [],
    cancelOnBlockInto: [],
    linkInto: [],
  }
}

function onHit(move: FighterMove, sourceMoveId: string, legacySourceMoveId?: string): MoveFollowUp {
  return {
    id: move.id,
    sourceMoveId,
    ...(legacySourceMoveId ? { legacySourceMoveId } : {}),
    input: move.kind === 'light' ? 'light' : 'heavy',
    condition: 'on-hit',
    move,
  }
}

export function attachAlternateSignature(moveset: FighterMoveset): FighterMoveset {
  const { fighterId } = moveset
  const signature = ALTERNATE_SIGNATURE_MOVES[fighterId]
  const choreography = ALTERNATE_SIGNATURE_CHOREOGRAPHY[fighterId]
  if (!signature || !choreography) return moveset
  const [[openingGesture, openingFr, openingEn], [transitionGesture, transitionFr, transitionEn]] =
    choreography
  const opening = SIGNATURE_GESTURES[openingGesture]
  const transition = SIGNATURE_GESTURES[transitionGesture]
  const finisherId = `${fighterId}:${signature.id}`
  const openingId = signatureOpeningId(finisherId)
  const transitionId = signatureTransitionId(finisherId)
  const bySlot = new Map(moveset.moves.map((move) => [move.slot, move]))
  const first = signatureAttack(bySlot.get(opening.base)!, {
    id: openingId,
    name: [openingFr, openingEn],
    direction: opening.direction,
    next: transitionId,
  })
  const second = signatureAttack(bySlot.get(transition.base)!, {
    id: transitionId,
    name: [transitionFr, transitionEn],
    direction: transition.direction,
    next: finisherId,
  })
  const third = signatureAttack(bySlot.get(signature.base)!, {
    id: finisherId,
    name: signature.name,
    direction: 3,
  })
  const legacy = bySlot.get(signature.legacySource)!
  return {
    ...moveset,
    signatureOpening: first,
    moves: moveset.moves.map((move) =>
      move === legacy ? { ...move, cancelInto: [...move.cancelInto, finisherId] } : move,
    ),
    followUps: [
      ...(moveset.followUps ?? []),
      onHit(second, first.id),
      onHit(third, second.id, legacy.id),
    ],
    combos: [...moveset.combos, [first.id, second.id, third.id]],
  }
}
