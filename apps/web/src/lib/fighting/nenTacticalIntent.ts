import { FIRST_ARSENAL_AI } from './arsenalAiFirst'
import { SECOND_ARSENAL_AI } from './arsenalAiSecond'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { nenCombatDoctrine } from './nenCombatDoctrine'
import { localPerspective } from './pvp/view'
import { voluntaryNenAvailable } from './nenAccess'
import type { ArcadeFighter, FightSide, FightState, MoveSlot } from './types'
import type { TacticalPlan } from './qwen/protocol'
import type { ArsenalAiPlan } from './arsenalAiTypes'

export interface NenTacticalIntent {
  goal: 'prepare' | 'convert' | 'fight' | 'recover'
  range: readonly [number, number]
  reserve: number
  slots: readonly MoveSlot[]
}
declare module './types' {
  interface ArcadeFighter {
    nenTactics?: NenTacticalIntent
  }
}
const PLANS: Partial<Record<string, ArsenalAiPlan>> = { ...FIRST_ARSENAL_AI, ...SECOND_ARSENAL_AI }
const RESERVE: Partial<Record<string, number>> = {
  hisoka: 84,
  machi: 84,
  kalluto: 84,
  franklin: 64,
}

/** The same authored personal plan is used in either seat. Forecasts are never a planner input. */
export function nenTacticalIntent(state: FightState, side: FightSide): NenTacticalIntent {
  const fighter = state[side]
  const base = nenCombatDoctrine(fighter)
  const view =
    side === 'opponent'
      ? state
      : (localPerspective({ ...state, parallelFuture: undefined }, true) as FightState)
  const gap = Math.abs(view.player.x - view.opponent.x)
  const roll = (((state.rng + Math.floor(state.frame / 90) * 137) >>> 0) % 997) / 997
  const slots = PLANS[fighter.id]?.({ state: view, gap, roll }) ?? []
  const potential = slots.filter((slot) => fundableMove(state, side, slot))
  const nenSlots = potential.filter((slot) => (moveForSlot(fighter.id, slot)?.auraCost ?? 0) > 0)
  const cost = nenSlots.length
    ? Math.min(...nenSlots.map((slot) => moveForSlot(fighter.id, slot)!.auraCost))
    : 0
  const reserve = cost ? Math.min(100, RESERVE[fighter.id] ?? cost + 16) : 0
  const recovering = needsReserve(fighter, { cost, reserve }, personalPreparation(view))
  const goal = tacticalGoal(recovering, personalPreparation(view), nenSlots.length > 0)
  return { goal, reserve, slots: potential, range: recovering ? [26, 34] : base.range }
}
function fundableMove(state: FightState, side: FightSide, slot: MoveSlot): boolean {
  const fighter = state[side],
    move = moveForSlot(fighter.id, slot)
  if (!move || !['special', 'finisher'].includes(move.category)) return false
  // A planning projection restores only spendable aura, never equipment, consent, charges or learned powers.
  const projection = {
    ...fighter,
    aura: 100,
    auraExhausted: false,
    attack: null,
    nenBudget: undefined,
    nenTransfer: undefined,
    nen: { ...fighter.nen, mode: 'ten' as const, ko: null, ryu: {} },
  }
  if (!voluntaryNenAvailable(projection)) return false
  return canUseMovesetMove({ ...state, [side]: projection }, side, move)
}
function needsReserve(
  fighter: ArcadeFighter,
  budget: { cost: number; reserve: number },
  prepared: boolean,
): boolean {
  if (!budget.cost || (prepared && fighter.aura >= budget.cost)) return false
  if (fighter.nenTactics?.goal === 'recover') return fighter.aura < budget.reserve
  const threshold = fighter.nenTactics ? budget.cost + 8 : (RESERVE[fighter.id] ?? budget.cost + 8)
  return fighter.aura < threshold
}
function personalPreparation(view: FightState): boolean {
  const side = 'opponent'
  return Boolean(
    view.bungeeGum?.owner === side ||
    view.player.machiThread?.owner === side ||
    view.opponent.hatsuEffects.cyclotronTurns > 0 ||
    view.opponent.kallutoPaper?.doll,
  )
}

/** Deterministic hysteresis avoids one-frame retreat/approach oscillation around an aura price. */
export function withNenTactics(state: FightState): FightState {
  if (state.frame % 6 !== 0 && state.player.nenTactics && state.opponent.nenTactics) return state
  return {
    ...state,
    player: { ...state.player, nenTactics: nenTacticalIntent(state, 'player') },
    opponent: { ...state.opponent, nenTactics: nenTacticalIntent(state, 'opponent') },
  }
}
export function personalTacticalPlan(
  state: FightState,
  side: FightSide,
  plan: TacticalPlan,
): TacticalPlan {
  if (plan.move !== 'none') return plan
  const intent = state[side].nenTactics ?? nenTacticalIntent(state, side)
  if (intent.goal === 'recover') return { goal: 'recover', nen: 'zetsu', move: 'none' }
  const move = intent.slots.find((slot) => {
    const m = moveForSlot(state[side].id, slot)
    return m && canUseMovesetMove(state, side, m)
  })
  return {
    goal: intent.range[0] >= 14 ? 'zone' : 'pressure',
    nen: plan.nen === 'zetsu' ? 'ten' : plan.nen,
    move: move ?? 'none',
  }
}

function tacticalGoal(
  recovering: boolean,
  prepared: boolean,
  personal: boolean,
): NenTacticalIntent['goal'] {
  if (recovering) return 'recover'
  if (prepared) return 'convert'
  return personal ? 'prepare' : 'fight'
}
