import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'
import type { MoonlightAgreement } from './moonlightContract'
import { agreementClause, rewardSignatory } from './moonlightClauses'

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
/** The loan goes to the recipient alone; an aura clause pays both signatories, never a third. */
export function rewardMoonlightParty(state: FightState, pact: MoonlightAgreement): FightState {
  const clause = agreementClause(pact)
  const sides: FightSide[] =
    clause.reward === 'one-use-of-moonlight-act' ? [pact.recipient] : [pact.issuer, pact.recipient]
  const reward = (fighter: ArcadeFighter) => rewardSignatory(fighter, clause)
  return sides.reduce((next, side) => rewardSigner(next, { side, pact, reward }), state)
}
function rewardSigner(
  state: FightState,
  options: {
    side: FightSide
    pact: MoonlightAgreement
    reward: (f: ArcadeFighter) => ArcadeFighter
  },
): FightState {
  const { side, pact, reward } = options
  if (moonlightBinds(state, side, pact)) return { ...state, [side]: reward(state[side]) }
  if (!state.teamMatch) return state
  const team = structuredClone(state.teamMatch)
  const members = team.seats[side].members
  const index = members.findIndex((member) => member.id === pact.signers?.[side])
  if (index >= 0) members[index] = reward(members[index])
  return { ...state, teamMatch: team }
}
