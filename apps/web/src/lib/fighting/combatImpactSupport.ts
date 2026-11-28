import { recordFightDeath } from './fightDeaths'
import { type ImpactDefence } from './combatDamage'
import { scoreJudgedImpact } from './towerJudging'
import type { FightSide, FightState } from './types'

function impactDeathCause(impact: FightState['impact']) {
  if (impact?.transfer) return 'transfer' as const
  return impact?.projectileId ? ('projectile' as const) : ('strike' as const)
}

export function finishAfterImpact(
  state: FightState,
  {
    attackerSide,
    defenderSide,
    shotId,
  }: { attackerSide: FightSide; defenderSide: FightSide; shotId?: number },
): FightState {
  const impact = state.impact
  const owner = impact?.transfer?.owner ?? attackerSide
  const cause = impactDeathCause(impact)
  return recordFightDeath(state, {
    victimSide: defenderSide,
    killerSide: owner === defenderSide ? null : owner,
    cause,
    ...(cause === 'projectile' && shotId !== undefined && impact?.projectileId === shotId
      ? { shotId }
      : {}),
  })
}

export function impactPoints(options: {
  state: FightState
  defence: ImpactDefence
  critical: boolean
  knockdown: boolean
}): number {
  const { state, defence, critical, knockdown } = options
  if (defence.avoided) return 0
  return scoreJudgedImpact({
    formatId: state.formatId,
    blocked: defence.blocked,
    critical,
    knockdown,
  })
}
