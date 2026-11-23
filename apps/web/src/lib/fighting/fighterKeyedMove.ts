import { padailleKeyedMove } from './padaillePoses'
import { feitanEquipmentMove } from './feitanEquipmentPose'
import { musseKeyedMove } from './mussePoses'
import { chrolloKeyedMove } from './chrolloPoses'
import { benjaminKeyedMove } from './benjaminPoses'
import { hisokaKeyedMove } from './hisokaCardPoses'
import { keyedMove } from './keyPoseMoves'
import { biscuitNaturalNormal } from './secondFiveNormals'
import { directionalFinishPose } from './directionalFinishPoses'
import { rosterDirectionalMove } from './rosterDirectionalPoses'
import { naturalTechniqueTimeline } from './naturalTechniqueTimeline'
import type { ArcadeFighter, MoveSlot } from './types'

/** The same equipment-aware timeline feeds the drawn body and its aura allocation. */
export function fighterKeyedMove(fighter: ArcadeFighter, slot: MoveSlot) {
  const finish = directionalFinishPose(fighter)
  if (finish) return { timeline: finish, authored: true }
  const native =
    feitanEquipmentMove(fighter) ??
    padailleKeyedMove(fighter) ??
    musseKeyedMove(fighter) ??
    chrolloKeyedMove(fighter) ??
    benjaminKeyedMove(fighter) ??
    hisokaKeyedMove(fighter) ??
    keyedMove(fighter.id, slot)
  const directed = rosterDirectionalMove(fighter, native)
  return {
    ...directed,
    timeline: naturalTechniqueTimeline(
      fighter.id,
      slot,
      biscuitNaturalNormal(fighter, slot, directed.timeline),
    ),
  }
}
