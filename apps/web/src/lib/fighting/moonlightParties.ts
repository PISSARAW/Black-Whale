import type { FightSide, FightState, FighterId } from './types'
import type { MoonlightAgreement } from './moonlightContract'

export function moonlightBinds(
  state: FightState,
  side: FightSide,
  pact: MoonlightAgreement,
): boolean {
  return !pact.signers || pact.signers[side] === state[side].id
}
export function teamMoonlightSigners(state: FightState): Record<FightSide, FighterId> | undefined {
  return state.teamMatch ? { player: state.player.id, opponent: state.opponent.id } : undefined
}
export function moonlightPartiesVisible(state: FightState, pact: MoonlightAgreement): boolean {
  return (['player', 'opponent'] as const).every((side) => moonlightBinds(state, side, pact))
}
export function rewardMoonlightParty(state: FightState, pact: MoonlightAgreement): FightState {
  const side = pact.recipient
  if (moonlightBinds(state, side, pact)) {
    const actor = state[side]
    return { ...state, [side]: { ...actor, moonlightLoan: (actor.moonlightLoan ?? 0) + 1 } }
  }
  if (!state.teamMatch) return state
  const team = structuredClone(state.teamMatch)
  const actor = team.seats[side].members.find((member) => member.id === pact.signers?.[side])
  if (actor) actor.moonlightLoan = (actor.moonlightLoan ?? 0) + 1
  return { ...state, teamMatch: team }
}
