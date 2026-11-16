import type { FightSide, FightState } from './types'

export function doorNetworkBusy(state: FightState, side: FightSide): boolean {
  const network = state.voconteDoors?.networks[side]
  return Boolean(network?.active || network?.pending)
}

export function borrowedDoorActive(state: FightState, side: FightSide): boolean {
  return (
    state[side].kurapika?.held?.source === 'voconte' &&
    Boolean(state.voconteDoors?.networks[side]?.active)
  )
}
