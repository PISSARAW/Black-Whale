import { createFightState } from '../fightState'
import { fightExpressionTarget, type FightFacePose } from '../fightExpressions'
import type { ArcadeFighter, FighterId } from '../types'
import type { HealthEstimateTier, LivingPortraitMood } from './opponentHudView'

const TIER_LABELS: Record<HealthEstimateTier, [string, string]> = {
  intact: ['Intact', 'Intact'],
  scratched: ['Entamé', 'Scratched'],
  wounded: ['Éprouvé', 'Wounded'],
  critical: ['Critique', 'Critical'],
}

/** Synthesizes a minimal fighter snapshot driving the target facial mood for portrait rendering. */
export function livingPortraitFighter(
  base: ArcadeFighter,
  mood: LivingPortraitMood,
): ArcadeFighter {
  if (mood === 'calm') {
    return { ...base, pose: 'idle', hitStun: 0, blockStun: 0, attack: null }
  }
  if (mood === 'strained') {
    return { ...base, pose: 'guard', hitStun: 0, blockStun: 8, attack: null }
  }
  return { ...base, pose: 'hit', hitStun: 12, blockStun: 0, attack: null }
}

/** Computes the character-authentic facial pose for one of the three Living Portrait moods. */
export function livingPortraitPose(id: FighterId, mood: LivingPortraitMood): FightFacePose {
  const base = createFightState(id, id).player
  const fighter = livingPortraitFighter(base, mood)
  const progress = mood === 'critical' ? 0.15 : mood === 'strained' ? 0.2 : 0
  const activity = mood === 'strained' ? 0.65 : 0
  return fightExpressionTarget(fighter, progress, activity).pose
}

/** Localized coarse vitality estimate shown at Level 1+; returns null at Level 0 (naked eye). */
export function livingPortraitTierLabel(input: {
  tier: HealthEstimateTier | null
  language: 'fr' | 'en'
}): string | null {
  if (!input.tier) return null
  return TIER_LABELS[input.tier][input.language === 'fr' ? 0 : 1]
}
