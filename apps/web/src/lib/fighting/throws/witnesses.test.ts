import { describe, expect, it } from 'vitest'
import {
  beginFight,
  createFight,
  performAttack,
  performMove,
  performThrow,
  tickFight,
} from '../engine'
import { selectThrowPerformance } from './selection'
import { FUTURE_PREPARATION_FRAMES } from '../parallelFutureTypes'
import { copyHistoricalObject, stampHistoricalPuppet } from '../chrolloHistoricalObjects'
import { performArsenalCommand } from '../retrospectiveArsenal'
import { EMPTY_INPUT, type FightState } from '../types'

function advance(state: FightState, frames: number) {
  for (let i = 0; i < frames; i++)
    state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, opponentInput: EMPTY_INPUT, ai: false })
  return state
}
function page(state: FightState, name: string) {
  return advance(
    performArsenalCommand(state, 'player', { action: 'history-page', target: name }),
    13,
  )
}

describe('the throw film witnesses real conditional manifestations', () => {
  it('borrows a real diverging forecast, never a preparation or a detached vision', () => {
    let state = beginFight(
      createFight('tserriednich', 'hisoka', { mode: 'versus-local', formatId: 'knockout' }),
    )
    state = {
      ...state,
      player: { ...state.player, x: 46, aura: 100 },
      opponent: { ...state.opponent, x: 51 },
    }
    state = advance(performAttack(state, 'player', 'special'), FUTURE_PREPARATION_FRAMES)
    expect(state.parallelFuture?.phase).toBe('vision')
    expect(selectThrowPerformance(state, 'player').future).toBeUndefined()
    state = performMove({ state, side: 'player', action: 'finisher' })
    expect(state.parallelFuture?.phase).toBe('diverging')
    state = advance(state, 1)
    state = performThrow(state, 'player', { ...EMPTY_INPUT, aura: true })
    expect(state.player.attack?.superThrow).toBe(true)
    const before = structuredClone(state)
    expect(selectThrowPerformance(state, 'player').future).toEqual({
      x: state.parallelFuture!.frames[state.parallelFuture!.cursor].player.x,
      y: state.parallelFuture!.frames[state.parallelFuture!.cursor].player.y,
    })
    expect(selectThrowPerformance(state, 'opponent').future).toBeUndefined()
    expect(state).toEqual(before)
  })

  it('can only borrow a real owned, ordered and intact nearby Gallery Fake puppet', () => {
    let state = beginFight(
      createFight('chrollo', 'hisoka', {
        mode: 'versus-local',
        environment: {
          preparation: { mode: 'scenario', resources: ['rooms', 'objects'], cohorts: [] },
        },
      }),
    )
    state = {
      ...state,
      player: { ...state.player, x: 18, aura: 100 },
      opponent: { ...state.opponent, x: 23 },
    }
    state = page(state, 'gallery-fake')
    state = advance(
      performMove({
        state,
        side: 'player',
        action: 'special',
        input: { ...EMPTY_INPUT, down: true },
      }),
      24,
    )
    state = copyHistoricalObject(state, 'player', 'opponent')
    const puppet = state.battlefield!.entities.find((entry) => entry.copy)!
    expect(puppet).toBeDefined()
    state = page(advance(state, 19), 'order-stamp')
    state = stampHistoricalPuppet(state, 'player', puppet.id)
    // Witness selection is isolated from the actor's recovery after the stamp command.
    const thrower = performThrow(beginFight(createFight('chrollo', 'hisoka')), 'player', {
      ...EMPTY_INPUT,
      aura: true,
    }).player.attack
    state = { ...state, player: { ...state.player, attack: thrower } }
    expect(selectThrowPerformance(state, 'player').puppetId).toBe(puppet.id)
    for (const change of [
      { present: false },
      { health: 0 },
      { x: 90 },
      { copy: { ...puppet.copy!, headAttached: false } },
    ]) {
      const missing = {
        ...state,
        battlefield: {
          ...state.battlefield!,
          entities: state.battlefield!.entities.map((entry) =>
            entry.id === puppet.id ? { ...entry, ...change } : entry,
          ),
        },
      }
      expect(selectThrowPerformance(missing, 'player').puppetId).toBeUndefined()
    }
  })
})
