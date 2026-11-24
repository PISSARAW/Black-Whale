import { fightContactStyle } from './fightContactStyle'
import type { FightImpact } from './types'

export interface FightImpactPunctuation {
  rank: 0 | 1 | 2 | 3
  rays: number
  wave: boolean
  direction: number
  cameraPush: number
  cameraLook: number
  cameraTilt: number
  thumpHz: number
  crack: number
}

/** One public, presentation-only accent shared by particles, camera and sound. */
export function fightImpactPunctuation(
  impact: Pick<
    FightImpact,
    'kind' | 'blocked' | 'critical' | 'counterHit' | 'punish' | 'knockdown' | 'wallSplat' | 'zone'
  > &
    Partial<Pick<FightImpact, 'parried' | 'avoided' | 'invulnerable'>>,
): FightImpactPunctuation {
  const style = fightContactStyle(impact)
  if (style === 'evaded') return quiet()
  const decisive = Boolean(
    impact.critical || impact.counterHit || impact.punish || impact.knockdown || impact.wallSplat,
  )
  const rank: 1 | 2 | 3 = impact.parried || decisive ? 3 : impact.kind === 'light' ? 1 : 2
  const guard = style === 'guard'
  const head = impact.zone === 'head'
  const low = impact.zone === 'feet'
  const direction = guard ? -0.58 : impact.parried ? -0.8 : 1
  return {
    rank,
    rays: impact.parried ? 4 : guard ? 3 + rank : 4 + rank * 2,
    wave: Boolean(impact.parried || rank >= 2),
    direction,
    cameraPush: (guard ? 0.035 : 0.065) * rank,
    cameraLook: head ? 0.035 * rank : low ? -0.025 * rank : 0,
    cameraTilt: (impact.counterHit || impact.punish ? 0.018 : 0.008) * rank * direction,
    thumpHz: guard ? 150 - rank * 16 : 125 - rank * 18,
    crack: impact.parried ? 1 : decisive ? 0.75 : rank === 2 ? 0.35 : 0,
  }
}

function quiet(): FightImpactPunctuation {
  return {
    rank: 0,
    rays: 0,
    wave: false,
    direction: 0,
    cameraPush: 0,
    cameraLook: 0,
    cameraTilt: 0,
    thumpHz: 0,
    crack: 0,
  }
}
