import { fightingStyle } from './fightStyles'
import { fighterNenTraining } from './nenMastery'
import type { ArcadeFighter, FightProjectile, FightSide, FightState } from './types'

export interface NenBudget {
  reserve: number
  capacity: number
  detached: number
  maintained: number
  available: number
}
declare module './types' {
  interface ArcadeFighter {
    nenBudget?: NenBudget
  }
  interface FightProjectile {
    nenInvestment?: { amount: number; kind: 'emission' | 'shu' }
  }
}

/** Output points are arcade tuning, independently of the remaining aura reserve. */
export function nenOutputCapacity(fighter: ArcadeFighter): number {
  const control = fighterNenTraining(fighter, 'enhancer').level
  const style = fightingStyle(fighter.nenOwner ?? fighter.id)
  const pace = Math.max(-0.2, Math.min(0.2, style.moveScale - 1))
  return Math.round(68 + control * 8 + pace * 30)
}

function investedAura(shot: FightProjectile): number {
  const investment = shot.nenInvestment
  if (!investment || shot.age >= shot.lifetime) return 0
  if (investment.kind === 'shu' && !shot.shuCharged) return 0
  return investment.amount
}

function maintainedAura(fighter: ArcadeFighter): number {
  // Only actions which already require continued presence/control in the duel.
  return (
    Number(Boolean(fighter.hanzoProjection)) * 24 +
    Number(Boolean(fighter.melodyPerformance)) * 18 +
    Number(Boolean(fighter.machiSuture)) * 12
  )
}

export function readNenBudget(state: FightState, side: FightSide): NenBudget {
  const fighter = state[side],
    capacity = nenOutputCapacity(fighter)
  const detached = state.projectiles
    .filter((shot) => shot.owner === side)
    .reduce((sum, shot) => sum + investedAura(shot), 0)
  const maintained = maintainedAura(fighter)
  return {
    reserve: fighter.aura,
    capacity,
    detached,
    maintained,
    available: Math.max(0, capacity - detached - maintained),
  }
}

/** Recomputed from live effects: no double spending, refunds or new upkeep on persistent vows. */
export function withNenBudgets(state: FightState): FightState {
  return {
    ...state,
    player: { ...state.player, nenBudget: readNenBudget(state, 'player') },
    opponent: { ...state.opponent, nenBudget: readNenBudget(state, 'opponent') },
  }
}

export function nenBodyOutput(fighter: ArcadeFighter): number {
  const budget = fighter.nenBudget
  return budget ? Math.max(0, Math.min(1, budget.available / budget.capacity)) : 1
}

export function nenOutputAllows(fighter: ArcadeFighter, cost: number): boolean {
  const budget = fighter.nenBudget
  if (!budget) return true
  return budget.available >= Math.min(budget.capacity * 0.7, Math.max(4, cost))
}
