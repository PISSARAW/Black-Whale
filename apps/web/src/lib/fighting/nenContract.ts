import type { ArcadeFighter, FightInput } from './types'

export type NenContractSource = 'seiyaku' | 'moonlight' | 'judgment'
export type NenContractRestriction =
  | 'no-attacks'
  | 'no-techniques'
  | 'no-ken'
  | 'no-gyo'
  | 'no-retreat'
  | 'forced-zetsu'
  | 'no-troupe-contact'
  | 'truthful-answers'
  | 'no-disclosure'
  | 'return-hostage'
export type NenContractReward =
  'none' | 'aura' | 'hatsu-power' | 'hatsu-discount' | 'transfer-speed' | 'borrowed-use'
export type NenContractPenalty =
  'none' | 'aura-exhaustion' | 'on-seal' | 'raised-zetsu-threshold' | 'one-week-zetsu' | 'death'

export interface NenContractDefinition {
  id: string
  source: NenContractSource
  restrictions: readonly NenContractRestriction[]
  reward: NenContractReward
  penalty: NenContractPenalty
  /** Null means the contract lasts until its own completion condition or the end of the round. */
  durationFrames: number | null
  disclosure: 'public' | 'signatories' | 'implanted-target'
  consent: 'self' | 'two-signatures' | 'physical-implantation'
}

export interface NenContractObservation {
  fighter: ArcadeFighter
  input?: FightInput
  retreatFrames?: number
}

const RESTRICTION_WEIGHT: Record<NenContractRestriction, number> = {
  'no-attacks': 5,
  'no-techniques': 3,
  'no-ken': 2,
  'no-gyo': 2,
  'no-retreat': 3,
  'forced-zetsu': 5,
  'no-troupe-contact': 2,
  'truthful-answers': 2,
  'no-disclosure': 2,
  'return-hostage': 4,
}
const REWARD_WEIGHT: Record<NenContractReward, number> = {
  none: 0,
  aura: 2,
  'hatsu-power': 3,
  'hatsu-discount': 2,
  'transfer-speed': 2,
  'borrowed-use': 4,
}
const PENALTY_CREDIT: Record<NenContractPenalty, number> = {
  none: 0,
  'aura-exhaustion': 2,
  'on-seal': 1,
  'raised-zetsu-threshold': 1,
  'one-week-zetsu': 3,
  death: 5,
}

export function nenContractBudget(contract: NenContractDefinition): {
  capacity: number
  cost: number
  valid: boolean
} {
  const restriction = contract.restrictions.reduce((sum, item) => sum + RESTRICTION_WEIGHT[item], 0)
  const durationCredit =
    contract.durationFrames === null ? 1 : contract.durationFrames >= 480 ? 2 : 1
  const capacity = restriction + PENALTY_CREDIT[contract.penalty] + durationCredit
  const cost = REWARD_WEIGHT[contract.reward]
  return { capacity, cost, valid: cost <= capacity }
}

export function validateNenContract(contract: NenContractDefinition): readonly string[] {
  const errors: string[] = []
  if (!contract.id.trim()) errors.push('missing-id')
  if (new Set(contract.restrictions).size !== contract.restrictions.length)
    errors.push('duplicate-restriction')
  if (contract.durationFrames !== null && contract.durationFrames <= 0)
    errors.push('invalid-duration')
  if (!nenContractBudget(contract).valid) errors.push('reward-exceeds-vow')
  return errors
}

/** Shared admission rule used by contracts that restrict an action after it is prepared. */
function permitsAuraState(
  restrictions: NenContractDefinition['restrictions'],
  fighter: ArcadeFighter,
): boolean {
  if (restrictions.includes('no-ken') && fighter.nen.ken) return false
  if (restrictions.includes('no-gyo') && fighter.nen.gyo) return false
  return !restrictions.includes('forced-zetsu') || fighter.nen.mode === 'zetsu'
}

export function nenContractPermitsAction(
  contract: NenContractDefinition,
  fighter: ArcadeFighter,
): boolean {
  const restrictions = contract.restrictions
  if (!permitsAuraState(restrictions, fighter)) return false
  // This evaluator is called only after a signatory has initiated an action.
  // A no-attack clause therefore rejects the attempt even if the engine has not
  // materialised an AttackState yet (for instance during input admission).
  if (restrictions.includes('no-attacks')) return false
  if (restrictions.includes('no-techniques')) {
    const attack = fighter.attack
    if (!attack || attack.auraCharged || attack.hatsuSource) return false
    return attack.kind === 'light' || attack.kind === 'heavy'
  }
  return true
}

export function nenContractBreached(
  contract: NenContractDefinition,
  observation: NenContractObservation,
): boolean {
  if (!nenContractPermitsAction(contract, observation.fighter)) return true
  return contract.restrictions.includes('no-retreat') && (observation.retreatFrames ?? 0) > 10
}
