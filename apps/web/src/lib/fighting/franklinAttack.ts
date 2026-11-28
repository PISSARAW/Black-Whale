import { chainAbilitySealed } from './kurapika'
import { voluntaryNenAvailable } from './nenAccess'
import type { AttackFrameData } from './frameData'
import type { ArcadeFighter } from './types'

import { FRANKLIN_SHOT_INTERVAL, franklinActiveFrames, franklinSalvo } from './franklinSalvo'
export { FRANKLIN_SHOT_INTERVAL, franklinActiveFrames, franklinSalvo } from './franklinSalvo'

/** Ten permanently severed fingertips; no temporary transformation or damage charge. */
export function franklinNenAvailable(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter) && !chainAbilitySealed(fighter, 'franklin:neutralSpecial')
}

export function usesFranklinBarrage(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (!attack) return false
  if (attack.kind === 'ranged') return fighter.id === 'franklin'
  if (attack.kind !== 'special') return false
  return fighter.id === 'franklin' || attack.hatsuSource === 'franklin'
}

export function franklinAttackData(data: AttackFrameData, fighter: ArcadeFighter): AttackFrameData {
  if (!usesFranklinBarrage(fighter)) return data
  const salvo = franklinSalvo(fighter)
  const startup = salvo.startup + (fighter.attack?.concealed ? 10 : 0)
  const active = franklinActiveFrames(salvo.shots)
  return {
    ...data,
    startup,
    active,
    recovery: salvo.recovery,
    damage: 0,
    lunge: 0,
    hitstop: 1,
    cancelEnd: startup + active + salvo.recovery,
  }
}

/** The same frame index drives the simulated shot and its fingertip flash. */
export function franklinShotAt(fighter: ArcadeFighter): number | null {
  if (!usesFranklinBarrage(fighter)) return null
  const salvo = franklinSalvo(fighter)
  const startup = salvo.startup + (fighter.attack?.concealed ? 10 : 0)
  const offset = fighter.attack!.frame - startup
  if (offset < 0 || offset >= franklinActiveFrames(salvo.shots)) return null
  return Math.floor(offset / FRANKLIN_SHOT_INTERVAL)
}
