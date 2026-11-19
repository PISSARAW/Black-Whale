import { reconcileHalkenburgSouls } from './halkenburgSouls'
import { nextTeamIndex } from './teams/next'
import { fightFormat } from './formats'
import { FIGHT_FPS } from './fightClock'
import { controlledSoulKey } from './halkenburgSoulTypes'
import { teamLiving } from './teamTypes'
import type { SoulBodyRecord } from './halkenburgSoulBodies'
import type { FightSide, FightState } from './types'

/** Reserves stay off stage; the stock ledger may refer to an already collected physical body. */
export function teamSoulBodies(state: FightState): SoulBodyRecord[] {
  if (!state.teamMatch) return []
  return (['player', 'opponent'] as const).flatMap((side) =>
    state.teamMatch!.seats[side].members.map((body, index) => {
      const key = body.halkSoul?.key ?? `team:${side}:${index}`
      return {
        key,
        body: body.halkSoul
          ? body
          : {
              ...body,
              halkSoul: {
                key,
                origin: side,
                offstage: index !== state.teamMatch!.seats[side].active,
                mind: {
                  key: `mind:${side}:${index}`,
                  side,
                  principal: true,
                  identity: body.halkenburgOrigin ?? body.id,
                  teamIndex: index,
                },
              },
            },
      }
    }),
  )
}
export function syncSoulTeamSeats(state: FightState, bodies: SoulBodyRecord[]): FightState {
  const team = state.teamMatch
  if (!team) return state
  const seat = (side: FightSide) => ({
    ...team.seats[side],
    members: team.seats[side].members.map((old, index) => {
      const key = `mind:${side}:${index}`,
        item = state.halkSoulMinds!.find((candidate) => candidate.mind.key === key)
      const body = bodies.find((record) => record.key === item?.body)?.body ?? old
      return {
        ...body,
        halkSoulAlive: item ? item.alive && !item.eliminated : body.health > 0,
        halkTeamMind: key,
      }
    }),
  })
  return {
    ...state,
    teamMatch: { ...team, seats: { player: seat('player'), opponent: seat('opponent') } },
  }
}
/** A temporary assist cannot retreat off stage with a newly persistent transfer. */
export function interruptSoulTeamRelays(state: FightState): FightState {
  const team = state.teamMatch
  if (!team) return state
  return {
    ...state,
    teamMatch: {
      ...team,
      seats: {
        player: { ...team.seats.player, relay: null },
        opponent: { ...team.seats.opponent, relay: null },
      },
    },
  }
}
/** A time/score verdict removes a stock without falsely killing its physical host or mind. */
export function settleSoulTeamVerdict(state: FightState): FightState | null {
  if (!state.halkSoulMinds || !state.teamMatch) return null
  state = reconcileHalkenburgSouls(state)
  const losers = (['player', 'opponent'] as const).filter((side) => state.winner !== side)
  const keys = losers.map((side) => controlledSoulKey(state, side))
  const minds = state.halkSoulMinds!.map((item) =>
    keys.includes(item.mind.key) ? { ...item, eliminated: true } : item,
  )
  const team = structuredClone(state.teamMatch!)
  for (const side of losers) team.seats[side].members[team.seats[side].active].halkSoulAlive = false
  const remaining = (['player', 'opponent'] as const).filter(
    (side) => teamLiving(team.seats[side]) > 0,
  )
  team.winner = remaining.length === 2 ? null : (remaining[0] ?? 'draw')
  return { ...state, halkSoulMinds: minds, teamMatch: team }
}
/** A stock change cannot recreate a dead vessel, replenish a host or erase a transfer chain. */
export function nextSoulTeamRound(state: FightState): FightState | null {
  if (!state.halkSoulLinks?.length || !state.teamMatch) return null
  const team = structuredClone(state.teamMatch)
  for (const side of ['player', 'opponent'] as const) {
    team.seats[side].active = nextTeamIndex(team.seats[side])
    team.seats[side].relay = null
  }
  const format = fightFormat(state.formatId)
  return reconcileHalkenburgSouls({
    ...state,
    teamMatch: team,
    phase: 'ready',
    winner: null,
    matchWinner: null,
    finishReason: null,
    roundNumber: state.roundNumber + 1,
    roundsWon: { player: 1, opponent: 1 },
    hitstop: 0,
    frameAccumulator: 0,
    remainingFrames: format.roundFrames,
    time: format.roundFrames / FIGHT_FPS,
    score: { player: 0, opponent: 0 },
    knockdowns: { player: 0, opponent: 0 },
    previousPositions: undefined,
  })
}
