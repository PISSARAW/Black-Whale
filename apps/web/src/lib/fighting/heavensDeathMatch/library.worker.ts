import { beginFight, createFight, tickFight } from '../engine'
import { FIGHT_FPS, FIXED_STEP } from '../fightClock'
import { createFightEnvironment } from '../fightEnvironment'
import { EMPTY_INPUT, type FightState } from '../types'
import { frontierBeat } from './chrolloPlan/phases'
import { historicalEnvironment, historicalSeats } from './historicalSetup'
import { historicalWindow, type HistoricalStartRequest } from './library'
import { DEATH_MATCH_FORMAT } from './loadout'

const MAX_PREPARATION_FRAMES = FIGHT_FPS * 240

/** Rebuild the actual bodies, wounds and hall at the requested point in a worker. */
function prepareHistoricalStart(request: HistoricalStartRequest): FightState | null {
  const window = historicalWindow(request.start)
  if (!window) return null
  const seats = historicalSeats(request.options.chrolloSide)
  const environment = historicalEnvironment(createFightEnvironment(), {
    ...request.options,
    playMode: 'scripted',
  })
  let state = beginFight(
    createFight(seats.player, seats.opponent, {
      mode: 'versus-ai',
      formatId: DEATH_MATCH_FORMAT,
      environment,
    }),
  )
  for (let frame = 0; frame < MAX_PREPARATION_FRAMES && state.phase === 'fighting'; frame += 1) {
    const world = state.deathMatch!
    if (frontierBeat(world.scenario) === window.from) {
      const options = window.to ? world.scenario.options : request.options
      return {
        ...state,
        environment: historicalEnvironment(state.environment, options),
        deathMatch: {
          ...world,
          scenario: { ...world.scenario, options },
          sequenceEnd: window.to,
        },
      }
    }
    state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, ai: true })
  }
  return null
}

self.onmessage = (event: MessageEvent<HistoricalStartRequest>) => {
  self.postMessage(prepareHistoricalStart(event.data))
}
