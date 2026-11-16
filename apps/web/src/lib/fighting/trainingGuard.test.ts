import { describe, expect, it } from 'vitest'
import { combatRoute } from './combatRoutes'
import { createCombatRouteFight } from './combatRouteFight'
import { tickFight } from './engine'
import { performTrainingAction } from './trainingAction'
import { setTrainingDummy } from './trainingSession'
import { prepareTrainingGuard } from './trainingGuard'
import { EMPTY_INPUT } from './types'

describe('training guard trials', () => {
  it('takes the first hit, then guards even after a dropped combo has reset its counter', () => {
    let state = createCombatRouteFight(combatRoute('hisoka:confirm'))
    state = performTrainingAction({ state, side: 'player', action: 'light' })
    for (let i = 0; i < 65; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(state.training?.firstHitTaken).toBe(true)
    expect(state.opponent.hitStun).toBe(0)
    expect(state.opponent.blocking).toBe(true)
    state = performTrainingAction({ state, side: 'player', action: 'light' })
    for (let i = 0; i < 20; i++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT })
    expect(state.impact?.blocked).toBe(true)
  })
  it('varies random guard by attempt, preserves its choice during startup, and leaves RNG untouched', () => {
    const fresh = setTrainingDummy(createCombatRouteFight(combatRoute('kurapika:confirm')), {
      behavior: 'random-guard',
    })
    const choices: boolean[] = []
    for (let frame = 0; frame < 50; frame++) {
      const started = performTrainingAction({
        state: { ...fresh, frame },
        side: 'player',
        action: 'light',
      })
      const prepared = prepareTrainingGuard(started)
      choices.push(prepared.training!.guardChoice!)
      expect(prepared.rng).toBe(started.rng)
      const later = prepareTrainingGuard({ ...prepared, frame: frame + 1 })
      expect(later.training!.guardChoice).toBe(prepared.training!.guardChoice)
    }
    expect(new Set(choices).size).toBe(2)
  })
})
