import type { DolphinBodyRef } from './dolphinLoanTypes'
import type { ArcadeFighter, FightState } from './types'

export function dolphinBody(state: FightState, ref: DolphinBodyRef): ArcadeFighter | undefined {
  const seat = state.teamMatch?.seats[ref.owner]
  const active = seat?.active ?? 0
  return ref.member === active ? state[ref.owner] : seat?.members[ref.member]
}
export function changeDolphinBody(
  state: FightState,
  ref: DolphinBodyRef,
  change: (body: ArcadeFighter) => ArcadeFighter,
): FightState {
  const body = dolphinBody(state, ref)
  if (!body) return state
  const next = change(body)
  if (next === body) return state
  const seat = state.teamMatch?.seats[ref.owner]
  if (!seat || seat.active === ref.member) return { ...state, [ref.owner]: next }
  return {
    ...state,
    teamMatch: {
      ...state.teamMatch!,
      seats: {
        ...state.teamMatch!.seats,
        [ref.owner]: {
          ...seat,
          members: seat.members.map((member, index) => (index === ref.member ? next : member)),
        },
      },
    },
  }
}
