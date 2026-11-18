import { atTeamGate, teamRelayBlock } from '../teamRelayRules'
import type { FightSide, FightState } from '../types'
import type { TeamSeat } from '../teamTypes'
import { teamMemberAlive } from '../teamTypes'
export type TeamAssistBlock =
  'phase' | 'used' | 'relay' | 'reserve' | 'gate' | 'body' | 'commitment'
export function teamAssistBlock(
  state: FightState,
  side: FightSide,
  index: number,
): TeamAssistBlock | null {
  return structuralBlock(state, side, index) ?? teamRelayBlock(state, side)
}
/** Public composition and gate conditions only; do not turn hidden Nen into a passive radar. */
function structuralBlock(
  state: FightState,
  side: FightSide,
  index: number,
): TeamAssistBlock | null {
  const seat = state.teamMatch?.seats[side]
  if (!seat || state.phase !== 'fighting') return 'phase'
  if (seat.relay) return 'relay'
  if (seat.assistUsed) return 'used'
  if (!reserveAvailable(seat, index)) return 'reserve'
  return atTeamGate(state, side) ? null : 'gate'
}
export function teamAssistOptions(state: FightState, side: FightSide) {
  return (state.teamMatch?.seats[side].members ?? []).map((_member, index) =>
    structuralBlock(state, side, index),
  )
}
function reserveAvailable(seat: TeamSeat, index: number) {
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < seat.members.length &&
    index !== seat.active &&
    teamMemberAlive(seat.members[index])
  )
}
export const TEAM_ASSIST_LABELS: Record<TeamAssistBlock, readonly [string, string]> = {
  phase: ['La manche doit être en cours.', 'The round must be running.'],
  used: [
    'Le relais de cette équipe a déjà été utilisé pour ce set.',
    'This team has already used its relay for this set.',
  ],
  relay: ['Un allié est déjà en relais.', 'An ally is already relaying.'],
  reserve: ['Choisis une réserve encore en lice.', 'Choose a reserve still in the set.'],
  gate: [
    'Rejoins ton bord : P1 à gauche, P2 à droite.',
    'Reach your gate: P1 on the left, P2 on the right.',
  ],
  body: [
    'Attends au sol, corps libre et sans action engagée.',
    'Wait grounded, with a free body and no committed action.',
  ],
  commitment: [
    'Le relais n’a pas pu démarrer. Attends la résolution des actions en cours.',
    'The relay could not start. Wait for ongoing actions to resolve.',
  ],
}
