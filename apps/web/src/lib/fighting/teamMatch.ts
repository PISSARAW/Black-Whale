import { beginFight, createFight, nextRound, performMove, tickFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { FIXED_STEP } from './fightClock'
import {
  EMPTY_INPUT,
  type FighterId,
  type FightInput,
  type FightSide,
  type FightState,
} from './types'
import { teamLiving, type TeamMatch, type TeamSeat } from './teamTypes'
import { atTeamGate, teamEntry, teamRelayReady } from './teamRelayRules'
import type { FightEnvironment } from './fightEnvironment'

const SIDES = ['player', 'opponent'] as const
const other = (side: FightSide): FightSide => (side === 'player' ? 'opponent' : 'player')
function validTeam(ids: FighterId[]) {
  return (
    ids.length === 3 &&
    new Set(ids).size === 3 &&
    ids.every((id) => FIGHTING_ROSTER.some((fighter) => fighter.id === id))
  )
}
export function createTeamFight(
  rosters: Record<FightSide, FighterId[]>,
  environment?: Partial<FightEnvironment>,
): FightState {
  if (!SIDES.every((side) => validTeam(rosters[side]))) throw Error('INVALID_TEAM')
  const state = createFight(rosters.player[0], rosters.opponent[0], {
    mode: 'versus-local',
    formatId: 'knockout',
    environment,
  })
  const seat = (side: FightSide): TeamSeat => ({
    roster: [...rosters[side]],
    active: 0,
    assistUsed: false,
    relay: null,
    members: rosters[side].map((id) => createFight(id, id, { formatId: 'knockout' })[side]),
  })
  return {
    ...state,
    roundsWon: { player: 1, opponent: 1 },
    teamMatch: { seats: { player: seat('player'), opponent: seat('opponent') }, winner: null },
  }
}
function sync(state: FightState): FightState {
  const previous = state.teamMatch!
  const seat = (side: FightSide): TeamSeat => {
    const stored = previous.seats[side]
    return {
      ...stored,
      relay: stored.relay ? { ...stored.relay } : null,
      members: stored.members.map((member, index) =>
        index === stored.active ? state[side] : member,
      ),
    }
  }
  return {
    ...state,
    teamMatch: { ...previous, seats: { player: seat('player'), opponent: seat('opponent') } },
  }
}
export function requestTeamAssist(state: FightState, side: FightSide, index: number): FightState {
  const seat = state.teamMatch?.seats[side]
  if (!seat || state.phase !== 'fighting' || seat.assistUsed || seat.relay) return state
  if (!reserveAvailable(seat, index)) return state
  if (!atTeamGate(state, side) || !teamRelayReady(state, side)) return state
  const next = sync(state),
    team = next.teamMatch!,
    selected = team.seats[side]
  selected.relay = { leader: selected.active, phase: 'approach', frames: 0 }
  selected.active = index
  selected.assistUsed = true
  return { ...next, [side]: teamEntry(selected.members[index], side), previousPositions: undefined }
}
function reserveAvailable(seat: TeamSeat, index: number) {
  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < 3 &&
    index !== seat.active &&
    seat.members[index].health > 0
  )
}
function approachRelay(state: FightState, side: FightSide) {
  const relay = state.teamMatch!.seats[side].relay!
  if (relay.phase !== 'approach') return
  if (Math.abs(state[side].x - state[other(side)].x) <= 9 || relay.frames >= 120)
    relay.phase = 'strike'
}
function relayDirection(state: FightState, side: FightSide) {
  if (state.teamMatch!.seats[side].relay!.phase === 'approach')
    return Math.sign(state[other(side)].x - state[side].x)
  return side === 'player' ? -1 : 1
}
function relayFrame(
  state: FightState,
  side: FightSide,
): { state: FightState; input: FightInput | null } {
  const seat = state.teamMatch!.seats[side],
    relay = seat.relay
  if (!relay) return { state, input: null }
  if ([state.hitstop, state.parallelFuture, state.catsName].some(Boolean))
    return { state, input: EMPTY_INPUT }
  relay.frames++
  approachRelay(state, side)
  if (relay.phase === 'strike') {
    const next = performMove({ state, side, action: 'light', input: EMPTY_INPUT })
    relay.phase = 'retreat'
    return { state: next, input: EMPTY_INPUT }
  }
  if (relay.phase === 'retreat' && atTeamGate(state, side) && teamRelayReady(state, side)) {
    seat.members[seat.active] = state[side]
    seat.active = relay.leader
    seat.relay = null
    return {
      state: {
        ...state,
        [side]: teamEntry(seat.members[seat.active], side),
        previousPositions: undefined,
      },
      input: EMPTY_INPUT,
    }
  }
  const direction = relayDirection(state, side)
  return { state, input: { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 } }
}
export function tickTeamFight(
  state: FightState,
  inputs: Record<FightSide, FightInput>,
  dt: number,
): FightState {
  if (!state.teamMatch || state.phase !== 'fighting' || !Number.isFinite(dt)) return state
  let next = sync(state)
  let budget = next.frameAccumulator + Math.min(0.05, Math.max(0, dt))
  while (budget + 1e-9 >= FIXED_STEP && next.phase === 'fighting') {
    const p1 = relayFrame(next, 'player'),
      p2 = relayFrame(p1.state, 'opponent')
    next = tickFight({ ...p2.state, frameAccumulator: 0 }, p1.input ?? inputs.player, {
      dt: FIXED_STEP,
      opponentInput: p2.input ?? inputs.opponent,
      ai: false,
    })
    next = sync(next)
    budget = Math.max(0, budget - FIXED_STEP)
  }
  return { ...settleTeamRound(next), frameAccumulator: budget }
}
function settleTeamRound(state: FightState): FightState {
  if (state.phase !== 'finished') return state
  const team = structuredClone(state.teamMatch!)
  for (const side of SIDES) {
    // Timeout/technical defeat eliminates the actual body too; no extra reserve from a relay.
    if (state.winner === other(side) || state.winner === 'draw')
      team.seats[side].members[team.seats[side].active].health = 0
  }
  const alive = SIDES.filter((side) => teamLiving(team.seats[side]) > 0)
  team.winner = alive.length === 2 ? null : (alive[0] ?? 'draw')
  return { ...state, teamMatch: team }
}
export function nextTeamRound(state: FightState): FightState {
  if (!state.teamMatch || state.phase !== 'finished' || state.teamMatch.winner) return state
  const team: TeamMatch = structuredClone(state.teamMatch)
  const bodies = {} as Pick<FightState, 'player' | 'opponent'>
  for (const side of SIDES) {
    const seat = team.seats[side]
    const leader = seat.relay?.leader ?? seat.active
    seat.active =
      seat.members[leader].health > 0 ? leader : seat.members.findIndex((actor) => actor.health > 0)
    seat.relay = null
    bodies[side] = seat.members[seat.active]
  }
  const round = nextRound({ ...state, ...bodies, matchWinner: null, teamMatch: team })
  for (const side of SIDES)
    round[side] = {
      ...round[side],
      health: bodies[side].health,
      aura: bodies[side].aura,
      auraExhausted: bodies[side].auraExhausted,
    }
  return sync({ ...round, roundsWon: { player: 1, opponent: 1 } })
}
export const startTeamFight = (state: FightState) => beginFight(state)
