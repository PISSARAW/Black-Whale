import { fightFormat } from './formats'
import type { ArcadeFighter, FightFinishReason, FightSide, FightState } from './types'

interface ImpactJudgment {
  formatId: FightState['formatId']
  blocked: boolean
  critical: boolean
  knockdown: boolean
}

export function scoreJudgedImpact(judgment: ImpactJudgment): number {
  if (judgment.blocked) return 0
  if (fightFormat(judgment.formatId).victory === 'points') {
    return (judgment.critical ? 2 : 1) + Number(judgment.knockdown)
  }
  return judgment.critical ? 2 : 1
}

interface KnockdownJudgment {
  attacker: ArcadeFighter
  knockback: number
  blocked: boolean
  avoided: boolean
  critical: boolean
}

export function isJudgedKnockdown(judgment: KnockdownJudgment): boolean {
  if (judgment.blocked || judgment.avoided) return false
  return (
    judgment.critical || judgment.attacker.attack?.variant === 'throw' || judgment.knockback >= 3
  )
}

interface KnockdownScore {
  state: FightState
  side: FightSide
  knockdown: boolean
}

export function addJudgedKnockdown(judgment: KnockdownScore): FightState['knockdowns'] {
  const { state, side } = judgment
  if (!judgment.knockdown || fightFormat(state.formatId).knockdownTarget === null) {
    return state.knockdowns
  }
  return { ...state.knockdowns, [side]: state.knockdowns[side] + 1 }
}

export function tradeFinishReason(
  player: Exclude<FightFinishReason, 'time'>,
  opponent: Exclude<FightFinishReason, 'time'>,
): Exclude<FightFinishReason, null | 'time'> {
  if (player === 'knockout' || opponent === 'knockout') return 'knockout'
  if (player === 'technical-knockout' || opponent === 'technical-knockout') {
    return 'technical-knockout'
  }
  return 'hits'
}
