import { describe, expect, it } from 'vitest'
import { beginFight, createFight, performAttack, performMove, tickFight } from './engine'
import { performArsenalCommand } from './retrospectiveArsenal'
import { privatePvpState } from './pvp/view'
import { FUTURE_PREPARATION_FRAMES } from './parallelFutureTypes'
import { EMPTY_INPUT, type FightState } from './types'

describe('roster calls remain deterministic across Parallel Future', () => {
  it('forecasts and then replays Black Voice against the same physically implanted body', () => {
    const base = beginFight(
      createFight('tserriednich', 'chrollo', { mode: 'versus-ai', formatId: 'knockout' }),
    )
    let state: FightState = {
      ...base,
      frame: 180,
      aiCooldown: 90,
      player: { ...base.player, x: 44, aura: 100 },
      opponent: {
        ...base.opponent,
        x: 49,
        aura: 100,
        chrolloBook: { pages: ['black-voice'], page: 0, open: true, bookmark: null },
      },
    }
    state = performArsenalCommand(state, 'opponent', { action: 'voice-arm' })
    state = performArsenalCommand(state, 'opponent', { action: 'voice-implant', target: 'player' })
    expect(state.player.blackVoiceControl).toMatchObject({ owner: 'opponent', active: false })
    state = { ...state, player: { ...state.player, x: 15 }, opponent: { ...state.opponent, x: 85 } }
    state = performAttack(state, 'player', 'special')
    for (let frame = 0; frame < FUTURE_PREPARATION_FRAMES; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: true })
    expect(state.parallelFuture?.phase).toBe('vision')
    const callIndex = state.parallelFuture!.frames.findIndex(
      (frame) => frame.command?.arsenal?.action === 'voice-stay',
    )
    expect(callIndex).toBeGreaterThanOrEqual(0)
    const predicted = state.parallelFuture!.frames[callIndex].player.blackVoiceControl!
    expect(state.rosterGuests).toBeUndefined()
    expect(
      performArsenalCommand(state, 'opponent', { action: 'voice-stay', target: 'player' }),
    ).toBe(state)
    const privateView = privatePvpState(state, 'player')
    expect(privateView.arsenalTrace).toBeUndefined()
    expect(privateView.parallelFuture!.frames.every((frame) => frame.command === null)).toBe(true)
    state = performMove({ state, side: 'player', action: 'finisher' })
    for (let frame = 0; frame <= callIndex; frame++)
      state = tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: true })
    expect(state.player.blackVoiceControl).toEqual(predicted)
    expect(state.rosterGuests).toBeUndefined()
  }, 30000)
})
