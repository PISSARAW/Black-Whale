import { bonolenovArmedNormal } from './bonolenovArmedNormals'
import { padailleArmedNormal } from './padailleNormalTools'
import { padailleKeyedMove } from './padaillePoses'
import { feitanEquipmentMove } from './feitanEquipmentPose'
import { musseKeyedMove } from './mussePoses'
import { chrolloKeyedMove } from './chrolloPoses'
import { benjaminKeyedMove } from './benjaminPoses'
import { hisokaKeyedMove } from './hisokaCardPoses'
import { keyedMove } from './keyPoseMoves'
import { hanzoAstralNormal } from './hanzoAstralMotion'
import { biscuitNaturalNormal } from './secondFiveNormals'
import { directionalFinishPose } from './directionalFinishPoses'
import { rosterDirectionalMove } from './rosterDirectionalPoses'
import { naturalTechniqueTimeline } from './naturalTechniqueTimeline'
import { kurapikaKeyedMove } from './kurapikaPoses'
import { alternateSignaturePose } from './alternateSignaturePoses'
import type { ArcadeFighter, MoveSlot } from './types'

/** The same equipment-aware timeline feeds the drawn body and its aura allocation. */
export function fighterKeyedMove(fighter: ArcadeFighter, slot: MoveSlot) {
  const astral = hanzoAstralNormal(fighter, slot)
  if (astral) return { timeline: astral, authored: true }
  const finish = directionalFinishPose(fighter)
  if (finish) return { timeline: finish, authored: true }
  const directed = rosterDirectionalMove(fighter, equipmentAwareMove(fighter, slot))
  const timeline = naturalTechniqueTimeline(
    fighter.id,
    slot,
    biscuitNaturalNormal(fighter, slot, directed.timeline),
  )
  const alternate = alternateSignaturePose(fighter, timeline)
  return alternate ? { timeline: alternate, authored: true } : { ...directed, timeline }
}

function equipmentAwareMove(fighter: ArcadeFighter, slot: MoveSlot) {
  return (
    kurapikaKeyedMove(fighter) ??
    feitanEquipmentMove(fighter) ??
    padailleKeyedMove(fighter) ??
    bonolenovArmedNormal(fighter, slot) ??
    musseKeyedMove(fighter) ??
    chrolloKeyedMove(fighter) ??
    benjaminKeyedMove(fighter) ??
    hisokaKeyedMove(fighter) ??
    padailleArmedNormal(fighter, keyedMove(fighter.id, slot))
  )
}
