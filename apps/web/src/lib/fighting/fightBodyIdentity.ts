import { battleAppearance } from './battleCantabileRules'
import type { ArcadeFighter, FighterId, FightSide, FightState } from './types'

/** An opaque physical body reference, independent of disguise, copied Hatsu or active relay. */
export function physicalBodyKey(state: FightState, side: FightSide): string {
  const owner = state.pvpSeat === 'opponent' ? (side === 'player' ? 'opponent' : 'player') : side
  return `${owner}:${state.teamMatch?.seats[side].active ?? 0}`
}
export function visibleBodyAppearance(actor: ArcadeFighter): FighterId {
  return battleAppearance({ ...actor, id: actor.nenOwner ?? actor.id })
}

/** Reserves remain at their actual team's gate; a relay never transfers their possessions or haunting. */
export function physicalBodyAt(
  state: FightState,
  side: FightSide,
  member?: number,
): ArcadeFighter | undefined {
  const seat = state.teamMatch?.seats[side]
  if (!seat) return member === undefined || member === 0 ? state[side] : undefined
  if (member === undefined || seat.active === member) return state[side]
  const body = seat.members[member]
  return body ? { ...body, x: side === 'player' ? 7 : 93, y: 0 } : undefined
}
