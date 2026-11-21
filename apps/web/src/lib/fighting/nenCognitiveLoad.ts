import { hatsuSourceFor } from './hatsu'
import { nenMasteryProfile } from './nenMastery'
import type { AttackKind, FightSide, FightState } from './types'

/** Integer hundredths of a fatigue point: 10_000 is 100%. */
export const MAX_NEN_MENTAL_FATIGUE = 10_000

declare module './types' {
  interface ArcadeFighter {
    /** Optional only for replay snapshots created before this system. */
    nenMentalFatigue?: number
  }
}

export type NenAttentionMode = 'passive' | 'maintained' | 'directed'

export interface NenAttentionCommitment {
  id: string
  mode: NenAttentionMode
  cost: number
}

export interface NenCognitiveLoad {
  load: number
  capacity: number
  ratio: number
  strained: boolean
  overloaded: boolean
  commitments: readonly NenAttentionCommitment[]
}

export interface NenCognitiveAction {
  kind: AttackKind
  moveId?: string
}

export function nenMentalFatigueRatio(fighter: FightState[FightSide]): number {
  return Math.max(0, Math.min(1, (fighter.nenMentalFatigue ?? 0) / MAX_NEN_MENTAL_FATIGUE))
}

/**
 * Mental bandwidth is independent from aura reserve and output. Values are duel tuning:
 * mastery evidence raises capacity, while simultaneous directed work raises load.
 */
export function nenCognitiveBaseCapacity(state: FightState, side: FightSide): number {
  const fighter = state[side]
  const profile = nenMasteryProfile(fighter.nenOwner ?? fighter.id)
  const trainedCategories = Object.values(profile.training).filter(
    (training) => training.level === 2,
  ).length
  return Math.min(100, 72 + profile.training.enhancer.level * 8 + trainedCategories * 4)
}

/** Long-term fatigue can remove at most 35% of bandwidth; it never rewrites mastery. */
export function nenCognitiveCapacity(state: FightState, side: FightSide): number {
  const fatigue = nenMentalFatigueRatio(state[side])
  return nenCognitiveBaseCapacity(state, side) * (1 - fatigue * 0.35)
}

/** Recomputed exclusively from live effects, so rollback and replay cannot accumulate drift. */
export function readNenCognitiveLoad(state: FightState, side: FightSide): NenCognitiveLoad {
  const fighter = state[side]
  const commitments: NenAttentionCommitment[] = []
  const add = (id: string, mode: NenAttentionMode, cost: number) => {
    if (cost > 0) commitments.push({ id, mode, cost: Math.round(cost) })
  }

  if (fighter.nen.en) add('en', 'directed', 12 + Math.min(8, fighter.nen.en.radius / 2))
  if (fighter.nen.gyo) add('gyo', 'directed', 7)
  if (fighter.nen.in) add('in', 'maintained', 4)
  if (fighter.nen.ken) add('ken', 'passive', 2)
  if (fighter.nen.ko) add('ko', 'directed', 5)
  if (fighter.nenTransfer) add('ryu-transfer', 'directed', 10)
  if (fighter.nen.shu.length) add('shu', 'maintained', fighter.nen.shu.length * 3)

  if (fighter.hanzoProjection) add('hanzo-projection', 'directed', 26)
  if (fighter.melodyPerformance) add('melody-performance', 'directed', 24)
  if (fighter.machiSuture) add('machi-suture', 'directed', 22)
  if (fighter.attack?.hatsuSource) {
    const unfamiliar = fighter.attack.hatsuSource !== (fighter.nenOwner ?? fighter.id)
    add('active-hatsu', 'directed', unfamiliar ? 16 : 12)
  }

  const shots = state.projectiles.filter(
    (shot) =>
      shot.owner === side &&
      shot.age < shot.lifetime &&
      (shot.matter === 'nen' || Boolean(shot.nenInvestment)),
  ).length
  if (shots) add('detached-nen', 'maintained', concurrentCost(shots, 5, 2))

  const gumLinks = state.gumNetwork?.links.filter((link) => link.owner === side).length ?? 0
  if (gumLinks) add('bungee-links', 'directed', concurrentCost(gumLinks, 4, 2))

  const load = commitments.reduce((sum, commitment) => sum + commitment.cost, 0)
  const capacity = nenCognitiveCapacity(state, side)
  const ratio = capacity > 0 ? load / capacity : 1
  return {
    load,
    capacity,
    ratio,
    strained: ratio >= 0.7,
    overloaded: ratio >= 1,
    commitments,
  }
}

/** Cost of opening one more voluntary Nen operation; unfamiliar sources demand more attention. */
export function nenCognitiveActionCost(
  state: FightState,
  side: FightSide,
  action: NenCognitiveAction,
): number {
  const fighter = state[side]
  // The shared action admission calls this only after classifying the command as voluntary Nen.
  // Keeping ordinary strikes at zero also makes the public helper safe for direct callers.
  if (action.kind !== 'special' && action.kind !== 'ranged') return 0
  const base = action.kind === 'ranged' ? 10 : action.kind === 'special' ? 18 : 6
  const source = hatsuSourceFor(fighter, action.moveId)
  const unfamiliar = source && source !== (fighter.nenOwner ?? fighter.id) ? 1.35 : 1
  return Math.ceil(base * unfamiliar)
}

/** At capacity, an existing effect remains stable but no new directed operation may start. */
export function nenCognitiveAllows(
  state: FightState,
  side: FightSide,
  action: NenCognitiveAction,
): boolean {
  const cost = nenCognitiveActionCost(state, side, action)
  if (cost === 0) return true
  const cognitive = readNenCognitiveLoad(state, side)
  return cognitive.load + cost <= cognitive.capacity
}

/**
 * Advances only authoritative simulation frames. Instantaneous load stays derived, while this
 * quantised residue is the sole cognitive value that rollback snapshots must retain.
 */
export function advanceNenMentalFatigue(state: FightState): FightState {
  if (state.forecastSimulation) return state
  const player = advanceSideFatigue(state, 'player')
  const opponent = advanceSideFatigue(state, 'opponent')
  if (player === state.player && opponent === state.opponent) return state
  return { ...state, player, opponent }
}

function advanceSideFatigue(state: FightState, side: FightSide): FightState[FightSide] {
  const fighter = state[side]
  const { ratio } = readNenCognitiveLoad(state, side)
  const delta = fatigueDelta(ratio)
  const current = fighter.nenMentalFatigue ?? 0
  const next = Math.max(0, Math.min(MAX_NEN_MENTAL_FATIGUE, current + delta))
  return next === current ? fighter : { ...fighter, nenMentalFatigue: next }
}

function fatigueDelta(loadRatio: number): number {
  if (loadRatio > 0.7) return Math.max(1, Math.ceil((loadRatio - 0.7) ** 2 * 24))
  return loadRatio < 0.5 ? -1 : 0
}

function concurrentCost(count: number, first: number, extra: number): number {
  // Each additional independently steered element creates another coordination relationship.
  return count * first + ((count * (count - 1)) / 2) * extra
}
