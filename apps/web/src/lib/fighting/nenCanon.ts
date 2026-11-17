import { NEN_CANON_FIRST } from './nenCanonFirst'
import { NEN_CANON_SECOND } from './nenCanonSecond'
import type { FighterMove } from './movesetTypes'
import type { TechniqueCanonContract } from './techniqueContracts'
import type { FighterId, MoveSlot } from './types'

export const NEN_CANON = { ...NEN_CANON_FIRST, ...NEN_CANON_SECOND }

/** Conditions annotate the manual; admission remains in the ability's executable rules. */
export function rosterTechniqueContract(
  move: Pick<FighterMove, 'id' | 'category'>,
): TechniqueCanonContract | null {
  if (!['special', 'finisher'].includes(move.category)) return null
  const [id, slot] = move.id.split(':') as [FighterId, MoveSlot]
  const profile = NEN_CANON[id]
  if (!profile) return null
  if (profile.physicalSlots?.includes(slot)) return physicalTechniqueContract(profile.prohibition)
  return {
    source: `Project canon — ${profile.abilities.join(', ') || 'personal Hatsu unknown'}; data/abilities and ability-modules.`,
    evidence: 'gameplay-abstraction',
    conditions: [profile.condition],
    prohibitions: [profile.prohibition],
    narrativeCost: profile.adaptation,
    narrativeEffect: profile.effect,
  }
}

function physicalTechniqueContract(prohibition: string): TechniqueCanonContract {
  return {
    source: 'Black Whale: Clash — martial or bodily action, not a new personal Hatsu',
    evidence: 'gameplay-abstraction',
    conditions: ['The physical body must satisfy the ordinary action and equipment rules.'],
    prohibitions: [prohibition],
    narrativeCost: 'Physical commitment and recovery; any basic Nen expenditure is duel tuning.',
    narrativeEffect:
      'A bodily action or martial technique; copying a personal Hatsu does not copy the body.',
  }
}
