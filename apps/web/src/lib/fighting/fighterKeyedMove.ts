import { padailleKeyedMove } from './padaillePoses'
import { musseKeyedMove } from './mussePoses'
import { chrolloKeyedMove } from './chrolloPoses'
import { benjaminKeyedMove } from './benjaminPoses'
import { keyedMove } from './keyPoseMoves'
import type { ArcadeFighter, MoveSlot } from './types'

/** The same equipment-aware timeline feeds the drawn body and its aura allocation. */
export function fighterKeyedMove(fighter: ArcadeFighter, slot: MoveSlot) {
  return (
    padailleKeyedMove(fighter) ??
    musseKeyedMove(fighter) ??
    chrolloKeyedMove(fighter) ??
    benjaminKeyedMove(fighter) ??
    keyedMove(fighter.id, slot)
  )
}
