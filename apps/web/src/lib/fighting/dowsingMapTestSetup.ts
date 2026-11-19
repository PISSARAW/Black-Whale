import { beginFight, createFight, tickFight } from './engine'
import { EMPTY_INPUT, type FighterId, type FightSide, type FightState } from './types'

export function mapSetup(side: FightSide = 'player', subject: FighterId = 'hisoka'): FightState {
  const base = beginFight(
    createFight(
      side === 'player' ? 'kurapika' : subject,
      side === 'opponent' ? 'kurapika' : subject,
      {
        mode: 'versus-local',
        formatId: 'knockout',
        environment: {
          preparation: { mode: 'scenario', resources: ['maps', 'devices'], cohorts: [] },
        },
      },
    ),
  )
  return mapFrames(
    {
      ...base,
      player: { ...base.player, x: side === 'player' ? 25 : 60, aura: 100 },
      opponent: { ...base.opponent, x: side === 'player' ? 40 : 75, aura: 100 },
    },
    1,
  )
}

export function mapFrames(state: FightState, count = 30): FightState {
  for (let index = 0; index < count; index++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
  return state
}

export function searchBodyKey(state: FightState, side: FightSide = 'player'): string {
  return state[side].personalEncounters![0].bodyKey
}
