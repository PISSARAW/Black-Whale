import { biohazardBodyFree } from './biohazard'
import { battlePreparing } from './battleCantabileRules'
import { crossGameBusy } from './crossGame'
import { musicPacifies, melodyRestrictsCombat } from './melodyRules'
import { chainsImmobilize } from './kurapika'
import { projectionPreparing } from './hanzoProjection'
import type { ArcadeFighter } from './types'

const GROUND = 0

export function canAct(fighter: ArcadeFighter): boolean {
  return !battlePreparing(fighter) && freeCombatBody(fighter)
}

export function freeCombatBody(fighter: ArcadeFighter): boolean {
  return (
    biohazardBodyFree(fighter) &&
    !fighter.pluggingWounds &&
    !crossGameBusy(fighter) &&
    !musicPacifies(fighter) &&
    !chainsImmobilize(fighter) &&
    !projectionPreparing(fighter) &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.health > 0
  )
}

export function canMove(fighter: ArcadeFighter): boolean {
  return canAct(fighter) && fighter.attack === null && !fighter.melodyPerformance
}

export function canGuard(fighter: ArcadeFighter): boolean {
  return (
    guardHandsFree(fighter) &&
    !crossGameBusy(fighter) &&
    !melodyRestrictsCombat(fighter) &&
    !chainsImmobilize(fighter) &&
    fighter.y === GROUND &&
    fighter.hitStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.health > 0 &&
    fighter.attack === null
  )
}

function guardHandsFree(fighter: ArcadeFighter): boolean {
  return biohazardBodyFree(fighter) && !battlePreparing(fighter) && !fighter.pluggingWounds
}
