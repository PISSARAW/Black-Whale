import { BODY_MEMORY_HIT_THRESHOLD } from './bodyMemory'
import { beyondSaturatesGyo, thetaPortraitHidesStress } from './finalFiveUpgrades'
import { nenBodyOutput, readNenBudget } from './nenBudget'
import { nenMentalFatigueRatio, readNenCognitiveLoad } from './nenCognitiveLoad'
import { MAX_NEN_PSYCHOLOGY } from './nenPsychology'
import type { ArcadeFighter, FightSide, FightState } from './types'

export type LimbRingTint = 'normal' | 'amber' | 'crimson' | 'venom'

export interface NenSensoryHudSignals {
  /** 0..1 ratio of aura committed to detached/maintained constructs (hatched ghost segment in aura bar). */
  detachedAuraRatio: number
  /** 0.35..1 opacity of the 3D body aura halo from remaining output capacity. */
  bodyAuraOpacity: number
  /** 0..1 vibration intensity on the aura gauge (cognitive load + Beyond Ren Gyo saturation). */
  auraBarJitter: number
  /** True when cognitive bandwidth is overloaded (> 100%), triggering portrait sweat & vignette. */
  cognitiveOverloaded: boolean
  /** 0..1 breathing/stress intensity on the Living Portrait (0 for Theta's poker face when unread). */
  portraitStressLevel: number
  /** 0..1 heartbeat frame pulse & low audio thump from apprehension / Ren Malice pressure. */
  heartbeatPulse: number
  /** Non-textual color tint on the directional Ryu ring for hands & feet. */
  limbRingTint: {
    hands: LimbRingTint
    feet: LimbRingTint
  }
}

function resolveLimbTint(fighter: ArcadeFighter, zone: 'hands' | 'feet'): LimbRingTint {
  if ((fighter.gelVenomFrames ?? 0) > 0) return 'venom'
  const hits = fighter.bodyMemory?.hits[zone] ?? 0
  if (hits >= BODY_MEMORY_HIT_THRESHOLD) return 'crimson'
  if (hits > 0) return 'amber'
  return 'normal'
}

/**
 * Translates internal Nen subsystems (nenBudget, nenCognitiveLoad, nenPsychology, bodyMemory)
 * into pure visual/audio sensory cues without adding any extra HUD bars or text labels.
 */
export function readNenSensoryHud(
  state: FightState,
  side: FightSide,
  viewerSide: FightSide = side,
): NenSensoryHudSignals {
  const fighter = state[side]
  const foeSide: FightSide = side === 'player' ? 'opponent' : 'player'
  const foe = state[foeSide]
  const viewer = state[viewerSide]

  const budget = fighter.nenBudget ?? readNenBudget(state, side)
  const committed = budget.detached + budget.maintained
  const detachedAuraRatio =
    budget.capacity > 0 ? Math.max(0, Math.min(1, committed / budget.capacity)) : 0
  const bodyAuraOpacity = 0.35 + 0.65 * nenBodyOutput({ ...fighter, nenBudget: budget })

  const cognitive = readNenCognitiveLoad(state, side)
  const saturationJitter = side !== viewerSide && beyondSaturatesGyo(fighter) ? 0.45 : 0
  const loadJitter = cognitive.strained ? Math.min(1, (cognitive.ratio - 0.7) / 0.5) : 0
  const auraBarJitter = Math.max(0, Math.min(1, Math.max(loadJitter, saturationJitter)))

  const fatigue = nenMentalFatigueRatio(fighter)
  const lowHpStress = fighter.health < 40 ? (40 - fighter.health) / 40 : 0
  const rawStress = Math.max(fatigue, lowHpStress, cognitive.strained ? 0.6 : 0)
  const hideStress = side !== viewerSide && thetaPortraitHidesStress(fighter, viewer)
  const portraitStressLevel = hideStress ? 0 : Math.max(0, Math.min(1, rawStress))

  const apprehension = (fighter.nenPsychology?.apprehension ?? 0) / MAX_NEN_PSYCHOLOGY
  const fearActive = (fighter.fearCooldownFrames ?? 0) > 0 ? 0.75 : 0
  const maliceClose =
    foe.nen.mode === 'ren' && Math.abs(foe.x - fighter.x) <= 5 && fighter.nen.mode === 'zetsu'
      ? 0.65
      : 0
  const heartbeatPulse = Math.max(0, Math.min(1, Math.max(apprehension, fearActive, maliceClose)))

  return {
    detachedAuraRatio,
    bodyAuraOpacity,
    auraBarJitter,
    cognitiveOverloaded: cognitive.overloaded,
    portraitStressLevel,
    heartbeatPulse,
    limbRingTint: {
      hands: resolveLimbTint(fighter, 'hands'),
      feet: resolveLimbTint(fighter, 'feet'),
    },
  }
}
