import { focusedRyuDistribution, resolvesParry } from '@black-whale/nen-engine'
import { GUARD_WINDOW, RYU_SHIFT_TIME } from './fighter'
import type { ExchangeResult } from './resolve'
import { BODY_ZONES, type CombatState } from './types'

interface ArenaParry {
  before: CombatState
  result: ExchangeResult
}

/** Adds Clash's timed-parry meaning to an Arena exchange that already resolved as blocked. */
export function applyArenaParry({ before, result }: ArenaParry): ExchangeResult {
  if (before.nenRules !== 'clash') return result
  const defenderSide = result.event.attacker === 'player' ? 'opponent' : 'player'
  const defender = before[defenderSide]
  const attacker = before[result.event.attacker]
  const parried = resolvesParry({
    blocked: result.event.impact === 'blocked',
    readable: !attacker.in || defender.gyo,
    guardFrames: elapsedGuardFrames(defender.guardWindow),
  })
  if (!parried) return result
  const focusShare = focusedRyuDistribution({
    zones: BODY_ZONES,
    focus: result.event.zone,
  })[result.event.zone]

  return {
    ...result,
    defender: {
      ...result.defender,
      guard: result.event.zone,
      attackShare: 1 - focusShare,
      ryuShift: {
        attackShare: 1 - focusShare,
        guard: result.event.zone,
        remaining: RYU_SHIFT_TIME,
        restore: { attackShare: defender.attackShare, guard: defender.guard },
      },
    },
    event: { ...result.event, parried: true },
  }
}

function elapsedGuardFrames(remaining: number): number {
  return Math.max(1, Math.round((GUARD_WINDOW - remaining) * 60) + 1)
}
