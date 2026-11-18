import { FIGHTING_ROSTER } from '../roster'
import { movesetFor } from '../movesets'
import { enProfile } from '../en/profiles'
import { NEN_PLANS } from './protocol'
import type { FighterId } from '../types'
import type { CombatObservation } from './protocol'

const fighters = new Set<string>(FIGHTING_ROSTER.map((fighter) => fighter.id))
export function isQwenFighter(value: unknown): value is FighterId {
  return typeof value === 'string' && fighters.has(value) && movesetFor(value as FighterId) !== null
}
export function allowedNen(fighter: FighterId) {
  return NEN_PLANS.filter((nen) => nen !== 'en' || enProfile({ id: fighter }).radiusUnits !== null)
}

/** Names, costs and rules always come from the game's existing catalogue. */
export function offeredMoves(observation: CombatObservation) {
  const moves = movesetFor(observation.fighter)?.moves ?? []
  const available = new Set(observation.moves.filter((move) => move.ready).map((move) => move.slot))
  return moves
    .filter((move) => available.has(move.slot) && move.auraCost <= observation.self.aura)
    .filter((move) => ['special', 'finisher'].includes(move.category))
    .filter((move) => originalPairConditions(observation, move.slot))
}
function originalPairConditions(observation: CombatObservation, slot: string): boolean {
  const { fighter, self } = observation
  if (fighter === 'hisoka' && ['forwardSpecial', 'backSpecial', 'finisher'].includes(slot))
    return self.linked
  if (fighter !== 'machi') return true
  if (slot === 'neutralSpecial') return self.wounds > 0
  return !['backSpecial', 'finisher'].includes(slot) || self.linked
}

export function fighterRules(fighter: FighterId): string {
  const catalogue = movesetFor(fighter)!
  return `${catalogue.mechanicEn} Finisher: ${catalogue.finisherConditionEn}`
}
