import { isBiscuitTrueForm } from './biscuitForm'
import { fightingStyle } from './fightStyles'
import { paperDolls } from './kallutoSurveillance'
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
  return Math.round(68 + control * 8 + pace * 30) + (isBiscuitTrueForm(fighter) ? 1 : 0)
}

function investedAura(shot: FightProjectile): number {
  const investment = shot.nenInvestment
  if (!investment || shot.age >= shot.lifetime) return 0
  if (investment.kind === 'shu' && !shot.shuCharged) return 0
  return investment.amount
}

function detachedHatsuMaintenance(
  state: FightState,
  side: FightSide,
  fighter: ArcadeFighter,
): number {
  const otherSide: FightSide = side === 'player' ? 'opponent' : 'player'
  const owlActive = Boolean(
    fighter.musseOwlActive ||
    fighter.secretWindow ||
    (state.musseOwl?.active && state.musseOwl.owner === side),
  )
  const machiBind = Boolean(state[otherSide].machiThread?.owner === side)
  const kallutoDoll = Boolean(
    (state.kallutoDoll?.active && state.kallutoDoll.owner === side) ||
    paperDolls(fighter).some((doll) => doll.active !== false),
  )
  return Number(owlActive) * 8 + Number(machiBind) * 10 + Number(kallutoDoll) * 8
}

function battlefieldHatsuMaintenance(
  state: FightState,
  side: FightSide,
  fighter: ArcadeFighter,
): number {
  const zakuroDrops = Boolean(
    state.zakuroBloodDrops?.owner === side || fighter.bloodyMary?.drops.length,
  )
  const bioPigeon = Boolean(state.hinrighBioPigeon?.active && state.hinrighBioPigeon.owner === side)
  const voconteDoor = Boolean(state.voconteDoors?.networks[side]?.active)
  return Number(zakuroDrops) * 8 + Number(bioPigeon) * 10 + Number(voconteDoor) * 10
}

function maintainedAura(state: FightState, side: FightSide, fighter: ArcadeFighter): number {
  const painSun = Boolean(fighter.hatsuEffects.painPacker?.sun)
  return (
    Number(Boolean(fighter.hanzoProjection)) * 24 +
    Number(Boolean(fighter.melodyPerformance)) * 18 +
    Number(Boolean(fighter.machiSuture)) * 12 +
    Number(painSun) * 20 +
    detachedHatsuMaintenance(state, side, fighter) +
    battlefieldHatsuMaintenance(state, side, fighter)
  )
}

export function readNenBudget(state: FightState, side: FightSide): NenBudget {
  const fighter = state[side],
    capacity = nenOutputCapacity(fighter)
  const detached = state.projectiles
    .filter((shot) => shot.owner === side)
    .reduce((sum, shot) => sum + investedAura(shot), 0)
  const maintained = maintainedAura(state, side, fighter)
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
