import { canAct, canMove } from './fightActorState'
import type { ArcadeFighter, FightInput } from './types'

declare module './types' {
  interface ArcadeFighter {
    /** The body is still airborne from a confirmed directional launcher. */
    airRecovery?: true
  }
}

const RETREAT_SPEED = 24
const DESCENT_SPEED = 66

export function airRecoveryAvailable(fighter: ArcadeFighter): boolean {
  return (
    fighter.airRecovery === true && fighter.y > 0 && !fighter.hanzoProjection && canMove(fighter)
  )
}

/** Use the opening frame's body clocks, before gravity or hitstun advances. */
export function applyAirRecovery(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  if (!fighter.airRecovery || fighter.y <= 0 || !canAct(fighter)) return fighter
  // An opponent who can act has left the combo, even if they are still airborne.
  const released = fighter.comboHits ? { ...fighter, comboHits: 0, comboDamage: 0 } : fighter
  return airRecoveryAvailable(released) ? steerRecovery(released, input) : released
}

function steerRecovery(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  if (!fighter.motion) return fighter
  const descent = input.down && input.guard && !input.aura
  const direction = Number(input.right) - Number(input.left)
  const velocityX = !descent && direction === -fighter.facing ? direction * RETREAT_SPEED : 0
  return {
    ...fighter,
    velocityY: descent ? Math.min(fighter.velocityY, -DESCENT_SPEED) : fighter.velocityY,
    motion: { ...fighter.motion, velocityX },
  }
}
