import { canUseHatsu } from '@black-whale/nen-engine'
import { hatsuSealedByOn } from './onTechnique'
import type { AttackFrameData } from './frameData'
import type { ArcadeFighter } from './types'

export const FRANKLIN_SHOT_INTERVAL = 2

/** Ten permanently severed fingertips; no temporary transformation or damage charge. */
export function franklinNenAvailable(fighter: ArcadeFighter): boolean {
  return (
    canUseHatsu(fighter.nen) && !hatsuSealedByOn(fighter) && fighter.hatsuEffects.hatsuStolen === 0
  )
}

export function usesFranklinBarrage(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (!attack) return false
  if (attack.kind === 'ranged') return fighter.id === 'franklin'
  if (attack.kind !== 'special') return false
  return fighter.id === 'franklin' || attack.hatsuSource === 'franklin'
}

export interface FranklinSalvo {
  shots: number
  startup: number
  recovery: number
  damage: number
  height: number
}

/** Cadence, costs and aiming variants are duel tuning, not additional manga techniques. */
export function franklinSalvo(fighter: {
  attack?: Pick<NonNullable<ArcadeFighter['attack']>, 'kind' | 'moveId'> | null
}): FranklinSalvo {
  const attack = fighter.attack
  if (attack?.kind === 'ranged')
    return { shots: 10, startup: 8, recovery: 15, damage: 2.8, height: 10.1 }
  const slot = attack?.moveId?.startsWith('chrollo:')
    ? 'neutralSpecial'
    : attack?.moveId?.split(':')[1]
  const variants: Record<string, FranklinSalvo> = {
    forwardSpecial: { shots: 10, startup: 10, recovery: 19, damage: 3.5, height: 10.1 },
    downSpecial: { shots: 10, startup: 12, recovery: 21, damage: 2.8, height: 2.5 },
    backSpecial: { shots: 20, startup: 17, recovery: 24, damage: 2.5, height: 10.1 },
    finisher: { shots: 40, startup: 24, recovery: 32, damage: 3.5, height: 10.1 },
  }
  return variants[slot ?? ''] ?? { shots: 20, startup: 16, recovery: 25, damage: 3, height: 10.1 }
}

export function franklinActiveFrames(shots: number): number {
  return (shots - 1) * FRANKLIN_SHOT_INTERVAL + 1
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
