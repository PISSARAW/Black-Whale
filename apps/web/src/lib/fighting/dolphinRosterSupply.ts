import type { RosterGuest } from './rosterGuests'
import type { FightState } from './types'

/** Lender and physical recipient refer to one stolen reserve, never two spendable pools. */
export function syncRosterDolphinSupply(state: FightState, guest: RosterGuest): FightState {
  const recipient = state.rosterGuests?.find((entry) => entry.id === guest.id)
  const held = recipient?.fighter.kurapika?.held
  const lender = state[guest.owner]
  const chain = lender.kurapika
  if (!held || chain?.held?.lentTo !== guest.id) return state
  return {
    ...state,
    [guest.owner]: {
      ...lender,
      kurapika: {
        ...chain,
        held: {
          ...chain.held,
          auraSupply: held.auraSupply,
          sustainedKeys: held.sustainedKeys,
        },
      },
    },
  }
}
