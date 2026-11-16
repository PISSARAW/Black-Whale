import { illumiBodyFree } from './illumiState'
import { maryHeld } from './bloodyMary'
import { biohazardBodyFree } from './biohazard'
import { battlePreparing } from './battleCantabileRules'
import { crossGameBusy } from './crossGame'
import { musicPacifies, melodyRestrictsCombat } from './melodyRules'
import { chainsImmobilize } from './kurapika'
import { projectionPreparing } from './hanzoProjection'
import type { ArcadeFighter, FightInput } from './types'

const GROUND = 0

function characterBusy(fighter: ArcadeFighter): boolean {
  if (!illumiBodyFree(fighter)) return true
  return maryHeld(fighter) || crossGameBusy(fighter) || Boolean(fighter.pluggingWounds)
}

export function canAct(fighter: ArcadeFighter): boolean {
  return !battlePreparing(fighter) && freeCombatBody(fighter)
}

export function freeCombatBody(fighter: ArcadeFighter): boolean {
  return (
    biohazardBodyFree(fighter) &&
    !characterBusy(fighter) &&
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
    !battlePreparing(fighter) &&
    !characterBusy(fighter) &&
    biohazardBodyFree(fighter) &&
    !melodyRestrictsCombat(fighter) &&
    !chainsImmobilize(fighter) &&
    fighter.y === GROUND &&
    fighter.hitStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.health > 0 &&
    fighter.attack === null
  )
}

export function playerCanJump(fighter: ArcadeFighter, input: FightInput): boolean {
  return input.jump && !input.aura && canMove(fighter) && fighter.y === GROUND
}
