import { battlePreparing } from './battleCantabileRules'
import { crossGameRestrained } from './crossGame'
import { musicPacifies } from './melodyRules'
import type { ArcadeFighter } from './types'

const GROUND = 0

export function poseFighter(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.health <= 0) return { ...fighter, pose: 'ko', blocking: false }
  if (bodyDown(fighter)) return { ...fighter, pose: 'down', blocking: false }
  if (fighter.wakeupInvulnerableFrames > 0 && !fighter.attack)
    return { ...fighter, pose: 'wakeup', blocking: false }
  if (fighter.hitStun > 0) return { ...fighter, pose: 'hit', blocking: false }
  if (crossGameRestrained(fighter)) return { ...fighter, pose: 'idle', blocking: false }
  if (musicPacifies(fighter)) return { ...fighter, pose: 'idle', blocking: false }
  if (fighter.melodyPerformance || battlePreparing(fighter))
    return { ...fighter, pose: 'special', blocking: false }
  return activeFighterPose(fighter)
}

function activeFighterPose(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.attack) return { ...fighter, pose: fighter.attack.kind, blocking: false }
  if (fighter.y > GROUND) return { ...fighter, pose: 'jump', blocking: false }
  if (fighter.blocking || fighter.blockStun > 0) return { ...fighter, pose: 'guard' }
  return fighter
}

function bodyDown(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.arsenalSleep || fighter.halkenburgSleeping) || fighter.knockdownFrames > 0
}
