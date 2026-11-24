import { voiceSpeedFactor } from './blackVoiceAutopilot'
import { chrolloFreeHandsFactor } from './advancedMovementTech'
import { bodyLegFactor } from './bodyDamage'
import { fightingStyle } from './fightStyles'
import { physicalCombatProfile } from './physicalCombatProfiles'
import { styleMatchup, type StyleRole } from './styleMatchups'
import type { ArcadeFighter } from './types'

interface Mobility {
  backWalk: number
  forwardDash: { frames: number; peak: number }
  backDash: { frames: number; peak: number }
}
const MOBILITY: Record<StyleRole, Mobility> = {
  mobile: {
    backWalk: 0.88,
    forwardDash: { frames: 16, peak: 103 },
    backDash: { frames: 14, peak: 96 },
  },
  pressure: {
    backWalk: 0.7,
    forwardDash: { frames: 19, peak: 100 },
    backDash: { frames: 18, peak: 68 },
  },
  control: {
    backWalk: 0.8,
    forwardDash: { frames: 18, peak: 96 },
    backDash: { frames: 16, peak: 82 },
  },
  ranged: {
    backWalk: 0.76,
    forwardDash: { frames: 21, peak: 82 },
    backDash: { frames: 18, peak: 77 },
  },
  preparation: {
    backWalk: 0.82,
    forwardDash: { frames: 19, peak: 90 },
    backDash: { frames: 16, peak: 85 },
  },
  support: {
    backWalk: 0.8,
    forwardDash: { frames: 20, peak: 86 },
    backDash: { frames: 17, peak: 80 },
  },
}

const FEITAN_MOBILITY: Mobility = {
  backWalk: 0.96,
  forwardDash: { frames: 14, peak: 140 },
  backDash: { frames: 12, peak: 124 },
}

/** Body identity only: Skill Hunter and Dolphin cannot copy someone else's footwork. */
export function styleMobility(fighter: ArcadeFighter): Mobility & { walkScale: number } {
  const role =
    fighter.id === 'biscuit' && !fighter.biscuitTrueForm ? 'control' : styleMatchup(fighter.id).role
  const personal = physicalCombatProfile(fighter.id)
  const base = fighter.id === 'feitan' ? FEITAN_MOBILITY : (personal ?? MOBILITY[role]),
    factor = voiceSpeedFactor(fighter) * bodyLegFactor(fighter) * chrolloFreeHandsFactor(fighter)
  return {
    backWalk: base.backWalk,
    walkScale:
      fightingStyle(fighter.id).moveScale *
      (fighter.id === 'feitan' ? (personal?.walk ?? 1) * 1.08 : (personal?.walk ?? 1)) *
      factor,
    forwardDash: { ...base.forwardDash, peak: base.forwardDash.peak * factor },
    backDash: { ...base.backDash, peak: base.backDash.peak * factor },
  }
}

export function styleReactionFrames(fighter: ArcadeFighter): number {
  return (
    physicalCombatProfile(fighter.id)?.reaction ??
    (fighter.id === 'feitan' || styleMatchup(fighter.id).role === 'mobile' ? 10 : 14)
  )
}
