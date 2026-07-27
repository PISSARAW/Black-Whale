import type { CanonStatus, NenCategory } from './identity.js'

export type AbilityRuleType =
  'activation' | 'cost' | 'target' | 'effect' | 'termination' | 'restriction'
export type AbilityState = 'inactive' | 'active' | 'post_mortem' | 'broken' | 'transferred'

export interface NenAbility {
  id: string
  ownerId: string
  name: string
  category: NenCategory
  description: string
  canonStatus: CanonStatus
  /** Key linking to an ability-module implementation */
  moduleKey?: string
}

export interface AbilityRule {
  id: string
  abilityId: string
  ruleType: AbilityRuleType
  expression: string
  priority: number
}

export interface AbilityActivation {
  id: string
  abilityId: string
  actorId: string
  startedAtEventId: string
  endedAtEventId?: string
  state: AbilityState
}

export interface NenEffect {
  id: string
  activationId: string
  targetId: string
  effectType: string
  payload: Record<string, unknown>
  startedAtEventId: string
  endedAtEventId?: string
}
