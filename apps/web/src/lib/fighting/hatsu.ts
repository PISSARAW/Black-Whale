import { canUseHatsu } from '@black-whale/nen-engine'
import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'
export { advanceHatsuFrames, hatsuFor } from './hatsu/registry'
import { hatsuFor } from './hatsu/registry'

/** Shared gameplay contract for every roster Hatsu. */
export const FIGHT_HATSU_AURA_COST = 40

export function canUseFightHatsu(fighter: Pick<ArcadeFighter, 'aura' | 'nen'>): boolean {
  return fighter.aura >= FIGHT_HATSU_AURA_COST && canUseHatsu(fighter.nen)
}

export function hatsuSourceFor(fighter: ArcadeFighter): FighterId {
  return hatsuFor(fighter.id).sourceFor?.(fighter) ?? fighter.id
}

export function triggerHatsu(state: FightState, side: FightSide, source: FighterId): FightState {
  return hatsuFor(source).onTrigger({ state, side, source })
}

export function resolveHatsuImpact(options: {
  state: FightState
  side: FightSide
  defenderSide: FightSide
  source: FighterId
  blocked: boolean
  concealed: boolean
}): FightState {
  const { side, defenderSide, source, blocked, concealed } = options
  const defender = options.state[defenderSide]
  const recorded = {
    ...options.state,
    [defenderSide]: {
      ...defender,
      hatsuEffects: { ...defender.hatsuEffects, lastHatsuReceived: source },
    },
  }
  return hatsuFor(source).onImpact({
    state: recorded,
    side,
    defenderSide,
    source,
    blocked,
    concealed,
  })
}

export function hatsuDamageFactor(fighter: ArcadeFighter): number {
  const baton = 1 + fighter.hatsuEffects.batonCharges * 0.12
  const risingSun =
    fighter.id === 'feitan' && fighter.attack?.kind === 'special'
      ? 1 + ((100 - fighter.health) / 100) * 1.8
      : 1
  const transformed = fighter.hatsuEffects.transformationFrames > 0 ? 1.35 : 1
  const cyclotron = 1 + fighter.hatsuEffects.cyclotronTurns * 0.22
  const cantabile = fighter.hatsuEffects.cantabileFrames > 0 ? 1.3 : 1
  return baton * risingSun * transformed * cyclotron * cantabile
}

export function hatsuDefenceFactor(fighter: ArcadeFighter): number {
  const transformed = fighter.hatsuEffects.transformationFrames > 0 ? 0.68 : 1
  const cantabile = fighter.hatsuEffects.cantabileFrames > 0 ? 0.82 : 1
  return transformed * cantabile
}

export function hatsuAvoidsImpact(fighter: ArcadeFighter): boolean {
  return fighter.hatsuEffects.futureSight > 0 || fighter.hatsuEffects.isolationFrames > 0
}

export function consumeBaton(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.hatsuEffects.batonCharges) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, batonCharges: 0 },
  }
}

export function consumeFutureSight(fighter: ArcadeFighter): ArcadeFighter {
  if (!fighter.hatsuEffects.futureSight) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, futureSight: fighter.hatsuEffects.futureSight - 1 },
  }
}

export function consumeHatsuAvoidance(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.hatsuEffects.futureSight > 0) return consumeFutureSight(fighter)
  if (fighter.hatsuEffects.isolationFrames <= 0) return fighter
  return {
    ...fighter,
    hatsuEffects: { ...fighter.hatsuEffects, isolationFrames: 0 },
  }
}
