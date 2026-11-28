import { fightContactStyle } from './fightContactStyle'
import { FEITAN_FINAL_REVERSAL } from './feitanSignatureImpact'
import type { FightImpact } from './types'

export interface FightImpactPunctuation {
  rank: 0 | 1 | 2 | 3
  rays: number
  wave: boolean
  waveScale?: number
  direction: number
  cameraPush: number
  cameraPushLimit?: number
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
  moveId?: string,
): FightImpactPunctuation {
  const style = fightContactStyle(impact)
  if (style === 'evaded') return quiet()
  if (style === 'hit' && moveId === FEITAN_FINAL_REVERSAL) return reversalPunctuation()
  return normalPunctuation(impact, style)
}

type OrdinaryContact = Exclude<ReturnType<typeof fightContactStyle>, 'evaded'>

const CONTACT = {
  hit: { rays: [0, 6, 8, 10], push: 0.065, direction: 1, thump: 125, step: 18 },
  guard: { rays: [0, 4, 5, 6], push: 0.035, direction: -0.58, thump: 150, step: 16 },
  parry: { rays: [0, 4, 4, 4], push: 0.065, direction: -0.8, thump: 125, step: 18 },
}
const HEIGHT = { head: 0.035, feet: -0.025, torso: 0, hands: 0 }
const CRACK = [0, 0, 0.35, 0.75]

type Contact = Parameters<typeof fightImpactPunctuation>[0]

function contactRank(impact: Contact): 1 | 2 | 3 {
  if (
    impact.parried ||
    impact.critical ||
    impact.counterHit ||
    impact.punish ||
    impact.knockdown ||
    impact.wallSplat
  )
    return 3
  return impact.kind === 'light' ? 1 : 2
}

function normalPunctuation(impact: Contact, style: OrdinaryContact): FightImpactPunctuation {
  const rank = contactRank(impact)
  const { rays, push, direction, thump, step } = CONTACT[style]
  return {
    rank,
    rays: rays[rank],
    wave: rank >= 2,
    direction,
    cameraPush: push * rank,
    cameraLook: (HEIGHT[impact.zone] ?? 0) * rank,
    cameraTilt: (impact.counterHit || impact.punish ? 0.018 : 0.008) * rank * direction,
    thumpHz: thump - rank * step,
    crack: style === 'parry' ? 1 : CRACK[rank],
  }
}

function reversalPunctuation(): FightImpactPunctuation {
  return {
    rank: 3,
    rays: 14,
    wave: true,
    waveScale: 1.55,
    direction: 1,
    cameraPush: 0.39,
    cameraPushLimit: 0.88,
    cameraLook: -0.12,
    cameraTilt: 0.041,
    thumpHz: 62,
    crack: 1.3,
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
