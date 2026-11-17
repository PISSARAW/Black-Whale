import { chrolloHasActivePage } from './chrolloBook'
import { NEN_CANON } from './nenCanon'
import { canAct } from './fightActorState'
import type { ArsenalCommand } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'

/** Ch. 406 establishes a daily limit, without revealing its value. Two calls are duel tuning. */
export const LOVE_DIAL_SCENARIO_CALLS = 2
export const LOVE_DIAL_DAY = 24 * 60 * 60 * 60

export function performHistoricalPhone(
  state: FightState,
  side: FightSide,
  command: ArsenalCommand,
): FightState {
  const actor = state[side]
  if (!chrolloHasActivePage(actor, 'love-dial-6700') || !canAct(actor) || actor.attack) return state
  return command.action === 'history-phone-criteria'
    ? enterCriteria(state, side, command.target)
    : callPhone(state, side)
}

function enterCriteria(state: FightState, side: FightSide, criterion?: string): FightState {
  if (!criterion || !criterion.startsWith('ability:')) return state
  const source = criterion.slice(8)
  if (!(source in NEN_CANON)) return state
  const previous = currentPhone(state, side)
  // The displayed number is a conjured search code, not the character's personal phone number.
  const index = Object.keys(NEN_CANON).indexOf(source)
  const phone = {
    ...previous,
    criterion,
    number: `6700${String(index).padStart(2, '0')}`,
    guidance: undefined,
  }
  return {
    ...state,
    [side]: {
      ...state[side],
      arenaRecovery: 12,
      chrolloHistorical: { ...state[side].chrolloHistorical, phone },
    },
  }
}

function callPhone(state: FightState, side: FightSide): FightState {
  const phone = currentPhone(state, side)
  if (
    !phone.number ||
    !phone.criterion ||
    phone.calls >= LOVE_DIAL_SCENARIO_CALLS ||
    state[side].aura < 5
  )
    return state
  const other = side === 'player' ? 'opponent' : 'player'
  const found = phone.criterion === `ability:${state[other].id}`
  const gap = Math.abs(state[side].x - state[other].x)
  const guidance = !found
    ? { kind: 'absent' as const }
    : gap > 45
      ? { kind: 'nearby' as const }
      : { kind: 'located' as const, x: state[other].x, y: state[other].y }
  return {
    ...state,
    [side]: {
      ...state[side],
      aura: state[side].aura - 5,
      arenaRecovery: 18,
      chrolloHistorical: {
        ...state[side].chrolloHistorical,
        phone: { ...phone, calls: phone.calls + 1, target: found ? other : null, guidance },
      },
    },
  }
}

function currentPhone(state: FightState, side: FightSide) {
  const phone = state[side].chrolloHistorical?.phone
  if (phone && state.frame - phone.dayFrame < LOVE_DIAL_DAY) return phone
  return { target: null, calls: 0, dayFrame: state.frame, number: '' }
}
